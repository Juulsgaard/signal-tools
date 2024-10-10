import {delay, isObservable, Observable, of} from "rxjs";
import {isPromise} from "rxjs/internal/util/isPromise";
import {IRequestState, IValueRequestState} from "./request-state";
import {WritableRequestState} from "./writable-request-state";
import {AsyncRequestState} from "./async-request-state";
import {StaticRequestState} from "./static-request-state";
import {ErrorRequestState} from "./error-request-state";
import {LoadingRequestState} from "./loading-request-state";
import {EmptyRequestState} from "./empty-request-state";

/**
 * Create a RequestState from a request or Value
 * @param data - The request or value
 * @category RequestState
 */
function valueRequestState<T>(data: T | Promise<T> | Observable<T>): IValueRequestState<T> {
  if (isObservable(data)) return new AsyncRequestState<T>(data);
  if (isPromise(data)) return new AsyncRequestState<T>(data);
  return new StaticRequestState<T>(data);
}


function errorRequestState(error: Error | (() => Error)): IRequestState;
function errorRequestState<T>(error: Error | (() => Error)): IValueRequestState<T>;
function errorRequestState<T>(error: Error | (() => Error)): IValueRequestState<T> {
  return new ErrorRequestState(error instanceof Error ? () => error : error);
}


function loadingRequestState(): IRequestState;
function loadingRequestState<T>(): IValueRequestState<T>;
function loadingRequestState(duration: number): IRequestState;
function loadingRequestState<T>(duration: number, value: T): IValueRequestState<T>;
function loadingRequestState<T>(duration?: number, value?: T): IRequestState | IValueRequestState<T> {
  if (duration === undefined) return new LoadingRequestState<T>();
  return valueRequestState(of(value).pipe(delay(duration)));
}

function emptyRequestState(): IRequestState;
function emptyRequestState<T>(): IValueRequestState<T>;
function emptyRequestState<T>(): IValueRequestState<T> {
  return new EmptyRequestState<T>();
}

function writableRequestState<T>(onCancel?: () => void): WritableRequestState<T> {
  return new WritableRequestState<T>(onCancel);
}
/** @category RequestState */
interface AltConstructors {
  /**
   * Create a writable RequestState
   * @param onCancel - Optional cancellation handler
   * @category RequestState
   */
  writable<T>(onCancel?: () => void): WritableRequestState<T>;

  /**
   * Create a RequestState emitting an error
   * @param error - The error to emit
   * @category RequestState
   */
  error(error: Error | (() => Error)): IRequestState;

  /**
   * Create a typed RequestState emitting an error
   * @param error - The error to emit
   * @category RequestState
   */
  error<T>(error: Error | (() => Error)): IValueRequestState<T>;


  /**
   * Create a RequestState which is always loading
   * @category RequestState
   */
  loading(): IRequestState;

  /**
   * Create a typed RequestState which is always loading
   * @category RequestState
   */
  loading<T>(): IValueRequestState<T>;

  /**
   * Create a RequestState that resolves after an amount of time
   * @param duration - The loading duration in milliseconds
   * @category RequestState
   */
  loading(duration: number): IRequestState;

  /**
   * Create a RequestState that resolves with a value after an amount of time
   * @param duration - The loading duration in milliseconds
   * @param value - The value to resolve with after the delay
   * @category RequestState
   */
  loading<T>(duration: number, value: T): IValueRequestState<T>;

  /**
   * Create an empty RequestState
   * @category RequestState
   */
  empty(): IRequestState;

  /**
   * Create a typed empty RequestState
   * @category RequestState
   */
  empty<T>(): IValueRequestState<T>;
}

const compiled = valueRequestState as typeof valueRequestState & AltConstructors

compiled.writable = writableRequestState;
compiled.error = errorRequestState;

export const requestState = compiled;
