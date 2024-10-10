import {Subject} from "rxjs";
import {Signal, signal} from "@angular/core";
import {IValueRequestState} from "./request-state";

/**
 * A RequestState which is perpetually loading
 * @category RequestState
 */
export class LoadingRequestState<T> extends IValueRequestState<T> {
  private readonly _request$ = new Subject<T>();
  readonly request$ = this._request$.asObservable();
  readonly result$ = this.request$;
  readonly result = signal(undefined).asReadonly();

  private readonly _loading = signal(true);
  readonly loading: Signal<boolean> = this._loading.asReadonly();
  readonly error: Signal<undefined> = signal(undefined);
  readonly failed: Signal<false> = signal(false);

  cancel(): boolean {
    if (this._request$.closed) return false;
    this._request$.complete();
    this._loading.set(false);
    return false;
  }
}
