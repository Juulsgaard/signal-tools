import {computed, signal, Signal, untracked, WritableSignal} from "@angular/core";
import {IRequestState, IValueRequestState} from "./request-state";
import {requestState} from "./constructors";

/**
 * A container which keeps track of a replaceable RequestState
 * @category RequestState
 */
export class RequestTracker {

  private readonly _request: WritableSignal<IRequestState>;
  /** The currently active RequestState */
  readonly request: Signal<IRequestState>;

  /** The currently active RequestState */
  set current(req: IRequestState) {
    this.set(req)
  }

  get current(): IRequestState {
    return untracked(this.request)
  }

  /** Emits true if the current RequestState is loading */
  readonly loading = computed(() => this._request().loading());
  /** Emits an error if the current RequestState is in an error state */
  readonly error = computed(() => this._request().error());
  /** Emits true if the current RequestState has failed */
  readonly failed = computed(() => this._request().failed());

  constructor(request?: IRequestState) {
    this._request = signal(request ?? requestState.empty());
    this.request = this._request.asReadonly();
  }

  /**
   * Set a new current RequestState
   * @param state - The new RequestState
   */
  set(state: IRequestState): void {
    this._request.set(state);
  }

  /**
   * Resets the Tracker to an Empty state
   */
  reset() {
    this._request.set(requestState.empty());
  }
}

/**
 * A container which keeps track of a replaceable RequestState of a known return type
 * @category RequestState
 */
export class ValueRequestTracker<T> extends RequestTracker {
  private readonly _valueRequest: WritableSignal<IValueRequestState<T>>;
  override request: Signal<IValueRequestState<T>>;

  override set current(req: IValueRequestState<T>) {
    this.set(req)
  }

  override get current(): IValueRequestState<T> {
    return untracked(this.request)
  }

  constructor(request?: IValueRequestState<T>) {
    super();
    this._valueRequest = signal(request ?? requestState.empty<T>());
    this.request = this._valueRequest.asReadonly();
  }

  override set(req: IValueRequestState<T>): void {
    super.set(req);
    this._valueRequest.set(req);
  }

  override reset() {
    super.reset();
    this.set(requestState.empty<T>());
  }
}

/**
 * Create an empty and untyped RequestTracker
 * @category RequestState
 */
export function requestTracker(): RequestTracker;
/**
 * Create an empty RequestTracker with a known RequestState return type
 * @category RequestState
 */
export function requestTracker<T>(): ValueRequestTracker<T>;
/**
 * Create a typed RequestTracker from a types RequestState
 * @param request - The initial RequestState
 * @category RequestState
 */
export function requestTracker<T>(request: IValueRequestState<T>): ValueRequestTracker<T>;
/**
 * Create an untyped RequestTracker from an untyped RequestState
 * @param request - The initial RequestState
 * @category RequestState
 */
export function requestTracker(request: IRequestState): RequestTracker;
export function requestTracker<T>(request?: IRequestState | IValueRequestState<T>): RequestTracker | ValueRequestTracker<T> {
  if (!request) return new ValueRequestTracker<T>()
  if (request instanceof IValueRequestState) return new ValueRequestTracker<T>(request);
  return new RequestTracker(request);
}
