import { ReactiveFlags, isRef } from '@vue/reactivity';
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
