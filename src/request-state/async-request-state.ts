import {from, isObservable, Observable, ReplaySubject, Subscription, take} from "rxjs";
import {computed, signal} from "@angular/core";
import {isFunction, isString, parseError} from "@juulsgaard/ts-tools";
import {CancelledError} from "@juulsgaard/rxjs-tools";
import {IValueRequestState} from "./request-state";

/**
 * A RequestState representing a pending async action
 * @category RequestState
 */
export class AsyncRequestState<T> extends IValueRequestState<T> {

  private readonly _request$ = new ReplaySubject<T>();
  readonly request$ = this._request$.asObservable();

  private readonly _result$ = new ReplaySubject<T>();
  readonly result$ = this._result$.asObservable();

  private readonly _result = signal<T | undefined>(undefined);
  readonly result = this._result.asReadonly();

  private readonly _loading = signal(true);
  readonly loading = this._loading.asReadonly();

  private readonly _error = signal<Error | undefined>(undefined);
  readonly error = this._error.asReadonly();
  readonly failed = computed(() => this._error() !== undefined);

  private readonly sub: Subscription;

  constructor(request: Promise<T> | Observable<T>) {
    super();

    const request$ = isObservable(request)
      ? request.pipe(take(1))
      : from(request);

    this.sub = request$.subscribe(this._request$);

    this.request$.subscribe({
      next: value => {
        this._result$.next(value);
        this._result.set(value);
      },
      error: error => {
        this._error.set(parseError(error));
        this._result$.complete();
        this._loading.set(false);
      },
      complete: () => {
        this._result$.complete();
        this._loading.set(false);
      }
    });
  }

  cancel(error?: string | Error | (() => Error)): boolean {
    if (this.sub.closed) return false;
    this.sub.unsubscribe();
    const fullError = isString(error) ? new CancelledError(error) : isFunction(error) ? error() : error;
    this._request$.error(fullError);
    return true;
  }
}
