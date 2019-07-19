import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { HomePage } from './home.page';
import { SearchComponent } from './search/search.component';
import { UserComponent } from './user/user.component';
import { UserExtrasComponent } from './user-extras/user-extras.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild([
      {
        path: '',
        component: HomePage
      }
    ]),
    ReactiveFormsModule,
  ],
  declarations: [
    HomePage,
    SearchComponent,
    UserComponent,
    UserExtrasComponent,
  ],
  entryComponents: [
    SearchComponent,
  ]
})
export class HomePageModule {}
