import { Component, Input } from '@angular/core';
import { UserExtras } from 'src/app/interfaces/user-extras';

@Component({
  selector: 'app-user-extras',
  templateUrl: './user-extras.component.html',
  styleUrls: ['./user-extras.component.scss'],
})
export class UserExtrasComponent {

  @Input() extras:UserExtras;

  constructor() { }
}
