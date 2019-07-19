import { Component, OnInit, Input } from '@angular/core';
import { User } from '../../interfaces/search-results';
import { Observable, BehaviorSubject } from 'rxjs';
import { filterTrue } from '../../helpers/rxjs-helpers';
import { UserExtras } from '../../interfaces/user-extras';
import { take, mergeMap, mapTo, shareReplay } from 'rxjs/operators';
import { GithubService } from '../../services/github.service';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss'],
})
export class UserComponent implements OnInit {
  @Input() user:User;

  private avatarUrl: string;

  extras$: Observable<UserExtras>;

  showExtras:BehaviorSubject<boolean> = new BehaviorSubject(false);
  
  constructor(
    private githubService:GithubService,
  ) { }

  ngOnInit() {
    this.avatarUrl = this.setAvatarUrl();

    this.extras$ = this.showExtras.pipe(
      filterTrue(),
      take(1),
      mapTo(this.user.url),
      mergeMap(this.githubService.getUserExtras.bind(this.githubService)),
      shareReplay(1),
    );
  }

  private setAvatarUrl() {
    const avatarUrl = new URL(this.user.avatar_url);
    avatarUrl.searchParams.set("size", "100");
    return avatarUrl.href;
  }

  toggleExtras(payload:{ checked: boolean }) {
    this.showExtras.next(payload.checked);
  }
}
