import {computed, Signal, signal, untracked} from "@angular/core";
import {pairwiseSignal} from "../operators";

/**
 * A signal FIFO queue
 * @category Signal Collections
 */
export class SignalQueue<T> {

  private readonly _items = signal<T[]>([]);

  /** A signal emitting the items of the queue */
  readonly items = this._items.asReadonly();

  /** A signal emitting the number of items in the queue */
  readonly length = computed(() => this.items().length);

  /** A signal emitting true if there are no items in the queue */
  readonly empty = computed(() => this.length() <= 0);

  private _maxSize: number | undefined;

  /** The max size of the queue */
  get maxSize(): number|undefined {
    return this._maxSize
  };

  constructor(options?: SignalQueueOptions) {

    this._maxSize = options?.size;

    this.front = computed(() => this.items().at(0));
    this.back = computed(() => this.items().at(-1));

    const delta = pairwiseSignal(this.items, []);

    this.frontDelta = computed(() => {
      const [prev, next] = delta();
      const item = next.at(0);
      return {item, added: !item ? false : !prev.includes(item)};
    }, {equal: (a, b) => a.item === b.item});

    this.backDelta = computed(() => {
      const [prev, next] = delta();
      const item = next.at(-1);
      return {item, added: !item ? false : !prev.includes(item)};
    }, {equal: (a, b) => a.item === b.item});
  }

  //<editor-fold desc="Front">

  /**
   * Signal returning the element at the front of the queue
   */
  readonly front: Signal<T | undefined>;

  /** Signal returning the current front element and whether it was just added */
  readonly frontDelta: Signal<SignalQueueDelta<T>>;
  //</editor-fold>

  //<editor-fold desc="Back">

  /**
   * Signal returning the element at the back of the queue
   */
  readonly back: Signal<T | undefined>;

  /** Signal returning the current back element and whether it was just added */
  readonly backDelta: Signal<SignalQueueDelta<T>>;
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
   * Remove the front element from the queue and return it
   */
  dequeue(): T | undefined;
  /**
   * Remove the front x elements from the queue and return them
   * @param count - The amount of elements to remove
   */
  dequeue(count: number): T[];
  dequeue(count?: number): T | T[] | undefined {

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
   * Remove the back element from the queue and return it
   */
  removeFromBack(): T | undefined;
  /**
   * Remove the back x elements from the queue and return it
   * @param count - The amount of elements to remove
   */
  removeFromBack(count: number): T[];
  removeFromBack(count?: number): T | T[] | undefined {

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
   * Add item to the back of the queue
   * @param item - Item to add
   */
  enqueue(item: T): void;
  /**
   * Add items to the back of the queue
   * @param items - Items to add
   */
  enqueue(...items: T[]): void;
  enqueue(...items: T[]): void {
    let list = [...untracked(this.items), ...items];

    if (this.maxSize !== undefined && list.length > this.maxSize) {
      const delta = list.length - this.maxSize;
      list = list.slice(delta);
    }

    this._items.set(list);
  }

  /**
   * Add item to the front of the queue
   * @param item - Item to add
   */
  addToFront(item: T): void;
  /**
   * Add items to the front of the queue
   * @param items - Items to add
   */
  addToFront(...items: T[]): void;
  addToFront(...items: T[]): void {
    let list = [...items, ...untracked(this.items)];

    if (this.maxSize !== undefined && list.length > this.maxSize) {
      const delta = list.length - this.maxSize;
      list = list.slice(0, -delta);
    }

    this._items.set(list);
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

  /**
   * Change the max size of the queue
   * @param size - The new max size
   */
  setMaxSize(size: number | undefined) {
    this._maxSize = size;

    if (size === undefined || untracked(this.length) <= size) return;

    const delta = untracked(this.length) - size;
    this._items.set(untracked(this.items).slice(delta));
  }
}

/**
 * Options for creating a Queue
 * @category Signal Collections
 */
export interface SignalQueueOptions {
  size?: number | undefined;
}

/**
 * Data indicating the change in state for a location in the Queue
 * @category Signal Collections
 */
export interface SignalQueueDelta<T> {
  added: boolean;
  item?: T;
}

/**
 * Create a new SignalQueue
 * @param options - Optional configuration
 * @category Signal Collections
 */
export function signalQueue<T>(options?: SignalQueueOptions): SignalQueue<T> {
  return new SignalQueue<T>(options);
}
