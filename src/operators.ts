import {assertInInjectionContext, computed, effect, Injector, signal, Signal} from "@angular/core";

/**
 * Create a signal containing the last 2 values emitted by the input signal
 * @param inputSignal - The signal emitting values
 * @param firstValue - The value to seed as the initial value in the new signal state
 */
export function pairwiseSignal<T>(inputSignal: Signal<T>, firstValue: T): Signal<[prev: T, next: T]> {

  let prevValue = firstValue;

  return computed(() => {
    const nextValue = inputSignal();

    const tuple: [prev: T, next: T] = [prevValue, nextValue];
    prevValue = nextValue;

    return tuple;
  });
}
