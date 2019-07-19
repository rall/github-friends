import { Component, OnInit, Input } from '@angular/core';
import { User } from 'src/app/interfaces/search-results';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss'],
})
export class UserComponent implements OnInit {
  @Input() user:User;

  private avatarUrl: string;
  
  constructor(
  ) { }

  ngOnInit() {
    this.avatarUrl = this.setAvatarUrl();
  }

  private setAvatarUrl() {
    const avatarUrl = new URL(this.user.avatar_url);
    avatarUrl.searchParams.set("size", "100");
    return avatarUrl.href;    
  }
}
