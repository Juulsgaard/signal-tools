import {EMPTY} from "rxjs";
import {Signal, signal} from "@angular/core";
import {IValueRequestState} from "./request-state";

/**
 * An Empty RequestState
 * @category RequestState
 */
export class EmptyRequestState<T> extends IValueRequestState<T> {
  readonly request$ = EMPTY;
  readonly result$ = this.request$;
  readonly result = signal(undefined).asReadonly();

  readonly loading: Signal<false> = signal(false);
  readonly error: Signal<undefined> = signal(undefined);
  readonly failed: Signal<false> = signal(false);

  cancel(): boolean {
    return false;
  }
}
