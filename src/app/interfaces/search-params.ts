import { Sort } from '../services/sort.enum';
import { Order } from '../services/order.enum';
import { HttpParams } from '@angular/common/http';

export interface SearchParams extends HttpParams {
    q: string;
    page: number;
    per_page: number;
    sort: Sort;
    order: Order;
}
