import {computed, Signal, signal, untracked} from "@angular/core";
import {pairwiseSignal} from "../operators";

/**
 * A signal based FILO stack
 * @category Signal Collections
 */
export class SignalStack<T> {

  private readonly _items = signal<T[]>([]);
  /** A signal containing the items of the stack from bottom to top */
  readonly items = this._items.asReadonly();

  /** A signal emitting the number of items in the stack */
  readonly length = computed(() => this.items().length);

  /** A signal emitting true if there are no items in the stack */
  readonly empty = computed(() => this.length() <= 0);

  constructor() {

    this.top = computed(() => this.items().at(-1));
    this.bottom = computed(() => this.items().at(0));

    const delta = pairwiseSignal(this.items, []);

    this.topDelta = computed(() => {
      const [prev, next] = delta();
      const item = next.at(-1);
      return {item, added: !item ? false : !prev.includes(item)};
    }, {equal: (a, b) => a.item === b.item});

    this.bottomDelta = computed(() => {
      const [prev, next] = delta();
      const item = next.at(0);
      return {item, added: !item ? false : !prev.includes(item)};
    }, {equal: (a, b) => a.item === b.item});
  }

  //<editor-fold desc="Top">

  /** Signal returning the element at the top of the stack */
  readonly top: Signal<T | undefined>;

  /** Signal returning the current top element and whether it was just added */
  readonly topDelta: Signal<SignalStackDelta<T>>;
  //</editor-fold>

  //<editor-fold desc="Bottom">

  /** Signal returning the element at the bottom of the stack */
  readonly bottom: Signal<T | undefined>;

  /** Signal returning the current bottom element and whether it was just added */
  readonly bottomDelta: Signal<SignalStackDelta<T>>;
  //</editor-fold>

  //<editor-fold desc="Actions">
  /**
   * Removes an item from the scheduler
   * @param item
   */
  removeItem(item: T): boolean {
    const index = untracked(this.items).indexOf(item);
    if (index < 0) return false;

    const arr = [...untracked(this.items)];
    arr.splice(index, 1);
    this._items.set(arr);
    return true;
  }

  /**
   * Remove the bottom element from the stack and return it
   */
  removeFromBottom(): T | undefined;
  /**
   * Remove the bottom x elements from the stack and return them
   * @param count - The amount of elements to remove
   */
  removeFromBottom(count: number): T[];
  removeFromBottom(count?: number): T | T[] | undefined {

    if (count !== undefined) {
      if (count < 1) return [];
      if (!untracked(this.length)) return [];
      const items = untracked(this.items).slice(0, count);
      this._items.set(untracked(this.items).slice(count));
      return items;
    }

    if (!untracked(this.length)) return undefined;
    const item = untracked(this.items).at(0);
    this._items.set(untracked(this.items).slice(1));
    return item;
  }

  /**
   * Remove the top element from the stack and return it
   */
  pop(): T | undefined;
  /**
   * Remove the top x elements from the stack and return it
   * @param count - The amount of elements to remove
   */
  pop(count: number): T[];
  pop(count?: number): T | T[] | undefined {

    if (count !== undefined) {
      if (count < 1) return [];
      if (!untracked(this.length)) return [];
      const start = count * -1;
      const items = untracked(this.items).slice(start);
      this._items.set(untracked(this.items).slice(0, start));
      return items;
    }

    if (!untracked(this.length)) return undefined;
    const item = untracked(this.items).at(-1);
    this._items.set(untracked(this.items).slice(0, -1));
    return item;
  }

  /**
   * Add item to the top of the stack
   * @param item - Item to add
   */
  push(item: T): void;
  /**
   * Add items to the top of the stack
   * @param items - Items to add
   */
  push(...items: T[]): void;
  push(...items: T[]): void {
    this._items.set([...untracked(this.items), ...items]);
  }

  /**
   * Add item to the bottom of the stack
   * @param item - Item to add
   */
  addToBottom(item: T): void;
  /**
   * Add items to the bottom of the stack
   * @param items - Items to add
   */
  addToBottom(...items: T[]): void;
  addToBottom(...items: T[]): void {
    this._items.set([...items, ...untracked(this.items)]);
  }

  /**
   * Checks if the item exists in the queue
   * @param item
   */
  contains(item: T) {
    return untracked(this.items).includes(item);
  }

  /**
   * Remove all elements from the set
   */
  clear() {
    this._items.set([]);
  }

  //</editor-fold>
}

/**
 * Data indicating the change in state for a location in the Stack
 * @category Signal Collections
 */
export interface SignalStackDelta<T> {
  item?: T;
  added: boolean;
}

