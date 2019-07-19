import { Component, OnInit, Output, Input } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Sort } from '../../services/sort.enum';
import { Order } from '../../services/order.enum';
import { Observable, Subject, fromEvent } from 'rxjs';
import { filter, mapTo, delay, take } from 'rxjs/operators';
import { SearchParams } from '../../interfaces/search-params';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
})
export class SearchComponent implements OnInit {
  searchForm = this.formBuilder.group({
    term: ['', Validators.required],
    sort: [''],
    order: [''],
    page: [undefined, Validators.min(1)],
    perPage: [undefined, [Validators.min(1), Validators.max(100)]],
    showMatch: [false],
  });

  sort = Sort;
  order = Order;

  @Input() searchParams:Subject<SearchParams>;
  @Input() count: number;

  // auto submit by keypress isn't working, possibly because of shadow dom, so use 
  // a stream instead, with a short delay to allow form.valueChanges to propogate
  @Output() trigger: Observable<boolean> = fromEvent(document, "keyup").pipe(
    filter((event:KeyboardEvent) => event.key === "Enter"),
    mapTo(true),
    delay(250),
  );

  constructor(
    private formBuilder: FormBuilder,
  ) { }

  ngOnInit() {
    this.searchForm.valueChanges.subscribe(this.searchParams);

    // set initial form values
    this.searchParams.asObservable().pipe(
      take(1),
    ).subscribe(this.searchForm.setValue.bind(this.searchForm));
  }
}
