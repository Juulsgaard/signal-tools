import {computed, signal, Signal, untracked, WritableSignal} from "@angular/core";

/**
 * A Map where the state and values are accessible as signals
 * @category Signal Collections
 */
export class SignalMap<TKey, TVal> implements ReadonlySignalMap<TKey, TVal> {

  private readonly _map: WritableSignal<ReadonlyMap<TKey, TVal>>;

  /** @inheritDoc */
  readonly value: Signal<ReadonlyMap<TKey, TVal>>;

  /** @inheritDoc */
  readonly size: Signal<number>;

  /** @inheritDoc */
  readonly empty: Signal<boolean>;

  constructor(values?: ReadonlyMap<TKey, TVal>) {

    this._map = signal<ReadonlyMap<TKey, TVal>>(new Map(values));

    this.value = this._map.asReadonly();
    this.size = computed(() => this.value().size);
    this.empty = computed(() => this.size() <= 0);
  }

  [Symbol.iterator](): IterableIterator<[TKey, TVal]> {
    return this.value()[Symbol.iterator]();
  }

  private getCopy() {
    return new Map(untracked(this.value));
  }

  //<editor-fold desc="Actions">

  /**
   * Remove all keys not in the whitelist
   * @param whitelist - The keys to keep
   */
  filter(whitelist: ReadonlyArray<TKey> | ReadonlySet<TKey> | undefined): boolean {
    const length = whitelist && 'size' in whitelist ? whitelist.size : whitelist?.length;

    if (!length) {
      return this.clear();
    }

    const whitelistSet = whitelist instanceof Set ? whitelist : new Set(whitelist);
    const map = this.getCopy();

    for (let [key] of untracked(this.value)) {
      if (whitelistSet.has(key)) continue;
      map.delete(key);
    }

    if (untracked(this.size) !== map.size) {
      this._map.set(map);
      return true;
    }

    return false;
  }

  /** Clear the collection */
  clear(): boolean {
    if (!untracked(this.size)) return false;
    this._map.set(new Map());
    return true;
  }

  /**
   * Add a value to the collection if the key is not in use
   * @param key - The key to use
   * @param value - The value to add
   * @return added - Returns true if the value was added
   */
  add(key: TKey, value: TVal): boolean {
    if (untracked(this.value).has(key)) return false;
    const map = this.getCopy();
    map.set(key, value);
    this._map.set(map);
    return true;
  }

  /**
   * Add a value to the collection
   * @param key - The key to use
   * @param value - The value to add
   * @return added - Returns true if the value was added or changed
   */
  set(key: TKey, value: TVal): boolean {
    const state = untracked(this.value);
    if (state.has(key) && state.get(key) === value) return false;

    const map = this.getCopy();
    map.set(key, value);
    this._map.set(map);
    return true;
  }

  /**
   * Remove a key from the collection
   * @param key - The key to remove
   * @return removed - True if an item was removed
   */
  delete(key: TKey): boolean {
    if (!untracked(this.value).has(key)) return false;
    const map = this.getCopy();
    map.delete(key);
    this._map.set(map);
    return true;
  }

  /**
   * Remove keys from the collection
   * @param values - The keys to remove
   * @return removed - True if items were removed
   */
  deleteRange(values: TKey[]): boolean {
    const map = this.getCopy();
    const size = map.size;
    values.forEach(v => map.delete(v));
    if (map.size === size) return false;
    this._map.set(map);
    return true;
  }

  /**
   * Toggle a value in the map
   * @param key - The key to toggle
   * @param value - The value to insert if applicable
   * @param state - A forced state (`true` = always add, `false` = always delete)
   * @returns The applied change (`true` = item added, `false` = item removed, `undefined` = nothing changed)
   */
  toggle(key: TKey, value: TVal, state?: boolean): boolean | undefined {

    if (untracked(this.value).has(key)) {
      if (state === true) return undefined;
      const map = this.getCopy();
      map.delete(key);
      this._map.set(map);
      return false;
    }

    if (state === false) return undefined;
    const map = this.getCopy();
    map.set(key, value);
    this._map.set(map);
    return true;
  }

  /** Manually modify the inner collection */
  modify(modify: (map: Map<TKey, TVal>) => void) {
    const map = this.getCopy();
    modify(map);
    this._map.set(map);
  }

  /** @inheritDoc */
  has(key: TKey): Signal<boolean> {
    return computed(() => this.value().has(key));
  }

  /** @inheritDoc */
  get(key: TKey): Signal<TVal | undefined> {
    return computed(() => this.value().get(key));
  }

  //</editor-fold>
}

/**
 * An immutable Map where the state and values are accessible as signals
 * @category Signal Collections
 */
export interface ReadonlySignalMap<TKey, TVal> extends Iterable<[TKey, TVal]> {
  /** A signal emitting the number of items in the collection */
  readonly size: Signal<number>;
  /** A signal emitting true if the collection is empty */
  readonly empty: Signal<boolean>;
  /** A signal emitting the inner non-signal map */
  readonly value: Signal<ReadonlyMap<TKey, TVal>>;

  /** Create a signal emitting true if a key exists in the collection */
  has(key: TKey): Signal<boolean>;

  /** Create a signal emitting the value under a given key */
  get(key: TKey): Signal<TVal | undefined>;
}
