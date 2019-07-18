import { Sort } from '../services/sort.enum';
import { Order } from '../services/order.enum';

export interface SearchParams {
    term: string;
    sort: Sort;
    order: Order;
    page: number;
    perPage: number;
    showMatch: boolean;
}