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
  effect,
  reactive,
  readonly,
  ref,
} from '@vue/reactivity';
import { isCallable } from './helper';
import { useRef } from 'react';

export { ref, computed, reactive, readonly, effect } from '@vue/reactivity';

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

export const useReactiveEffect = (
  fn: () => void,
  options?: ReactiveEffectOptions
): void => {
  const reactiveRef = useRef<ReactiveEffectRunner<void> | null>(null);
  if (reactiveRef.current === null) {
    reactiveRef.current = effect(fn, options);
  }
};
