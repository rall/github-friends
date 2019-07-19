import { Component } from '@angular/core';
import { Subject } from 'rxjs';
import { SearchParams } from '../interfaces/search-params';
import { GithubService } from '../services/github.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  constructor(
    public githubService: GithubService
  ) {}

  searchParamsSubject: Subject<SearchParams> = new Subject();

  doSearch(value:boolean) {
    this.githubService.triggerSubject.next(value);
  }
}
