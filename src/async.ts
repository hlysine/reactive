import { Ref, ref } from '@vue/reactivity';
import {
  MultiWatchSources,
  MapSources,
  WatchStopHandle,
  WatchSource,
  WatchOptions,
  watch,
} from 'core';
import { getFiberInDev } from 'helper';
import messages from 'messages';
import {
  useDebugValue,
  useRef as useRefReact,
  useEffect as useEffectReact,
} from 'react';

export interface AsyncReturn<TResult, TError, P extends any[]> {
  loading: Ref<boolean>;
  error: Ref<TError | undefined>;
  result: Ref<TResult | undefined>;
  execute: (...args: P) => void;
}

export const async = <TResult, TError = any, P extends any[] = []>(
  func: (...args: P) => Promise<TResult>
): AsyncReturn<TResult, TError, P> => {
  const loading = ref(false);
  const error: Ref<TError | undefined> = ref(undefined);
  const result: Ref<TResult | undefined> = ref(undefined);

  const execute = (...args: P) => {
    (async () => {
      loading.value = true;
      try {
        result.value = await func(...args);
      } catch (ex: any) {
        error.value = ex;
      } finally {
        loading.value = false;
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

export const useAsync = <TResult, TError = any, P extends any[] = []>(
  func: (...args: P) => Promise<TResult>
) => {
  const reactiveRef = useRefReact<AsyncReturn<TResult, TError, P> | null>(null);
  if (reactiveRef.current === null) {
    reactiveRef.current = async(func);
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

export interface AsyncWatchReturn<TResult, TError> {
  loading: Ref<boolean>;
  error: Ref<TError | undefined>;
  result: Ref<TResult | undefined>;
  stop: WatchStopHandle;
}

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
    options?: WatchOptions<Immediate>
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
    options?: WatchOptions<Immediate>
  ): AsyncWatchReturn<TResult, TError>;
  // overload: single source + cb
  <TResult, TError = any, T = any, Immediate extends Readonly<boolean> = true>(
    source: WatchSource<T>,
    cb: AsyncWatchCallback<
      TResult,
      T,
      Immediate extends true ? T | undefined : T
    >,
    options?: WatchOptions<Immediate>
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
    options?: WatchOptions<Immediate>
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
  options?: WatchOptions<Immediate>
): AsyncWatchReturn<TResult, TError> => {
  const { loading, error, result, execute } = async<
    TResult,
    TError,
    Parameters<typeof cb>
  >(cb);
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
    options?: WatchOptions<Immediate>
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
    options?: WatchOptions<Immediate>
  ): UseAsyncWatchReturn<TResult, TError>;
  // overload: single source + cb
  <TResult, TError = any, T = any, Immediate extends Readonly<boolean> = true>(
    source: WatchSource<T>,
    cb: AsyncWatchCallback<
      TResult,
      T,
      Immediate extends true ? T | undefined : T
    >,
    options?: WatchOptions<Immediate>
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
    options?: WatchOptions<Immediate>
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
  options?: WatchOptions<Immediate>
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
