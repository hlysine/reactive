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

export function assignDiff(target: Record<any, any>, source: Record<any, any>) {
  let remainingKeys = Object.keys(target);
  if (source !== null && source !== undefined && typeof source === 'object') {
    Object.entries(source).forEach(([key, value]) => {
      remainingKeys = remainingKeys.filter((k) => k !== key);
      if (key in target && Object.is(target[key], value)) {
        return;
      }
      target[key] = value;
    });
  }
  remainingKeys.forEach((key) => {
    delete target[key];
  });
}

const WRAP_KEY = '__current__';

export type WrappedRef<T> = T & { [WRAP_KEY]: T };

const OBJ_NON_EXTENSIBLE =
  'A wrapped ref cannot contain objects that are non-extensible.';

export function createWrappedRef<T>(ref: T): WrappedRef<T> {
  if (!Object.isExtensible(ref)) {
    throw new Error(OBJ_NON_EXTENSIBLE);
  }
  const obj = {
    [WRAP_KEY]: ref,
  } as WrappedRef<T>;
  return new Proxy(obj, {
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
    get(target, p) {
      if (p === WRAP_KEY) {
        return target[WRAP_KEY];
      } else {
        return Reflect.get(target[WRAP_KEY] as any, p, target[WRAP_KEY] as any);
      }
    },
    getOwnPropertyDescriptor(target, p) {
      const descriptor = Reflect.getOwnPropertyDescriptor(
        target[WRAP_KEY] as any,
        p
      );
      if (descriptor && !descriptor.configurable) {
        return undefined;
      }
      return descriptor;
    },
    getPrototypeOf(target) {
      return Reflect.getPrototypeOf(target[WRAP_KEY] as any);
    },
    has(target, p) {
      return Reflect.has(target[WRAP_KEY] as any, p);
    },
    isExtensible(target) {
      return Reflect.isExtensible(target);
    },
    ownKeys(target) {
      return Reflect.ownKeys(target[WRAP_KEY] as any);
    },
    preventExtensions() {
      throw new Error(
        'The extensibility of a wrapped ref cannot be modified. It is always true.'
      );
    },
    set(target, p, newValue) {
      if (p === WRAP_KEY) {
        if (!Object.isExtensible(newValue)) {
          throw new Error(OBJ_NON_EXTENSIBLE);
        }
        target[WRAP_KEY] = newValue;
        return true;
      } else
        return Reflect.set(
          target[WRAP_KEY] as any,
          p,
          newValue,
          target[WRAP_KEY] as any
        );
    },
    setPrototypeOf(target, v) {
      return Reflect.setPrototypeOf(target[WRAP_KEY] as any, v);
    },
  });
}

export function updateWrappedRef<T, U extends T>(
  ref: WrappedRef<T>,
  newVal: U
) {
  ref[WRAP_KEY] = newVal;
}
