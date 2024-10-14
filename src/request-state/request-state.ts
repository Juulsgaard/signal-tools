import {first, Observable, Observer, Subscribable, Unsubscribable} from "rxjs";
import {Signal} from "@angular/core";
import {parseError} from "@juulsgaard/ts-tools";

/**
 * A class representing the state of a request
 * @category RequestState
 */
export abstract class IRequestState implements Subscribable<unknown> {
  /** The underlying request */
  abstract readonly request$: Observable<unknown>;
  /** The result of the request */
  abstract readonly result$: Observable<unknown>;

  /** The result of the request, or undefined when unresolved */
  abstract readonly result: Signal<unknown | undefined>;
  /** Emits true when the request is running */
  abstract readonly loading: Signal<boolean>;
  /** Emits the error if one is thrown by the request. Otherwise undefined */
  abstract readonly error: Signal<Error | undefined>;
  /** Emits true if the request failed */
  abstract readonly failed: Signal<boolean>;

  /** Cancel a running request */
  abstract cancel(): boolean;

  /**
   * Perform actions when the request finishes
   * @param onValue - Action to perform on successful resolution
   * @param onError - Action to perform on error
   */
  abstract then(onValue: (value: unknown) => void, onError?: (error: Error) => void): this;

  asPromise(): Promise<unknown> {
    return new Promise<unknown>((resolve, reject) => this.then(resolve, reject));
  }

  /**
   * Perform an action if the request fails
   * @param onError
   */
  abstract catch(onError: (error: Error) => void): this;

  /**
   * Perform an action when the request finishes (Error or Success)
   * @param onComplete
   */
  abstract finally(onComplete: (error?: Error) => void): this;

  /**
   * Subscribe to the underlying request Observable
   * @param observer
   */
  subscribe(observer: Partial<Observer<unknown>>): Unsubscribable {
    return this.request$.subscribe(observer);
  }
}

/**
 * A class representing the state of a request with a known return type
 * @category RequestState
 */
export abstract class IValueRequestState<T> extends IRequestState implements Subscribable<T> {
  abstract override readonly request$: Observable<T>;
  abstract override readonly result$: Observable<T>;
  abstract override readonly result: Signal<T | undefined>;

  override subscribe(observer: Partial<Observer<T>>): Unsubscribable {
    return this.request$.subscribe(observer);
  }

  then(onValue: (value: T) => void, onError?: (error: Error) => void): this {
    this.request$.pipe(first()).subscribe({
      next: v => onValue(v),
      error: e => onError?.(parseError(e))
    });
    return this;
  }

  catch(onError: (error: Error) => void): this {
    this.request$.subscribe({
      error: e => onError(parseError(e))
    });
    return this;
  }

  finally(onComplete: (error?: Error) => void): this {
    this.request$.subscribe({
      error: e => onComplete(parseError(e)),
      complete: () => onComplete()
    });
    return this;
  }

  override asPromise(): Promise<T> {
    return new Promise<T>((resolve, reject) => this.then(resolve, reject));
  }

  /**
   * Cancel a running request
   * @param error - Optionally provide a custom error to throw when cancelling the request
   */
  abstract override cancel(error?: string|Error|(() => Error)): boolean;
}

