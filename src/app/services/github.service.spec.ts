import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController, TestRequest } from '@angular/common/http/testing';
import { GithubService } from './github.service';
import { HttpClient } from '@angular/common/http';
import { User, SearchResults } from '../interfaces/search-results';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { debug } from '../helpers/rxjs-helpers';
import { Sort } from './sort.enum';

describe('GithubService', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let githubService: GithubService;
  const doneSubj: Subject<any> = new Subject();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        GithubService
      ]
    });

    httpClient = TestBed.get(HttpClient);
    httpTestingController = TestBed.get(HttpTestingController);
    githubService = new GithubService(httpClient);
    githubService.results$.pipe(
      takeUntil(doneSubj),
    ).subscribe();
  });

  afterAll(() => doneSubj.next());

  it('should be created', () => {
    expect(githubService).toBeTruthy();
  });

  describe("When the query is empty", () => {
    it("doesn't search when triggered", () => {
      githubService.querySubject.subscribe(
        query => expect(query).toEqual(''),
        fail
      )
      githubService.triggerSubject.next(true);
      httpTestingController.expectNone(GithubService.userSearchUrl);
    })
  })

  const userSearch = (request) => request.method === 'GET' && request.url === GithubService.userSearchUrl;

  describe("When the query is populated", () => {
    beforeEach(() => {
      githubService.querySubject.next('sausages');
    });

    it("searches when triggered", () => {
      githubService.triggerSubject.next(true);
      httpTestingController.expectOne(userSearch);
    });

    describe("the search", () => {
      let someResults:SearchResults;
      const request = () => httpTestingController.expectOne(userSearch);

      beforeEach(() => {
        someResults = {
          total_count: 91,
          incomplete_results: false,
          items: [
            <User>{
              login: "bob@example.com"
            },
            <User>{
              login: "sally@example.com"
            },
          ]
        }
      })

      afterEach(() => {
        // After every test, assert that there are no more pending requests.
        httpTestingController.verify();
      });

      describe('results body', () => {
        beforeEach(() => githubService.triggerSubject.next(true));
        it("outputs the count", () => {
          githubService.count$.subscribe(
            count => expect(count).toEqual(91),
            fail
          );
          request().flush(someResults);
        });
  
        it("outputs the user list", () => {
          githubService.results$.subscribe(
            users => expect(users[0].login).toEqual("bob@example.com"),
            fail
          );
          request().flush(someResults);
        });
  
      })

      describe('the headers', () => {
        beforeEach(() => {
          githubService.textMatchSubject.next(true);
          githubService.triggerSubject.next(true);
        });

        it("sets the header requesting textmatch", () => {
          const request = httpTestingController.expectOne(req => /text-match\+json/.test(req.headers.get('accept')));
          request.flush(someResults);
        })
      })

      describe('the params', () => {
        beforeEach(() => {
          githubService.querySubject.next('wibble');
          githubService.sortSubject.next(Sort.repos);
          githubService.currentPageSubject.next(99);
          githubService.perPageSubject.next(4);
          githubService.triggerSubject.next(true);
        });

        it("sets the query", () => {
          const request = httpTestingController.expectOne(req => new RegExp("q=wibble").test(req.urlWithParams));
          request.flush(someResults);
        })

        it("sets sort", () => {
          const request = httpTestingController.expectOne(req => new RegExp("sort=repositories").test(req.urlWithParams));
          request.flush(someResults);
        })

        it("sets page", () => {
          const request = httpTestingController.expectOne(req => new RegExp("page=99").test(req.urlWithParams));
          request.flush(someResults);
        })

        it("sets per-page", () => {
          const request = httpTestingController.expectOne(req => new RegExp("per_page=4").test(req.urlWithParams));
          request.flush(someResults);
        })
      })
    })
  })
});
