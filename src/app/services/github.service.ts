import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Subject, BehaviorSubject, combineLatest, Observable, of, NEVER, merge } from 'rxjs';
import { Sort } from './sort.enum';
import { Order } from './order.enum';
import { filterPresent, debug, filterTrue } from '../helpers/rxjs-helpers';
import { sample, map, switchMap, share, pluck, catchError, scan, debounceTime, filter, mergeMap, distinctUntilChanged, retry } from 'rxjs/operators';
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

  constructor(private http: HttpClient) {
    const queryParam$ = this.searchParamsSubject.pipe(
      pluck("term"),
      distinctUntilChanged(),
      filterPresent(),
      sample(this.triggerSubject),
      map<string, [string, string]>(query => ["q", query]),
      debug('query'),
      share(),
    );

    const perPageParam$ = this.searchParamsSubject.pipe(
      pluck('perPage'),
      debounceTime(500),
      distinctUntilChanged(),
      debug('perPage'),
      filterTrue(),
      map<number, [string, string]>(per => ["per_page", String(per)]),
      share(),
    );

    const currentPageParam$ = this.searchParamsSubject.pipe(
      pluck('page'),
      debounceTime(500),
      distinctUntilChanged(),
      debug('page'),
      filter(page => page > 0),
      map<number, [string, string]>(page => ["page", String(page)]),
      share(),
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
      debug('merge'),
      scan<[string, string], HttpParams>((params, tuple) => params.set(...tuple), new HttpParams()),
      debounceTime(1000),
      filter(params => params.has("q")),
    );

    params$.pipe(
      map(p => p.toString()),
      debug('params'),
    ).subscribe();

    const headers$:Observable<HttpHeaders> = this.searchParamsSubject.pipe(
      pluck("showMatch"),
      map(textMatch => textMatch ? new HttpHeaders({ Accept: GithubService.TEXT_MATCH_HEADER }) : undefined),
    );

    const search$ = combineLatest(params$, headers$, queryParam$).pipe(
      switchMap(([params, headers]) => this.http.get<SearchResults>(GithubService.USER_SEARCH_URL, { headers: headers, params: params }).pipe(
        retryBackoff(<RetryBackoffConfig>{
          initialInterval: 1000,
          maxRetries: 3,
          shouldRetry: (error:HttpErrorResponse) => error.status !== 404 && error.status !== 403,
        }),
        catchError(err => {
          console.log('in catch', err.status);
          return err.status < 500 ? NEVER : of(err);
        }),
      )),
      debug('search'),
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
