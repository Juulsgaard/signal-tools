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

  private _completed = false;
  get completed() {
    return this._completed
  };

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

    const request$ = isObservable(request) ? request.pipe(take(1)) : from(request);

    this.sub = request$.subscribe({
      next: x => this.onValue(x),
      error: x => this.onError(x),
      complete: () => this.onCompleted()
    });
  }

  private onError(error: unknown | Error): void {
    if (this.completed) return;
    this._completed = true;

    this._request$.error(error);

    this._result$.complete();

    this._loading.set(false);
    this._error.set(parseError(error));
  }

  private onValue(value: T) {
    if (this.completed) return;
    this._completed = true;

    this._request$.next(value);
    this._request$.complete();

    this._result$.next(value);
    this._result$.complete();

    this._loading.set(false);
    this._result.set(value);
  }

  private onCompleted() {
    if (this.completed) return;
    this._completed = true;

    this._request$.complete();
    this._result$.complete();
    this._loading.set(false);
  }

  cancel(error?: string | Error | (() => Error)): boolean {
    if (this.completed) return false;

    this.sub.unsubscribe();
    const fullError = isString(error) ? new CancelledError(error) : isFunction(error) ? error() : error;
    this.onError(fullError);

    return true;
  }
}
