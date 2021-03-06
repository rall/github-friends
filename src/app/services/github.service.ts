import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Subject, BehaviorSubject, combineLatest, Observable, of, NEVER, merge, interval } from 'rxjs';
import { Sort } from './sort.enum';
import { Order } from './order.enum';
import { filterPresent, filterTrue, filterFalse } from '../helpers/rxjs-helpers';
import { sample, map, switchMap, share, pluck, catchError, scan, debounceTime, filter, mergeMap, distinctUntilChanged, auditTime, switchMapTo, takeUntil } from 'rxjs/operators';
import { User, SearchResults } from '../interfaces/search-results';
import { retryBackoff, RetryBackoffConfig } from 'backoff-rxjs'
import { SearchParams } from '../interfaces/search-params';
import { UserExtras } from '../interfaces/user-extras';

@Injectable({
  providedIn: 'root'
})
export class GithubService {
  static HOST_NAME = "api.github.com";
  static BASE_URL = `https://${GithubService.HOST_NAME}/search/`;
  static USER_SEARCH_URL = `${GithubService.BASE_URL}users`;
  static RATE_LIMIT_URL = `https://${GithubService.HOST_NAME}/rate_limit`;
  static TEXT_MATCH_HEADER = "application/vnd.github.v3.text-match+json";

  static INITIAL_PARAMS:SearchParams = {
    term: '',
    sort: Sort.repos,
    order: Order.desc,
    page: 1,
    perPage: 20,
    showMatch: false
  }

  searchParamsSubject: BehaviorSubject<SearchParams> = new BehaviorSubject(GithubService.INITIAL_PARAMS);
  triggerSubject: Subject<boolean> = new Subject();

  results$: Observable<User[]>;
  count$: Observable<number>;
  partial$: Observable<boolean>;

  rateLimitedSubject: BehaviorSubject<boolean> = new BehaviorSubject(false);

  constructor(private http: HttpClient) {
    const rateLimited$ = this.rateLimitedSubject.pipe(
      filterTrue(),
    );
    const unlimited$ = this.rateLimitedSubject.pipe(
      filterFalse(),
    );

    const queryParam$ = this.searchParamsSubject.pipe(
      pluck("term"),
      distinctUntilChanged(),
      filterPresent(),
      sample(this.triggerSubject),
      map<string, [string, string]>(query => ["q", query]),
      share(),
    );

    const perPageParam$ = this.searchParamsSubject.pipe(
      pluck('perPage'),
      auditTime(1000),
      distinctUntilChanged(),
      filterTrue(),
      map<number, [string, string]>(per => ["per_page", String(per)]),
    );

    const currentPageParam$ = this.searchParamsSubject.pipe(
      pluck('page'),
      auditTime(1000),
      distinctUntilChanged(),
      filter(page => page > 0),
      map<number, [string, string]>(page => ["page", String(page)]),
    );

    const sortParam$ = this.searchParamsSubject.pipe(
      pluck('sort'),
      distinctUntilChanged(),
      filterTrue(),
      map<Sort, [string, string]>(sort => ["sort", String(sort)]),
    );

    const orderParam$ = this.searchParamsSubject.pipe(
      pluck('order'),
      distinctUntilChanged(),
      filterTrue(),
      map<Order, [string, string]>(order => ["order", String(order)]),
    );

    const params$:Observable<HttpParams> = merge(
      queryParam$,
      perPageParam$,
      currentPageParam$,
      sortParam$,
      orderParam$,
    ).pipe(
      debounceTime(1000),
      scan<[string, string], HttpParams>((params, tuple) => params.set(...tuple), new HttpParams()),
      filter(params => params.has("q")),
      share(),
    );

    const headers$:Observable<HttpHeaders> = this.searchParamsSubject.pipe(
      pluck("showMatch"),
      map(textMatch => textMatch ? new HttpHeaders({ Accept: GithubService.TEXT_MATCH_HEADER }) : undefined),
      distinctUntilChanged(),
    );

    const search$ = combineLatest(params$, headers$, queryParam$).pipe(
      switchMap(([params, headers]) => this.http.get<SearchResults>(GithubService.USER_SEARCH_URL, { headers: headers, params: params }).pipe(
        retryBackoff(<RetryBackoffConfig>{
          initialInterval: 1000,
          maxRetries: 3,
          shouldRetry: (error:HttpErrorResponse) => error.status !== 404 && error.status !== 403,
        }),
        catchError(err => {
          return err.status < 500 ? NEVER : of(err);
        }),
      )),
      share(),
    )

    this.results$ = search$.pipe(
      pluck("items"),
    );

    this.count$ = search$.pipe(
      pluck("total_count"),
    );

    this.partial$ = search$.pipe(
      pluck("incomplete_results"),
    );

    /*  
    THE RATE LIMIT
    check current remainning requests after each search and polling when we're limited
    */
   
    const rateLimitPoller$ = rateLimited$.pipe(
      switchMapTo(interval(3000).pipe(
        takeUntil(unlimited$),
      ))
    );

    merge(search$, rateLimitPoller$).pipe(
      switchMapTo(this.http.get(GithubService.RATE_LIMIT_URL)),
      pluck("resources", "search", "remaining"),
      map(remaining => remaining === 0),
    ).subscribe(this.rateLimitedSubject);
  }

  getUserExtras(url: string) {
    return of(url).pipe(
      mergeMap(url => this.http.get<UserExtras>(url).pipe(
        retryBackoff(<RetryBackoffConfig>{
          initialInterval: 1,
          maxRetries: 3,
          shouldRetry: (error:HttpErrorResponse) => error.status !== 404 && error.status !== 403,
        }),
      )),
    );        
  }
}


