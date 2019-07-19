import { TestBed, tick, fakeAsync } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController, TestRequest } from '@angular/common/http/testing';
import { GithubService } from './github.service';
import { HttpClient } from '@angular/common/http';
import { User, SearchResults } from '../interfaces/search-results';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
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
      fakeAsync(() => {
      githubService.results$.subscribe(
        query => expect(query).toEqual([]),
        fail
      )
      githubService.triggerSubject.next(true);
        tick(1000);
      httpTestingController.expectNone(GithubService.USER_SEARCH_URL);
    })
  })
  })

  const userSearch = (request) => request.method === 'GET' && request.url === GithubService.USER_SEARCH_URL;

  describe("When the query is populated", () => {
    beforeEach(() => {
      githubService.searchParamsSubject.next({ term: 'sausages' });
    });

    it("searches when triggered", () => {
      fakeAsync(() => {
      githubService.triggerSubject.next(true);
        tick(1000);
      httpTestingController.expectOne(userSearch);
      })
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

      describe('results body', () => {
        beforeEach(() => githubService.triggerSubject.next(true));
        it("outputs the count", () => {
          fakeAsync(() => {
          githubService.count$.subscribe(
            count => expect(count).toEqual(91),
            fail
          );
            tick(1000);
          request().flush(someResults);
          })
        });
  
        it("outputs the user list", () => {
          fakeAsync(() => {
          githubService.results$.subscribe(
            users => expect(users[0].login).toEqual("bob@example.com"),
            fail
          );
            tick(1000);
          request().flush(someResults);
        });
        });

        xit("retries on error", (done) => {
          // const serverErrorSpy = spyOn(httpClient, 'get').and.returnValue(of({ status: 500, statusText: 'Server Error' }));

          // expect(serverErrorSpy).toHaveBeenCalled();
          githubService.triggerSubject.next(true)
          // const requests = httpTestingController.match(request => {
          //   return request.method === 'GET' && request.url === GithubService.userSearchUrl;
          // });
          // expect(requests.length).toBe(3);

          request().flush('whoops!', { status: 500, statusText: 'Server Error' });
          request().flush('whoops!', { status: 500, statusText: 'Server Error' });
          request().flush('whoops!', { status: 500, statusText: 'Server Error' });
          request().flush(someResults);
          done();
        })
  
      })

      describe('the headers', () => {
        beforeEach(() => {
          githubService.searchParamsSubject.next({ term: 'sausages', showMatch: true });
          githubService.triggerSubject.next(true);
        });

        it("sets the header requesting textmatch", () => {
          fakeAsync(() => {
          const request = httpTestingController.expectOne(req => /text-match\+json/.test(req.headers.get('accept')));
            tick(1000);
          request.flush(someResults);
        })
      })
      })

      describe('the params', () => {
        beforeEach(() => {
          githubService.searchParamsSubject.next({
            term: 'wibble',
            sort: Sort.repos,
            page: 99,
            perPage: 4
          });
          githubService.triggerSubject.next(true);
        });

        it("sets the query", () => {
          fakeAsync(() => {
          const request = httpTestingController.expectOne(req => new RegExp("q=wibble").test(req.urlWithParams));
            tick(1000);
          request.flush(someResults);
          });
        })

        it("sets sort", () => {
          fakeAsync(() => {
          const request = httpTestingController.expectOne(req => new RegExp("sort=repositories").test(req.urlWithParams));
            tick(1000);
          request.flush(someResults);
          });
        })

        it("sets page", () => {
          fakeAsync(() => {
          const request = httpTestingController.expectOne(req => new RegExp("page=99").test(req.urlWithParams));
            tick(1000);
          request.flush(someResults);
          });
        })

        it("sets per-page", () => {
          fakeAsync(() => {
          const request = httpTestingController.expectOne(req => new RegExp("per_page=4").test(req.urlWithParams));
            tick(1000);
          request.flush(someResults);
          });
        })
      })
    })
  })
});
