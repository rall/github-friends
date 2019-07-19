import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchComponent } from './search.component';
import { ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { IonicModule } from '@ionic/angular';

describe('SearchComponent', () => {
  let component: SearchComponent;
  let fixture: ComponentFixture<TestComponentWrapper>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ 
        TestComponentWrapper,
        SearchComponent
      ],
      imports: [
        ReactiveFormsModule,
        IonicModule
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestComponentWrapper);
    component = fixture.debugElement.children[0].componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

@Component({
  selector: 'test-component-wrapper',
  template: '<app-search [searchParams]="searchParams"></app-search>'
})
class TestComponentWrapper {
  searchParams:Subject<any> = new Subject();
}
