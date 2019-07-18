import { Component, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { debug } from '../helpers/rxjs-helpers';
import { SearchParams } from '../interfaces/search-params';
import { Order } from '../services/order.enum';
import { Sort } from '../services/sort.enum';
import { GithubService } from '../services/github.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  constructor(
    private githubService: GithubService
  ) {}

  searchParamsSubject: BehaviorSubject<SearchParams> = new BehaviorSubject({
    term: '',
    sort: Sort.repos,
    order: undefined,
    page: 1,
    perPage: 20,
    showMatch: false
  })

  ngOnInit() {
    this.searchParamsSubject.pipe(
      debug('searchParamsSubject')
    ).subscribe();
  }

  doSearch(value:boolean) {
    console.log('do search');
    this.githubService.triggerSubject.next(value);
  }
}
