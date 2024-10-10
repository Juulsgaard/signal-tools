import {EMPTY, Observable, throwError} from "rxjs";
import {Signal, signal} from "@angular/core";
import {IValueRequestState} from "./request-state";

/**
 * A RequestState which always emits an error
 * @category RequestState
 */
export class ErrorRequestState<T> extends IValueRequestState<T> {

  readonly request$: Observable<never>;
  readonly result$ = EMPTY;
  readonly result = signal(undefined).asReadonly();

  readonly loading: Signal<boolean> = signal(false);
  readonly error: Signal<Error | undefined>;
  readonly failed: Signal<boolean> = signal(true);

  constructor(getError: () => Error) {
    super();

    this.error = signal(getError());
    this.request$ = throwError(getError);
  }

  cancel(): boolean {
    return false;
  }
}
