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
  onScopeDispose,
  reactive,
  readonly,
  ref,
} from '@vue/reactivity';
import { hasChanged, isCallable, isFunction, traverse } from './helper';
import { useRef } from 'react';

export { ref, computed, reactive, readonly } from '@vue/reactivity';

export const useReference = <T>(value: T | (() => T)): Ref<UnwrapRef<T>> => {
  const reactiveRef = useRef<Ref<UnwrapRef<T>> | null>(null);
  if (reactiveRef.current === null) {
    reactiveRef.current = ref(isCallable(value) ? value() : value);
  }
  return reactiveRef.current;
};

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

export const useComputed: UseComputed = (<T>(
  optionsOrGetter: ComputedGetter<T> | WritableComputedOptions<T>,
  debugOptions?: DebuggerOptions
): ComputedRef<T> | WritableComputedRef<T> => {
  const reactiveRef = useRef<ComputedRef<T> | WritableComputedRef<T> | null>(
    null
  );
  if (reactiveRef.current === null) {
    reactiveRef.current = computed(optionsOrGetter as any, debugOptions);
    onScopeDispose(() => {
      reactiveRef.current = null;
    });
  }
  return reactiveRef.current;
}) as UseComputed;

export const useReactive = <T extends object>(
  target: T | (() => T)
): UnwrapNestedRefs<T> => {
  const reactiveRef = useRef<UnwrapNestedRefs<T> | null>(null);
  if (reactiveRef.current === null) {
    reactiveRef.current = reactive(isCallable(target) ? target() : target);
  }
  return reactiveRef.current;
};

export const useReadonly = <T extends object>(
  target: T | (() => T)
): DeepReadonly<UnwrapNestedRefs<T>> => {
  const reactiveRef = useRef<DeepReadonly<UnwrapNestedRefs<T>> | null>(null);
  if (reactiveRef.current === null) {
    reactiveRef.current = readonly(isCallable(target) ? target() : target);
  }
  return reactiveRef.current;
};

type CleanupFn = () => void;

type UseWatchEffectOptions = Pick<
  ReactiveEffectOptions,
  'lazy' | 'onTrack' | 'onTrigger'
>;

interface UseWatchEffectRef {
  effect: ReactiveEffectRunner<void>;
  cleanup?: CleanupFn | undefined;
}

export const useWatchEffect = (
  fn: () => CleanupFn | void,
  options?: UseWatchEffectOptions
): void => {
  const reactiveRef = useRef<UseWatchEffectRef | null>(null);
  if (reactiveRef.current === null) {
    reactiveRef.current = {
      effect: null!,
    };
    reactiveRef.current.effect = internalEffect(() => {
      reactiveRef.current!.cleanup?.();
      reactiveRef.current!.cleanup = fn() ?? undefined;
    }, options);
    onScopeDispose(() => {
      reactiveRef.current = null;
    });
  }
};

export const effect = (
  fn: () => CleanupFn | void,
  options?: ReactiveEffectOptions
): ReactiveEffectRunner => {
  let cleanupFn: CleanupFn | undefined;
  return internalEffect(() => {
    cleanupFn?.();
    cleanupFn = fn() ?? undefined;
  }, options);
};

// ========================================
// watch implementation
// reference: https://github.com/vuejs/core/blob/020851e57d9a9f727c6ea07e9c1575430af02b73/packages/runtime-core/src/apiWatch.ts
// ========================================

export type WatchSource<T = any> = Ref<T> | ComputedRef<T> | (() => T);

type MultiWatchSources = (WatchSource<unknown> | object)[];

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

export type WatchCallback<V = any, OV = any> = (
  value: V,
  oldValue: OV
) => CleanupFn | void;

export interface WatchOptions<Immediate = boolean> extends DebuggerOptions {
  immediate?: Immediate;
  deep?: boolean;
}

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

export const watch: WatchOverloads = <
  T extends MultiWatchSources,
  Immediate extends Readonly<boolean> = false
>(
  sources: T,
  cb: WatchCallback<MapSources<T, false>, MapSources<T, Immediate>>,
  options?: WatchOptions<Immediate>
): WatchStopHandle => {
  const warnInvalidSource = (s: unknown) =>
    console.warn(
      'Invalid watch source: ',
      s,
      'A watch source can only be a getter/effect function, a ref, a reactive object, or an array of these types.'
    );

  let deep = options?.deep ?? false;
  const immediate = options?.immediate ?? false;
  const onTrack = options?.onTrack ?? undefined;
  const onTrigger = options?.onTrigger ?? undefined;

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
          warnInvalidSource(s);
          return s;
        }
      });
  } else if (isFunction(sources)) {
    getter = sources;
  } else {
    warnInvalidSource(sources);
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
    console.log('watch scheduler start');
    if (!effect.effect.active) {
      return;
    }
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
    onTrack,
    onTrigger,
  });
  if (immediate) {
    job();
  } else {
    oldValue = effect();
  }

  return () => effect.effect.stop();
};

interface UseWatchOverloads {
  // overload: array of multiple sources + cb
  <T extends MultiWatchSources, Immediate extends Readonly<boolean> = false>(
    sources: [...T],
    cb: WatchCallback<MapSources<T, false>, MapSources<T, Immediate>>,
    options?: WatchOptions<Immediate>
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
    options?: WatchOptions<Immediate>
  ): void;
  // overload: single source + cb
  <T, Immediate extends Readonly<boolean> = false>(
    source: WatchSource<T>,
    cb: WatchCallback<T, Immediate extends true ? T | undefined : T>,
    options?: WatchOptions<Immediate>
  ): void;
  // overload: watching reactive object w/ cb
  <T extends object, Immediate extends Readonly<boolean> = false>(
    source: T,
    cb: WatchCallback<T, Immediate extends true ? T | undefined : T>,
    options?: WatchOptions<Immediate>
  ): void;
}

export const useWatch: UseWatchOverloads = <
  T extends MultiWatchSources,
  Immediate extends Readonly<boolean> = false
>(
  sources: T,
  cb: WatchCallback<MapSources<T, false>, MapSources<T, Immediate>>,
  options?: WatchOptions<Immediate>
): void => {
  const reactiveRef = useRef<WatchStopHandle | null>(null);
  if (reactiveRef.current === null) {
    reactiveRef.current = watch(sources, cb, options);
    onScopeDispose(() => {
      reactiveRef.current = null;
    });
  }
};
