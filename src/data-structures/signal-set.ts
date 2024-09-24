import {computed, signal, Signal, untracked, WritableSignal} from "@angular/core";

/**
 * A Set where the state and values are accessible as signals
 * @category Signal Collections
 */
export class SignalSet<T> implements ReadonlySignalSet<T> {

  private readonly _set: WritableSignal<ReadonlySet<T>>;

  /** @inheritDoc */
  readonly value: Signal<ReadonlySet<T>>;

  /** @inheritDoc */
  readonly size: Signal<number>;

  /** @inheritDoc */
  readonly empty: Signal<boolean>;

  /** @inheritDoc */
  readonly array: Signal<T[]>;

  constructor(values?: T[]) {
    this._set = signal<ReadonlySet<T>>(new Set<T>(values));
    this.value = this._set.asReadonly();
    this.size = computed(() => this.value().size);
    this.empty = computed(() => this.size() <= 0);
    this.array = computed(() => Array.from(this.value()));
  }

  /** @inheritDoc */
  [Symbol.iterator](): IterableIterator<T> {
    return this.value()[Symbol.iterator]();
  }

  private getCopy() {
    return new Set<T>(untracked(this.value));
  }

  //<editor-fold desc="Actions">

  /**
   * Remove all keys not in the whitelist
   * @param whitelist - The keys to keep
   */
  filter(whitelist: T[]|ReadonlySet<T>|undefined): boolean {
    const length = whitelist && 'size' in whitelist ? whitelist.size : whitelist?.length;

    if (!length) {
      return this.clear();
    }

    const whitelistSet = whitelist instanceof Set ? whitelist : new Set(whitelist);
    const set = this.getCopy();

    for (let value of untracked(this.value)) {
      if (whitelistSet.has(value)) continue;
      set.delete(value);
    }

    if (untracked(this.size) !== set.size) {
      this._set.set(set);
      return true;
    }

    return false;
  }

  /** Clear the collection */
  clear(): boolean {
    if (!untracked(this.size)) return false;
    this._set.set(new Set<T>());
    return true;
  }

  /**
   * Add a value to the collection is not already present
   * @param value - The value to add
   * @return added - Returns true if the value was added
   */
  add(value: T): boolean {
    if (untracked(this.value).has(value)) return false;
    const set = this.getCopy();
    set.add(value);
    this._set.set(set);
    return true;
  }

  /**
   * Add a list of values to the collection is not already present
   * @param values - The values to add
   * @return added - Returns true if any value was added
   */
  addRange(values: T[]): boolean {
    const set = this.getCopy();
    const size = set.size;
    values.forEach(v => set.add(v));
    if (set.size === size) return false;
    this._set.set(set);
    return true;
  }

  /**
   * Reset the values in the collection to the provided list
   * @param values - The values to set
   * @return changed - Returns true if the collection changed
   */
  set(values: T[] = []): boolean {
    if (!values.length && !this.size) return false;

    if (values.length === untracked(this.size)) {
      const same = values.every(x => this.has(x));
      if (same) return false;
    }

    this._set.set(new Set<T>(values));
    return true;
  }

  /**
   * Remove a value from the collection
   * @param value - The key to remove
   * @return removed - True if the value existed
   */
  delete(value: T): boolean {
    if (!untracked(this.value).has(value)) return false;
    const set = this.getCopy();
    set.delete(value);
    this._set.set(set);
    return true;
  }

  /**
   * Remove values from the collection
   * @param values - The values to remove
   * @return removed - True if any values were removed
   */
  deleteRange(values: T[]): boolean {
    const set = this.getCopy();
    const size = set.size;
    values.forEach(v => set.delete(v));
    if (set.size === size) return false;
    this._set.set(set);
    return true;
  }

  /**
   * Toggle a value in the set
   * @param value - The value to toggle
   * @param state - A forced state (`true` = always add, `false` = always delete)
   * @returns The applied change (`true` = item added, `false` = item removed, `undefined` = nothing changed)
   */
  toggle(value: T, state?: boolean): boolean|undefined {

    if (untracked(this.value).has(value)) {
      if (state === true) return undefined;
      const set = this.getCopy();
      set.delete(value);
      this._set.set(set);
      return false;
    }

    if (state === false) return undefined;
    const set = this.getCopy();
    set.add(value);
    this._set.set(set);
    return true;
  }

  /** Manually modify the inner collection */
  modify(modify: (set: Set<T>) => void) {
    const set = this.getCopy();
    modify(set);
    this._set.set(set);
  }

  /** @inheritDoc */
  has(value: T): Signal<boolean> {
    return computed(() => this.value().has(value));
  }
  //</editor-fold>
}

/**
 * An immutable Set where the state and values are accessible as signals
 * @category Signal Collections
 */
export interface ReadonlySignalSet<T> extends Iterable<T> {
  /** A signal emitting the number of items in the collection */
  readonly size: Signal<number>;
  /** A signal emitting true if the collection is empty */
  readonly empty: Signal<boolean>;
  /** A signal emitting the inner non-signal Set */
  readonly value: Signal<ReadonlySet<T>>;
  /** A signal emitting the values of the set as an array */
  readonly array: Signal<ReadonlyArray<T>>;
  /** Create a signal emitting true if a key exists in the collection */
  has(key: T): Signal<boolean>;
}
