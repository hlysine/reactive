import { Ref, ref } from '@vue/reactivity';
import {
  MultiWatchSources,
  MapSources,
  WatchStopHandle,
  WatchSource,
  WatchOptions,
  watch,
} from './core';
import { getFiberInDev } from './helper';
import messages from './messages';
import {
  useDebugValue,
  useRef as useRefReact,
  useEffect as useEffectReact,
} from 'react';

/**
 * Data and functions returned by the {@link async()} function.
 */
export interface AsyncReturn<TResult, TError, P extends any[]> {
  /**
   * A reactive ref storing the loading state of {@link async()}. True when there is an unsettled promise running.
   */
  loading: Ref<boolean>;
  /**
   * A reactive ref storing the error from promise rejection. If the promise is resolved successfully, `error` will be
   * undefined. If the promise is rejected, `error` will be set and `result` will be undefined.
   */
  error: Ref<TError | undefined>;
  /**
   * A reactive ref storing the result from a resolved promise. If the promise is resolved successfully, `result` will
   * be set and `error` will be undefined. If the promise is rejected, `error` will be set and `result` will be
   * undefined.
   */
  result: Ref<TResult | undefined>;
  /**
   * Run the provided async function. Note that this function is not awaitable. Use the provided reactive values to
   * update UI while the async function is running.
   * @param args Arguments to be passed to the async function.
   */
  execute: (...args: P) => void;
}

/**
 * Options for {@link async()}.
 */
export interface AsyncOptions {
  /**
   * Specifies the behavior when the async function is executed again while the last promise has not yet been settled.
   *
   * `first` ignores the newest execution and only returns results from the first, oldest promise.
   *
   * `last` ignores the oldest execution and only returns results from the last, most recent promise.
   *
   * No results are ignored if the async function is executed after the last promise has settled.
   */
  overlap?: 'first' | 'last';
}

/**
 * Execute an async function and store its results in reactive values. By watching these reactive values, you will be
 * notified when the promise settles without having to await the function.
 * @param func The async function to be executed.
 * @param options Options for async behavior.
 * @returns Reactive values and functions to monitor async execution.
 */
export const async = <TResult, TError = any, P extends any[] = []>(
  func: (...args: P) => Promise<TResult>,
  options: AsyncOptions = {}
): AsyncReturn<TResult, TError, P> => {
  const { overlap = 'last' } = options;

  const loading = ref(false);
  let taskId = 0;
  const error: Ref<TError | undefined> = ref(undefined);
  const result: Ref<TResult | undefined> = ref(undefined);

  const execute = (...args: P) => {
    (async () => {
      if (overlap === 'first' && loading.value) return;
      taskId++;
      const currentId = taskId;
      loading.value = true;
      try {
        const res = await func(...args);
        if (currentId === taskId) {
          result.value = res;
          error.value = undefined;
        }
      } catch (ex: any) {
        if (currentId === taskId) {
          result.value = undefined;
          error.value = ex;
        }
      } finally {
        if (currentId === taskId) {
          loading.value = false;
        }
      }
    })();
  };

  return {
    loading,
    error,
    result,
    execute,
  };
};

/**
 * The hook version of {@link async()} that memoizes the reactive values across re-renders.
 *
 * ----------------------
 *
 * Execute an async function and store its results in reactive values. By watching these reactive values, you will be
 * notified when the promise settles without having to await the function.
 * @param func The async function to be executed.
 * @param options Options for async behavior.
 * @returns Reactive values and functions to monitor async execution.
 */
export const useAsync = <TResult, TError = any, P extends any[] = []>(
  func: (...args: P) => Promise<TResult>,
  options?: AsyncOptions
) => {
  const reactiveRef = useRefReact<AsyncReturn<TResult, TError, P> | null>(null);
  if (reactiveRef.current === null) {
    reactiveRef.current = async(func, options);
  }
  useDebugValue(reactiveRef.current);
  return reactiveRef.current;
};

/**
 * A callback function to be executed when an async watch is triggered.
 * This function receives the new and old value of the watch values and returns a promise.
 */
export type AsyncWatchCallback<T, V = any, OV = any> = (
  value: V,
  oldValue: OV
) => Promise<T>;

/**
 * Data and functions returned by the {@link asyncWatch()} function.
 */
export interface AsyncWatchReturn<TResult, TError> {
  /**
   * A reactive ref storing the loading state of {@link async()}. True when there is an unsettled promise running.
   */
  loading: Ref<boolean>;
  /**
   * A reactive ref storing the error from promise rejection. If the promise is resolved successfully, `error` will be
   * undefined. If the promise is rejected, `error` will be set and `result` will be undefined.
   */
  error: Ref<TError | undefined>;
  /**
   * A reactive ref storing the result from a resolved promise. If the promise is resolved successfully, `result` will
   * be set and `error` will be undefined. If the promise is rejected, `error` will be set and `result` will be
   * undefined.
   */
  result: Ref<TResult | undefined>;
  /**
   * A function that stops the async watch when called.
   */
  stop: WatchStopHandle;
}

/**
 * Options for {@link asyncWatch()}.
 */
export interface AsyncWatchOptions<Immediate>
  extends WatchOptions<Immediate>,
    AsyncOptions {}

interface AsyncWatchOverloads {
  // overload: array of multiple sources + cb
  <
    TResult,
    TError = any,
    T extends MultiWatchSources = any,
    Immediate extends Readonly<boolean> = true
  >(
    sources: [...T],
    cb: AsyncWatchCallback<
      TResult,
      MapSources<T, false>,
      MapSources<T, Immediate>
    >,
    options?: AsyncWatchOptions<Immediate>
  ): AsyncWatchReturn<TResult, TError>;
  // overload: multiple sources w/ `as const`
  // watch([foo, bar] as const, () => {})
  // somehow [...T] breaks when the type is readonly
  <
    TResult,
    TError = any,
    T extends Readonly<MultiWatchSources> = any,
    Immediate extends Readonly<boolean> = true
  >(
    source: T,
    cb: AsyncWatchCallback<
      TResult,
      MapSources<T, false>,
      MapSources<T, Immediate>
    >,
    options?: AsyncWatchOptions<Immediate>
  ): AsyncWatchReturn<TResult, TError>;
  // overload: single source + cb
  <TResult, TError = any, T = any, Immediate extends Readonly<boolean> = true>(
    source: WatchSource<T>,
    cb: AsyncWatchCallback<
      TResult,
      T,
      Immediate extends true ? T | undefined : T
    >,
    options?: AsyncWatchOptions<Immediate>
  ): AsyncWatchReturn<TResult, TError>;
  // overload: watching reactive object w/ cb
  <
    TResult,
    TError = any,
    T extends object = any,
    Immediate extends Readonly<boolean> = true
  >(
    source: T,
    cb: AsyncWatchCallback<
      TResult,
      T,
      Immediate extends true ? T | undefined : T
    >,
    options?: AsyncWatchOptions<Immediate>
  ): AsyncWatchReturn<TResult, TError>;
}

export const asyncWatch: AsyncWatchOverloads = <
  TResult,
  TError = any,
  T extends MultiWatchSources = any,
  Immediate extends Readonly<boolean> = true
>(
  sources: T,
  cb: AsyncWatchCallback<
    TResult,
    MapSources<T, false>,
    MapSources<T, Immediate>
  >,
  options?: AsyncWatchOptions<Immediate>
): AsyncWatchReturn<TResult, TError> => {
  const { loading, error, result, execute } = async<
    TResult,
    TError,
    Parameters<typeof cb>
  >(cb, options);
  if (!options) {
    options = { immediate: true as any };
  } else if (options.immediate !== false) {
    options.immediate = true as any;
  }
  const stop = watch(sources, execute, options);
  return { loading, error, result, stop };
};

export interface UseAsyncWatchReturn<TResult, TError> {
  loading: Ref<boolean>;
  error: Ref<TError | undefined>;
  result: Ref<TResult | undefined>;
}

interface UseAsyncWatchOverloads {
  // overload: array of multiple sources + cb
  <
    TResult,
    TError = any,
    T extends MultiWatchSources = any,
    Immediate extends Readonly<boolean> = true
  >(
    sources: [...T],
    cb: AsyncWatchCallback<
      TResult,
      MapSources<T, false>,
      MapSources<T, Immediate>
    >,
    options?: AsyncWatchOptions<Immediate>
  ): UseAsyncWatchReturn<TResult, TError>;
  // overload: multiple sources w/ `as const`
  // watch([foo, bar] as const, () => {})
  // somehow [...T] breaks when the type is readonly
  <
    TResult,
    TError = any,
    T extends Readonly<MultiWatchSources> = any,
    Immediate extends Readonly<boolean> = true
  >(
    source: T,
    cb: AsyncWatchCallback<
      TResult,
      MapSources<T, false>,
      MapSources<T, Immediate>
    >,
    options?: AsyncWatchOptions<Immediate>
  ): UseAsyncWatchReturn<TResult, TError>;
  // overload: single source + cb
  <TResult, TError = any, T = any, Immediate extends Readonly<boolean> = true>(
    source: WatchSource<T>,
    cb: AsyncWatchCallback<
      TResult,
      T,
      Immediate extends true ? T | undefined : T
    >,
    options?: AsyncWatchOptions<Immediate>
  ): UseAsyncWatchReturn<TResult, TError>;
  // overload: watching reactive object w/ cb
  <
    TResult,
    TError = any,
    T extends object = any,
    Immediate extends Readonly<boolean> = true
  >(
    source: T,
    cb: AsyncWatchCallback<
      TResult,
      T,
      Immediate extends true ? T | undefined : T
    >,
    options?: AsyncWatchOptions<Immediate>
  ): UseAsyncWatchReturn<TResult, TError>;
}

export const useAsyncWatch: UseAsyncWatchOverloads = <
  TResult,
  TError = any,
  T extends MultiWatchSources = any,
  Immediate extends Readonly<boolean> = true
>(
  sources: T,
  cb: AsyncWatchCallback<
    TResult,
    MapSources<T, false>,
    MapSources<T, Immediate>
  >,
  options?: AsyncWatchOptions<Immediate>
): UseAsyncWatchReturn<TResult, TError> => {
  if (options && 'lazy' in options && options.lazy) {
    messages.warnLazyAsyncWatch();
  }
  const reactiveRef = useRefReact<AsyncWatchReturn<TResult, TError> | null>(
    null
  );
  const destroyRef = () => {
    if (reactiveRef.current !== null) {
      reactiveRef.current.stop();
      reactiveRef.current = null;
    }
  };
  const initializeRef = (inRender: boolean) => {
    if (reactiveRef.current === null) {
      if (inRender && getFiberInDev() !== null) {
        reactiveRef.current = {
          result: ref(undefined),
          error: ref(undefined),
          loading: ref(false),
          stop: () => {},
        };
        return;
      }
      reactiveRef.current = asyncWatch(sources, cb, {
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
  const { stop: _, ...rest } = reactiveRef.current!;
  return rest;
};
