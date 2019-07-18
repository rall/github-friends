import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Subject, BehaviorSubject, combineLatest, Observable, of, NEVER } from 'rxjs';
import { Sort } from './sort.enum';
import { Order } from './order.enum';
import { filterPresent } from '../helpers/rxjs-helpers';
import { sample, map, switchMap, share, pluck, catchError } from 'rxjs/operators';
import { User, SearchResults } from '../interfaces/search-results';
import { retryBackoff, RetryBackoffConfig } from 'backoff-rxjs'

@Injectable({
  providedIn: 'root'
})
export class GithubService {
  static hostName = "api.github.com";
  static baseUrl = `https://${GithubService.hostName}/search/`;
  static userSearchUrl = `${GithubService.baseUrl}users/`;
  static textMatchHeader = "application/vnd.github.v3.text-match+json";

  querySubject: Subject<string> = new Subject();
  perPageSubject: BehaviorSubject<number> = new BehaviorSubject(10);
  currentPageSubject: BehaviorSubject<number> = new BehaviorSubject(1);
  textMatchSubject: BehaviorSubject<boolean> = new BehaviorSubject(false);
  sortSubject: BehaviorSubject<Sort> = new BehaviorSubject(Sort.default);
  orderSubject: BehaviorSubject<Order> = new BehaviorSubject(Order.desc);

  triggerSubject: Subject<boolean> = new Subject();

  results$: Observable<User[]>;
  count$: Observable<number>;
  partial$: Observable<boolean>;

  constructor(
    private http: HttpClient,
    ) {
      const query$ = this.querySubject.pipe(
        filterPresent(),
        sample(this.triggerSubject),
      );

      const params$:Observable<HttpParams> = combineLatest(
        query$,
        this.perPageSubject,
        this.currentPageSubject,
        this.sortSubject,
        this.orderSubject,
      ).pipe(
        map(([query, perPage, page, sort, order]) => new HttpParams().
            set("q", query).
            set("per_page", String(perPage)).
            set("page", String(page)).
            set("sort", String(sort)).
            set("order", String(order))
        ),
      );
      
      const headers$:Observable<HttpHeaders> = this.textMatchSubject.pipe(
        map(textMatch => textMatch ? new HttpHeaders({ Accept: GithubService.textMatchHeader }) : undefined),
      );

      const search$ = combineLatest(params$, headers$).pipe(
        switchMap(([params, headers]) => this.http.get<SearchResults>(GithubService.userSearchUrl, { headers: headers, params: params })),
        retryBackoff(<RetryBackoffConfig>{
          initialInterval: 1,
          maxRetries: 3,
          shouldRetry: (error:HttpErrorResponse) => {
            console.log('should retry', error.status !== 404);
            return error.status !== 404;
          },
        }),
        catchError(err => err.status < 500 ? NEVER : of(err)),
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
}
