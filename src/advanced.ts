import {
  CustomRefFactory,
  Ref,
  ShallowRef,
  customRef,
  shallowReactive,
  shallowReadonly,
  shallowRef,
} from '@vue/reactivity';
import { isCallable } from './helper';
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

export const useShallowRef = <T>(value: T | (() => T)): ShallowRef<T> => {
  const reactiveRef = useRef<ShallowRef<T> | null>(null);
  if (reactiveRef.current === null) {
    reactiveRef.current = shallowRef(isCallable(value) ? value() : value);
  }
  return reactiveRef.current;
};

export const useCustomRef = <T>(factory: CustomRefFactory<T>): Ref<T> => {
  const reactiveRef = useRef<ShallowRef<T> | null>(null);
  if (reactiveRef.current === null) {
    reactiveRef.current = customRef(factory);
  }
  return reactiveRef.current;
};

export const useShallowReactive = <T extends object>(
  target: T | (() => T)
): T => {
  const reactiveRef = useRef<T | null>(null);
  if (reactiveRef.current === null) {
    reactiveRef.current = shallowReactive(
      isCallable(target) ? target() : target
    );
  }
  return reactiveRef.current;
};

export const useShallowReadonly = <T extends object>(
  target: T | (() => T)
): Readonly<T> => {
  const reactiveRef = useRef<Readonly<T> | null>(null);
  if (reactiveRef.current === null) {
    reactiveRef.current = shallowReadonly(
      isCallable(target) ? target() : target
    );
  }
  return reactiveRef.current;
};
