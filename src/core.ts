import {
  ComputedGetter,
  ComputedRef,
  DebuggerOptions,
  DeepReadonly,
  ReactiveEffectOptions,
  ReactiveEffectRunner,
  Ref,
  UnwrapNestedRefs,
  UnwrapRef,
  WritableComputedOptions,
  WritableComputedRef,
  computed,
  effect as internalEffect,
  isReactive,
  isRef,
  isShallow,
  reactive,
  readonly,
  ref,
  triggerRef,
} from '@vue/reactivity';
import {
  WrappedRef,
  createWrappedRef,
  getFiberInDev,
  hasChanged,
  invokeUntracked,
  isFunction,
  traverse,
  updateWrappedRef,
} from './helper';
import {
  useDebugValue,
  useEffect as useEffectReact,
  useRef as useRefReact,
} from 'react';
import messages from './messages';

export { ref, computed, reactive, readonly } from '@vue/reactivity';

/**
 * The hook version of `ref` from `@vue/reactivity`.
 * In addition to values accepted by `ref`, you can also pass an initializer function returning the value.
 *
 * This hook version allows the ref to be created when the component first renders, then cached for future re-renders.
 * If you pass in an initializer function, it will only be called on first render.
 *
 * -----------------------------
 *
 * Takes an inner value and returns a reactive and mutable ref object, which
 * has a single property `.value` that points to the inner value.
 *
 * @example
 * ```js
 * // Inside a function component:
 * const count = useRef(1)
 * ```
 *
 * @param initialValue - The object to wrap in the ref, or a function that returns the object.
 * @see {@link https://vuejs.org/api/reactivity-core.html#ref}
 */
export const useRef = <T>(initialValue: T | (() => T)): Ref<UnwrapRef<T>> => {
  const reactiveRef = useRefReact<Ref<UnwrapRef<T>> | null>(null);
  if (reactiveRef.current === null) {
    reactiveRef.current = ref(
      isFunction(initialValue) ? invokeUntracked(initialValue) : initialValue
    );
  }
  useDebugValue(reactiveRef.current, (ref) => ref.value);
  return reactiveRef.current;
};

/**
 * The hook version of `ref` from `@vue/reactivity`.
 * In addition to values accepted by `ref`, you can also pass an initializer function returning the value.
 *
 * This hook version allows the ref to be created when the component first renders, then cached for future re-renders.
 * If you pass in an initializer function, it will only be called on first render.
 *
 * -----------------------------
 *
 * Takes an inner value and returns a reactive and mutable ref object, which
 * has a single property `.value` that points to the inner value.
 *
 * @example
 * ```js
 * // Inside a function component:
 * const count = useRef(1)
 * ```
 *
 * @param initialValue - The object to wrap in the ref, or a function that returns the object.
 * @see {@link https://vuejs.org/api/reactivity-core.html#ref}
 */
export const useReference = useRef;

interface ComputedRefData<T> {
  ref: WrappedRef<ComputedRef<T> | WritableComputedRef<T>> | null;
  oldRef: (ComputedRef<T> | WritableComputedRef<T>)[];
  stopFlagged: boolean;
}

interface UseComputed {
  <T>(
    getter: ComputedGetter<T>,
    debugOptions?: DebuggerOptions
  ): ComputedRef<T>;
  <T>(
    options: WritableComputedOptions<T>,
    debugOptions?: DebuggerOptions
  ): WritableComputedRef<T>;
}

/**
 * The hook version of `computed` from `@vue/reactivity`.
 *
 * This hook version allows the computed ref to be created when the component first renders, then cached for future re-renders.
 *
 * -----------------------------
 *
 * Takes a getter function and returns a readonly reactive ref object for the
 * returned value from the getter. It can also take an object with get and set
 * functions to create a writable ref object.
 *
 * @example
 * ```js
 * // Inside a function component:
 * //   Creating a readonly computed ref:
 * const count = useRef(1)
 * const plusOne = useComputed(() => count.value + 1)
 *
 * console.log(plusOne.value) // 2
 * plusOne.value++ // error
 * ```
 *
 * @example
 * ```js
 * // Inside a function component:
 * //   Creating a writable computed ref:
 * const count = useRef(1)
 * const plusOne = useComputed({
 *   get: () => count.value + 1,
 *   set: (val) => {
 *     count.value = val - 1
 *   }
 * })
 *
 * plusOne.value = 1
 * console.log(count.value) // 0
 * ```
 *
 * @param getter - Function that produces the next value.
 * @param debugOptions - For debugging. See {@link https://vuejs.org/guide/extras/reactivity-in-depth.html#computed-debugging}.
 * @see {@link https://vuejs.org/api/reactivity-core.html#computed}
 */
export const useComputed: UseComputed = (<T>(
  optionsOrGetter: ComputedGetter<T> | WritableComputedOptions<T>,
  debugOptions?: DebuggerOptions
): ComputedRef<T> | WritableComputedRef<T> => {
  const reactiveRef = useRefReact<ComputedRefData<T>>({
    ref: null,
    oldRef: [],
    stopFlagged: false,
  });
  const destroyRef = (
    ref: WrappedRef<ComputedRef<T> | WritableComputedRef<T>> | null
  ) => {
    reactiveRef.current.stopFlagged = false;
    if (ref !== null) {
      ref.effect.stop();
      reactiveRef.current.oldRef.push(ref.__current__);
    }
  };
  const initializeRef = (inRender: boolean) => {
    if (reactiveRef.current.stopFlagged) {
      destroyRef(reactiveRef.current.ref);
    }
    if (
      reactiveRef.current.ref === null ||
      !reactiveRef.current.ref.__current__.effect.active
    ) {
      const computedRef = computed(
        optionsOrGetter as ComputedGetter<T>,
        debugOptions
      );
      if (reactiveRef.current.ref === null) {
        reactiveRef.current.ref = createWrappedRef(computedRef);
      } else {
        updateWrappedRef(reactiveRef.current.ref, computedRef);
      }
      if (reactiveRef.current.oldRef) {
        const oldRefs = reactiveRef.current.oldRef;
        for (let i = 0; i < oldRefs.length; i++) {
          triggerRef(oldRefs[i]);
        }
        reactiveRef.current.oldRef.length = 0;
      }
      if (inRender && getFiberInDev() !== null) {
        reactiveRef.current.stopFlagged = true;
        setTimeout(() => {
          if (reactiveRef.current.stopFlagged)
            destroyRef(reactiveRef.current.ref);
        }, 0);
      }
    }
  };
  initializeRef(true);
  useEffectReact(() => {
    initializeRef(false);
    const ref = reactiveRef.current.ref;
    return () => {
      destroyRef(ref);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useDebugValue(reactiveRef.current.ref!, (ref) => ref.value);
  return reactiveRef.current.ref!;
}) as UseComputed;

/**
 * The hook version of `reactive` from `@vue/reactivity`.
 * In addition to values accepted by `reactive`, you can also pass an initializer function returning the value.
 *
 * This hook version allows the reactive object to be created when the component first renders, then cached for future
 * re-renders.
 * If you pass in an initializer function, it will only be called on first render.
 *
 * -----------------------------
 *
 * Returns a reactive proxy of the object.
 *
 * The reactive conversion is "deep": it affects all nested properties. A
 * reactive object also deeply unwraps any properties that are refs while
 * maintaining reactivity.
 *
 * @example
 * ```js
 * const obj = useReactive({ count: 0 })
 * ```
 *
 * @example
 * ```js
 * const obj = useReactive(() => ({ count: 0 }))
 * ```
 *
 * @param initialValue - The source object, or a function that returns the object.
 * @see {@link https://vuejs.org/api/reactivity-core.html#reactive}
 */
export const useReactive = <T extends object>(
  initialValue: T | (() => T)
): UnwrapNestedRefs<T> => {
  const reactiveRef = useRefReact<UnwrapNestedRefs<T> | null>(null);
  if (reactiveRef.current === null) {
    reactiveRef.current = reactive(
      isFunction(initialValue) ? invokeUntracked(initialValue) : initialValue
    );
  }
  useDebugValue(reactiveRef.current);
  return reactiveRef.current;
};

/**
 * The hook version of `readonly` from `@vue/reactivity`.
 * In addition to values accepted by `readonly`, you can also pass an initializer function returning the value.
 *
 * This hook version allows the readonly ref to be created when the component first renders, then cached for future
 * re-renders.
 * If you pass in an initializer function, it will only be called on first render.
 *
 * -----------------------------
 *
 * Takes an object (reactive or plain) or a ref and returns a readonly proxy to
 * the original.
 *
 * A readonly proxy is deep: any nested property accessed will be readonly as
 * well. It also has the same ref-unwrapping behavior as {@link reactive()},
 * except the unwrapped values will also be made readonly.
 *
 * @example
 * ```js
 * // Inside a function component:
 * const original = useReactive({ count: 0 })
 *
 * const copy = useReadonly(original)
 *
 * useEffect(() => {
 *   // works for reactivity tracking
 *   console.log(copy.count)
 * })
 *
 * // mutating original will trigger watchers relying on the copy
 * original.count++
 *
 * // mutating the copy will fail and result in a warning
 * copy.count++ // warning!
 * ```
 *
 * @param initialValue - The source object, or a function that returns the object.
 * @see {@link https://vuejs.org/api/reactivity-core.html#readonly}
 */
export const useReadonly = <T extends object>(
  initialValue: T | (() => T)
): DeepReadonly<UnwrapNestedRefs<T>> => {
  const reactiveRef = useRefReact<DeepReadonly<UnwrapNestedRefs<T>> | null>(
    null
  );
  if (reactiveRef.current === null) {
    reactiveRef.current = readonly(
      isFunction(initialValue) ? invokeUntracked(initialValue) : initialValue
    );
  }
  useDebugValue(reactiveRef.current);
  return reactiveRef.current;
};

/**
 * A function that cleans up the current side effect.
 */
type CleanupFn = () => void;

/**
 * An enhanced version of `effect` from `@vue/reactivity`, adding support for a cleanup function.
 *
 * ---------------------------
 *
 * Registers the given function to track reactive updates.
 *
 * The given function will be run once immediately. Every time any reactive
 * property that's accessed within it gets updated, the function will run again.
 *
 * @example
 * ```js
 * const count = ref(0)
 * effect(() => {
 *   console.log(count.value)
 *   return () => console.log('cleanup')
 * })
 * count.value++
 * ```
 *
 * @param fn - The function that will track reactive updates. The return value from this function will be used as a cleanup function.
 * @param options - Allows to control the effect's behaviour.
 * @returns A runner that can be used to control the effect after creation.
 */
export const effect = (
  fn: () => CleanupFn | void,
  options?: ReactiveEffectOptions
): ReactiveEffectRunner => {
  let cleanupFn: CleanupFn | undefined;
  const runner = internalEffect(() => {
    cleanupFn?.();
    cleanupFn = fn() ?? undefined;
  }, options);
  const baseStop = runner.effect.onStop;
  runner.effect.onStop = () => {
    cleanupFn?.();
    baseStop?.();
  };
  return runner;
};

/**
 * The hook version of `effect` from `@vue/reactivity`.
 *
 * This hook version allows the effect to be set up when the component first renders, then automatically stopped
 * when the component unmounts.
 *
 * You may return a cleanup function from the given function to clean up side effects before the given function re-runs.
 * Note that this syntax follows that of `useEffect` from React, and is not the same as `watchEffect` from Vue.
 *
 * -----------------------------
 *
 * Registers the given function to track reactive updates.
 *
 * The given function will be run once immediately. Every time any reactive
 * property that's accessed within it gets updated, the function will run again.
 *
 * @example
 * ```js
 * // Inside a function component:
 * const count = useRef(0)
 * useEffect(() => {
 *   console.log(count.value)
 *   return () => console.log('cleanup')
 * })
 * count.value++
 * ```
 *
 * @param fn - The function that will track reactive updates. The return value from this function will be used as a cleanup function.
 * @param options - Allows to control the effect's behaviour.
 */
export const useEffect = (
  fn: () => CleanupFn | void,
  options?: DebuggerOptions
): void => {
  if (options && 'lazy' in options && options.lazy) {
    messages.warnLazyEffect();
  }
  const reactiveRef = useRefReact<ReactiveEffectRunner | null>(null);
  const destroyRef = () => {
    if (reactiveRef.current !== null) {
      reactiveRef.current.effect.stop();
      reactiveRef.current = null;
    }
  };
  const initializeRef = (inRender: boolean) => {
    if (reactiveRef.current === null) {
      if (inRender && getFiberInDev() !== null) {
        return;
      }
      reactiveRef.current = effect(fn, { ...options, lazy: false });
    }
  };
  initializeRef(true);
  useEffectReact(() => {
    initializeRef(false);
    return () => {
      destroyRef();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};

/**
 * The hook version of `effect` from `@vue/reactivity`.
 *
 * This hook version allows the effect to be set up when the component first renders, then automatically stopped
 * when the component unmounts.
 *
 * You may return a cleanup function from the given function to clean up side effects before the given function re-runs.
 * Note that this syntax follows that of `useEffect` from React, and is not the same as `watchEffect` from Vue.
 *
 * -----------------------------
 *
 * Registers the given function to track reactive updates.
 *
 * The given function will be run once immediately. Every time any reactive
 * property that's accessed within it gets updated, the function will run again.
 *
 * @example
 * ```js
 * // Inside a function component:
 * const count = useRef(0)
 * useEffect(() => {
 *   console.log(count.value)
 *   return () => console.log('cleanup')
 * })
 * count.value++
 * ```
 *
 * @param fn - The function that will track reactive updates. The return value from this function will be used as a cleanup function.
 * @param options - Allows to control the effect's behaviour.
 */
export const useWatchEffect = useEffect;

// ========================================
// watch implementation
// reference: https://github.com/vuejs/core/blob/020851e57d9a9f727c6ea07e9c1575430af02b73/packages/runtime-core/src/apiWatch.ts
// ========================================

/**
 * Reactive sources that can be watched by {@link watch()} or {@link useWatch()}.
 */
export type WatchSource<T = any> = Ref<T> | ComputedRef<T> | (() => T);

type MultiWatchSources = (WatchSource<unknown> | object)[];

/**
 * Values of the watched sources, may be undefined if the callback is triggered by an immediate watch.
 */
type MapSources<T, Immediate> = {
  [K in keyof T]: T[K] extends WatchSource<infer V>
    ? Immediate extends true
      ? V | undefined
      : V
    : T[K] extends object
    ? Immediate extends true
      ? T[K] | undefined
      : T[K]
    : never;
};

/**
 * A callback function to be executed when a watch is triggered.
 * This function receives the new and old value of the watch values and may return a clean up function.
 */
export type WatchCallback<V = any, OV = any> = (
  value: V,
  oldValue: OV
) => CleanupFn | void;

export interface UseWatchOptions<Immediate = boolean> extends DebuggerOptions {
  /**
   * Trigger the callback immediately on watcher creation. Old value will be undefined on the first call.
   */
  immediate?: Immediate;
  /**
   * Force deep traversal of the source if it is an object, so that the callback fires on deep mutations.
   * See [Deep Watchers](https://vuejs.org/guide/essentials/watchers.html#deep-watchers).
   */
  deep?: boolean;
}

export interface WatchOptions<Immediate = boolean>
  extends UseWatchOptions<Immediate> {
  /**
   * Runs a callback when the watch is being destroyed.
   */
  onStop?: () => void;
}

/**
 * Execute this function to stop the associated watch.
 */
export type WatchStopHandle = () => void;

interface WatchOverloads {
  // overload: array of multiple sources + cb
  <T extends MultiWatchSources, Immediate extends Readonly<boolean> = false>(
    sources: [...T],
    cb: WatchCallback<MapSources<T, false>, MapSources<T, Immediate>>,
    options?: WatchOptions<Immediate>
  ): WatchStopHandle;
  // overload: multiple sources w/ `as const`
  // watch([foo, bar] as const, () => {})
  // somehow [...T] breaks when the type is readonly
  <
    T extends Readonly<MultiWatchSources>,
    Immediate extends Readonly<boolean> = false
  >(
    source: T,
    cb: WatchCallback<MapSources<T, false>, MapSources<T, Immediate>>,
    options?: WatchOptions<Immediate>
  ): WatchStopHandle;
  // overload: single source + cb
  <T, Immediate extends Readonly<boolean> = false>(
    source: WatchSource<T>,
    cb: WatchCallback<T, Immediate extends true ? T | undefined : T>,
    options?: WatchOptions<Immediate>
  ): WatchStopHandle;
  // overload: watching reactive object w/ cb
  <T extends object, Immediate extends Readonly<boolean> = false>(
    source: T,
    cb: WatchCallback<T, Immediate extends true ? T | undefined : T>,
    options?: WatchOptions<Immediate>
  ): WatchStopHandle;
}

/**
 * Watches one or more reactive data sources and invokes a callback function when the sources change.
 *
 * @example
 * ```js
 * const count = ref(0)
 * watch(count, (count) => {
 *   console.log(count)
 *   return () => console.log('cleanup')
 * })
 * count.value++
 * ```
 *
 * @param sources - The watcher's source. The source can be one of the following:
 *      - A getter function that returns a value
 *      - A ref
 *      - A reactive object
 *      - ...or an array of the above.
 * @param cb - The callback that will be called when the source changes. It receives the new and old value(s) as arguments.
 * @param options - Allows to control the watch's behaviour.
 * @returns A function that can be called to stop the watch.
 * @see {@link https://vuejs.org/api/reactivity-core.html#watch}
 */
export const watch: WatchOverloads = <
  T extends MultiWatchSources,
  Immediate extends Readonly<boolean> = false
>(
  sources: T,
  cb: WatchCallback<MapSources<T, false>, MapSources<T, Immediate>>,
  options?: WatchOptions<Immediate>
): WatchStopHandle => {
  let deep = options?.deep ?? false;
  const immediate = options?.immediate ?? false;

  let getter: () => any;
  let isMultiSource = false;
  let forceTrigger = false;

  if (isRef(sources)) {
    getter = () => sources.value;
    forceTrigger = isShallow(sources);
  } else if (isReactive(sources)) {
    getter = () => sources;
    deep = true;
  } else if (Array.isArray(sources)) {
    isMultiSource = true;
    forceTrigger = sources.some((s) => isReactive(s) || isShallow(s));
    getter = () =>
      sources.map((s) => {
        if (isRef(s)) {
          return s.value;
        } else if (isReactive(s)) {
          return traverse(s);
        } else if (isFunction(s)) {
          return s();
        } else {
          messages.warnInvalidWatchSource(s);
          return s;
        }
      });
  } else if (isFunction(sources)) {
    getter = sources;
  } else {
    messages.warnInvalidWatchSource(sources);
    getter = () => sources;
  }
  if (deep) {
    const baseGetter = getter;
    getter = () => traverse(baseGetter());
  }

  let cleanup: CleanupFn | undefined;

  let oldValue: any = isMultiSource
    ? new Array(sources.length).fill(undefined)
    : undefined;
  // eslint-disable-next-line prefer-const
  let effect: ReactiveEffectRunner<any>;
  const job = () => {
    const newValue = effect();
    if (
      deep ||
      forceTrigger ||
      (isMultiSource
        ? (newValue as any[]).some((v, i) => hasChanged(v, oldValue[i]))
        : hasChanged(newValue, oldValue))
    ) {
      if (cleanup) {
        cleanup();
      }
      cleanup = cb(newValue, oldValue) ?? undefined;
      oldValue = newValue;
    }
  };
  effect = internalEffect(getter, {
    scheduler: job,
    allowRecurse: true,
    onTrack: options?.onTrack,
    onTrigger: options?.onTrigger,
    onStop: options?.onStop,
  });
  if (immediate) {
    job();
  } else {
    oldValue = effect();
  }

  const baseStop = effect.effect.onStop;
  effect.effect.onStop = () => {
    cleanup?.();
    baseStop?.();
  };

  return () => effect.effect.stop();
};

interface UseWatchOverloads {
  // overload: array of multiple sources + cb
  <T extends MultiWatchSources, Immediate extends Readonly<boolean> = false>(
    sources: [...T],
    cb: WatchCallback<MapSources<T, false>, MapSources<T, Immediate>>,
    options?: UseWatchOptions<Immediate>
  ): void;
  // overload: multiple sources w/ `as const`
  // watch([foo, bar] as const, () => {})
  // somehow [...T] breaks when the type is readonly
  <
    T extends Readonly<MultiWatchSources>,
    Immediate extends Readonly<boolean> = false
  >(
    source: T,
    cb: WatchCallback<MapSources<T, false>, MapSources<T, Immediate>>,
    options?: UseWatchOptions<Immediate>
  ): void;
  // overload: single source + cb
  <T, Immediate extends Readonly<boolean> = false>(
    source: WatchSource<T>,
    cb: WatchCallback<T, Immediate extends true ? T | undefined : T>,
    options?: UseWatchOptions<Immediate>
  ): void;
  // overload: watching reactive object w/ cb
  <T extends object, Immediate extends Readonly<boolean> = false>(
    source: T,
    cb: WatchCallback<T, Immediate extends true ? T | undefined : T>,
    options?: UseWatchOptions<Immediate>
  ): void;
}

/**
 * The hook version of `watch`.
 *
 * This hook version allows the watch to be set up when the component first renders, then automatically stopped
 * when the component unmounts.
 *
 * You may return a cleanup function from the callback to clean up side effects before the callback re-runs.
 * Note that this syntax follows that of `useEffect` from React, and is not the same as `watch` from Vue.
 *
 * -----------------------------
 *
 * Watches one or more reactive data sources and invokes a callback function when the sources change.
 *
 * @example
 * ```js
 * // Inside a function component:
 * const count = useRef(0)
 * useWatch(count, (count) => {
 *   console.log(count)
 *   return () => console.log('cleanup')
 * })
 * count.value++
 * ```
 *
 * @param sources - The watcher's source. The source can be one of the following:
 *      - A getter function that returns a value
 *      - A ref
 *      - A reactive object
 *      - ...or an array of the above.
 * @param cb - The callback that will be called when the source changes. It receives the new and old value(s) as arguments.
 * @param options - Allows to control the watch's behaviour.
 * @see {@link https://vuejs.org/api/reactivity-core.html#watch}
 */
export const useWatch: UseWatchOverloads = <
  T extends MultiWatchSources,
  Immediate extends Readonly<boolean> = false
>(
  sources: T,
  cb: WatchCallback<MapSources<T, false>, MapSources<T, Immediate>>,
  options?: WatchOptions<Immediate>
): void => {
  if (options && 'lazy' in options && options.lazy) {
    messages.warnLazyWatch();
  }
  const reactiveRef = useRefReact<WatchStopHandle | null>(null);
  const destroyRef = () => {
    if (reactiveRef.current !== null) {
      reactiveRef.current();
      reactiveRef.current = null;
    }
  };
  const initializeRef = (inRender: boolean) => {
    if (reactiveRef.current === null) {
      if (inRender && getFiberInDev() !== null) {
        return;
      }
      reactiveRef.current = watch(sources, cb, {
        ...options,
        lazy: false,
      } as WatchOptions<Immediate>);
    }
  };
  initializeRef(true);
  useEffectReact(() => {
    initializeRef(false);
    return () => {
      destroyRef();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
