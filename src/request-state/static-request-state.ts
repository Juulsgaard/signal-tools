import {Observable, of} from "rxjs";
import {signal, Signal} from "@angular/core";
import {IValueRequestState} from "./request-state";

/**
 * A RequestState which always returns the same value immediately
 * @category RequestState
 */
export class StaticRequestState<T> extends IValueRequestState<T> {

  readonly request$: Observable<T>;
  readonly result$: Observable<T>;
  readonly result: Signal<T>;

  readonly loading: Signal<false> = signal(false);
  readonly error: Signal<undefined> = signal(undefined);
  readonly failed: Signal<false> = signal(false);

  constructor(private readonly value: T) {
    super();

    this.request$ = of(value);
    this.result$ = this.request$;
    this.result = signal(value);

  }

  cancel(): boolean {
    return false;
  }

  override then(next: (value: T) => void, _error?: (error: Error) => void): this {
    next(this.value);
    return this;
  }

  override catch(_onError: (error: Error) => void): this {
    return this;
  }

  override finally(onComplete: () => void): this {
    onComplete();
    return this;
  }
}
