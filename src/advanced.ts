import {
  CustomRefFactory,
  Ref,
  ShallowRef,
  customRef,
  shallowReactive,
  shallowReadonly,
  shallowRef,
} from '@vue/reactivity';
import { isFunction } from './helper';
import { useRef } from 'react';

export {
  shallowRef,
  triggerRef,
  customRef,
  shallowReactive,
  shallowReadonly,
  toRaw,
  markRaw,
} from '@vue/reactivity';

/**
 * The hook version of `shallowRef` from `@vue/reactivity`.
 * In addition to values accepted by `shallowRef`, you can also pass an initializer function returning the value.
 *
 * This hook version allows the ref to be created when the component first renders, then cached for future re-renders.
 * If you pass in an initializer function, it will only be called on first render.
 *
 * -----------------------------
 *
 * Shallow version of {@link useReference()}.
 *
 * @example
 * ```js
 * // Inside a function component:
 * const state = useShallowRef({ count: 1 })
 *
 * // does NOT trigger change
 * state.value.count = 2
 *
 * // does trigger change
 * state.value = { count: 2 }
 * ```
 *
 * @param value - The "inner value" for the shallow ref, or a function that returns the inner value.
 * @see {@link https://vuejs.org/api/reactivity-advanced.html#shallowref}
 */
export const useShallowRef = <T>(value: T | (() => T)): ShallowRef<T> => {
  const reactiveRef = useRef<ShallowRef<T> | null>(null);
  if (reactiveRef.current === null) {
    reactiveRef.current = shallowRef(isFunction(value) ? value() : value);
  }
  return reactiveRef.current;
};

/**
 * The hook version of `customRef` from `@vue/reactivity`.
 *
 * This hook version allows the ref to be created when the component first renders, then cached for future re-renders.
 *
 * -----------------------------
 *
 * Creates a customized ref with explicit control over its dependency tracking
 * and updates triggering.
 *
 * @param factory - The function that receives the `track` and `trigger` callbacks.
 * @see {@link https://vuejs.org/api/reactivity-advanced.html#customref}
 */
export const useCustomRef = <T>(factory: CustomRefFactory<T>): Ref<T> => {
  const reactiveRef = useRef<ShallowRef<T> | null>(null);
  if (reactiveRef.current === null) {
    reactiveRef.current = customRef(factory);
  }
  return reactiveRef.current;
};

/**
 * The hook version of `shallowReactive` from `@vue/reactivity`.
 * In addition to values accepted by `shallowReactive`, you can also pass an initializer function returning the value.
 *
 * This hook version allows the reactive object to be created when the component first renders, then cached for future
 * re-renders.
 * If you pass in an initializer function, it will only be called on first render.
 *
 * -----------------------------
 *
 * Shallow version of {@link useReactive()}.
 *
 * Unlike {@link useRective()}, there is no deep conversion: only root-level
 * properties are reactive for a shallow reactive object. Property values are
 * stored and exposed as-is - this also means properties with ref values will
 * not be automatically unwrapped.
 *
 * @example
 * ```js
 * // Inside a function component:
 * const state = useShallowReactive(() => ({
 *   foo: 1,
 *   nested: {
 *     bar: 2
 *   }
 * }))
 *
 * // mutating state's own properties is reactive
 * state.foo++
 *
 * // ...but does not convert nested objects
 * isReactive(state.nested) // false
 *
 * // NOT reactive
 * state.nested.bar++
 * ```
 *
 * @param target - The source object, or a function that returns the source object.
 * @see {@link https://vuejs.org/api/reactivity-advanced.html#shallowreactive}
 */
export const useShallowReactive = <T extends object>(
  target: T | (() => T)
): T => {
  const reactiveRef = useRef<T | null>(null);
  if (reactiveRef.current === null) {
    reactiveRef.current = shallowReactive(
      isFunction(target) ? target() : target
    );
  }
  return reactiveRef.current;
};

/**
 * The hook version of `shallowReadonly` from `@vue/reactivity`.
 * In addition to values accepted by `shallowReadonly`, you can also pass an initializer function returning the value.
 *
 * This hook version allows the readonly ref to be created when the component first renders, then cached for future
 * re-renders.
 * If you pass in an initializer function, it will only be called on first render.
 *
 * -----------------------------
 *
 * Shallow version of {@link useReadonly()}.
 *
 * Unlike {@link useReadonly()}, there is no deep conversion: only root-level
 * properties are made readonly. Property values are stored and exposed as-is -
 * this also means properties with ref values will not be automatically
 * unwrapped.
 *
 * @example
 * ```js
 * // Inside a function component:
 * const state = useShallowReadonly(() => ({
 *   foo: 1,
 *   nested: {
 *     bar: 2
 *   }
 * }))
 *
 * // mutating state's own properties will fail
 * state.foo++
 *
 * // ...but works on nested objects
 * isReadonly(state.nested) // false
 *
 * // works
 * state.nested.bar++
 * ```
 *
 * @param target - The source object, or a function that returns the source object.
 * @see {@link https://vuejs.org/api/reactivity-advanced.html#shallowreadonly}
 */
export const useShallowReadonly = <T extends object>(
  target: T | (() => T)
): Readonly<T> => {
  const reactiveRef = useRef<Readonly<T> | null>(null);
  if (reactiveRef.current === null) {
    reactiveRef.current = shallowReadonly(
      isFunction(target) ? target() : target
    );
  }
  return reactiveRef.current;
};
