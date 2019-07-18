import { Observable } from 'rxjs';
import { tap, filter } from 'rxjs/operators';

export function debug<T>(message:any) {
    return (observable$: Observable<T>): Observable<T> => {
        return observable$.pipe(
            tap<T>(val => console.info(message, val), console.error, () => console.log(message, 'COMPLETED'))
        );
    }
}

export function filterTrue<T>() {
    return (observable$: Observable<T>): Observable<T> => {
        return observable$.pipe(
            filter<T>(Boolean),
        );
    }
}

export function filterFalse<T>() {
    return (observable$: Observable<T>): Observable<T> => {
        return observable$.pipe(
            filter<T>(val => !val),
        );
    }
}

interface Collection {
    length: number;
}

export function filterEmpty<T extends Collection>() {
    return (observable$: Observable<T>): Observable<T> => {
        return observable$.pipe(
            filter<T>(collection => collection.length === 0)
        );
    }
}

export function filterPresent<T extends Collection>() {
    return (observable$: Observable<T>): Observable<T> => {
        return observable$.pipe(
            filter<T>(collection => collection.length > 0)
        );
    }
}
