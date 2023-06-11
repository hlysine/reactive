import {
  ReactiveFlags,
  isRef,
  pauseTracking,
  resetTracking,
} from '@vue/reactivity';
import { __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED as SecretInternals } from 'react';

declare module 'react' {
  interface Fiber {
    [key: string]: any;
    alternate: Fiber | null;
  }
  export const __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED: {
    ReactCurrentOwner: {
      current: Fiber | null;
    };
  };
}

export const getFiberInDev = () => SecretInternals.ReactCurrentOwner.current;

export const objectToString = Object.prototype.toString;
export const toTypeString = (value: unknown): string =>
  objectToString.call(value);

export const isObject = (val: unknown): val is Record<any, any> =>
  val !== null && typeof val === 'object';

export const isMap = (val: unknown): val is Map<any, any> =>
  toTypeString(val) === '[object Map]';

export const isSet = (val: unknown): val is Set<any> =>
  toTypeString(val) === '[object Set]';

export const isPlainObject = (val: unknown): val is object =>
  toTypeString(val) === '[object Object]';

export const isFunction = <T extends (...args: any[]) => any>(
  obj: T | unknown
): obj is T => typeof obj === 'function';

export const hasChanged = (value: any, oldValue: any): boolean =>
  !Object.is(value, oldValue);

export function traverse(value: unknown, seen?: Set<unknown>) {
  if (!isObject(value) || (value as any)[ReactiveFlags.SKIP]) {
    return value;
  }
  seen = seen || new Set();
  if (seen.has(value)) {
    return value;
  }
  seen.add(value);
  if (isRef(value)) {
    traverse(value.value, seen);
  } else if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      traverse(value[i], seen);
    }
  } else if (isSet(value) || isMap(value)) {
    value.forEach((v: any) => {
      traverse(v, seen);
    });
  } else if (isPlainObject(value)) {
    for (const key in value) {
      traverse(value[key as keyof typeof value], seen);
    }
  }
  return value;
}

export function invokeUntracked<T extends (...args: any[]) => any>(
  initializer: T
): ReturnType<T> {
  pauseTracking();
  const ret = initializer();
  resetTracking();
  return ret;
}

const WRAP_KEY = '__current__';

export type WrappedRef<T> = T & { [WRAP_KEY]: T };

export function createWrappedRef<T>(ref: T): WrappedRef<T> {
  const obj = {
    [WRAP_KEY]: ref,
  } as WrappedRef<T>;
  return new Proxy(obj, {
    apply(target, thisArg, argArray) {
      return Reflect.apply(target[WRAP_KEY] as any, thisArg, argArray);
    },
    construct(target, argArray, newTarget) {
      return Reflect.construct(target[WRAP_KEY] as any, argArray, newTarget);
    },
    defineProperty(target, property, attributes) {
      return Reflect.defineProperty(
        target[WRAP_KEY] as any,
        property,
        attributes
      );
    },
    deleteProperty(target, p) {
      return Reflect.deleteProperty(target[WRAP_KEY] as any, p);
    },
    get(target, p, receiver) {
      if (p === WRAP_KEY) return target[WRAP_KEY];
      else return Reflect.get(target[WRAP_KEY] as any, p, receiver);
    },
    getOwnPropertyDescriptor(target, p) {
      return Reflect.getOwnPropertyDescriptor(target[WRAP_KEY] as any, p);
    },
    getPrototypeOf(target) {
      return Reflect.getPrototypeOf(target[WRAP_KEY] as any);
    },
    has(target, p) {
      return Reflect.has(target[WRAP_KEY] as any, p);
    },
    isExtensible(target) {
      return Reflect.isExtensible(target[WRAP_KEY] as any);
    },
    ownKeys(target) {
      return Reflect.ownKeys(target[WRAP_KEY] as any);
    },
    preventExtensions(target) {
      return Reflect.preventExtensions(target[WRAP_KEY] as any);
    },
    set(target, p, newValue, receiver) {
      if (p === WRAP_KEY) {
        target[WRAP_KEY] = newValue;
        return true;
      } else return Reflect.set(target[WRAP_KEY] as any, p, newValue, receiver);
    },
    setPrototypeOf(target, v) {
      return Reflect.setPrototypeOf(target[WRAP_KEY] as any, v);
    },
  });
}

export function updateWrappedRef<T, U>(
  ref: WrappedRef<T>,
  newVal: U extends T ? U : never
) {
  ref[WRAP_KEY] = newVal;
}
