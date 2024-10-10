import {ReplaySubject} from "rxjs";
import {computed, signal} from "@angular/core";
import {isFunction, isString, parseError} from "@juulsgaard/ts-tools";
import {CancelledError} from "@juulsgaard/rxjs-tools";
import {IValueRequestState} from "./request-state";

/**
 * A manually populated RequestState
 * @category RequestState
 */
export class WritableRequestState<T> extends IValueRequestState<T> {

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

  private readonly _cancelled = signal(false);
  /** Emits true when the RequestState has been cancelled by a consumer, otherwise emits false */
  readonly cancelled = this._cancelled.asReadonly();
  private readonly _cancelled$ = new ReplaySubject<true>();
  /** Emits true when the RequestState has been cancelled by a consumer */
  readonly cancelled$ = this._cancelled$.asObservable();

  constructor(private readonly onCancel?: () => void) {
    super();
  }

  /**
   * Create a Readonly version of the RequestState
   */
  asReadonly(): IValueRequestState<T> {
    return this;
  }

  /**
   * Set the RequestState to an Error state
   * @param error - The error for the RequestState
   */
  setError(error: unknown | Error): void {
    if (this.completed) return;

    this._completed = true;
    this._request$.error(error);
    this._result$.complete();
    this._loading.set(false);
    this._error.set(parseError(error));
  }

  /**
   * Set the RequestState to a completed state with a given value
   * @param value - The value to emit
   */
  setValue(value: T) {
    if (this.completed) return;

    this._completed = true;
    this._request$.next(value);
    this._request$.complete();
    this._loading.set(false);
    this._result.set(value);
  }

  cancel(error?: string | Error | (() => Error)) {
    if (this.completed) return false;

    const fullError = isString(error) ? new CancelledError(error) : isFunction(error) ? error() : error;
    this.setError(fullError);

    this._cancelled.set(true);
    this._cancelled$.next(true);
    this._cancelled$.complete();

    this.onCancel?.();
    return true;
  }
}
