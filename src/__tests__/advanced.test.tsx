import '@testing-library/jest-dom';
import {
  isRef,
  useCustomRef,
  useShallowReactive,
  useShallowRef,
  isReactive,
  isReadonly,
  isShallow,
  useShallowReadonly,
} from '..';
import 'jest-performance-testing';
import { renderHook } from '@testing-library/react';

describe('useShallowRef', () => {
  it('returns a valid ref', () => {
    const { result } = renderHook(() => useShallowRef(1));
    expect(result.current.value).toBe(1);
    expect(isRef(result.current)).toBe(true);
    expect(isShallow(result.current)).toBe(true);
  });
  it('keeps the same instance across re-render', () => {
    const { result, rerender } = renderHook(() => useShallowRef(1));
    const ref = result.current;

    rerender();

    expect(result.current).toBe(ref);
  });
  it('works with initializer function', () => {
    const initializer = jest.fn(() => ({ count: 1 }));
    const { result, rerender } = renderHook(() => useShallowRef(initializer));
    const ref = result.current;
    expect(result.current.value.count).toBe(1);
    expect(initializer).toBeCalledTimes(1);

    rerender();

    expect(result.current.value.count).toBe(1);
    expect(initializer).toBeCalledTimes(1);
    expect(result.current).toBe(ref);
  });
});

describe('useCustomRef', () => {
  it('returns a valid ref', () => {
    let value = 1;
    const { result } = renderHook(() =>
      useCustomRef((track, trigger) => ({
        get() {
          track();
          return value;
        },
        set(val) {
          value = val;
          trigger();
        },
      }))
    );
    expect(result.current.value).toBe(1);
    expect(isRef(result.current)).toBe(true);
  });
  it('keeps the same instance across re-render', () => {
    let value = 1;
    const { result, rerender } = renderHook(() =>
      useCustomRef((track, trigger) => ({
        get() {
          track();
          return value;
        },
        set(val) {
          value = val;
          trigger();
        },
      }))
    );
    const ref = result.current;

    rerender();

    expect(result.current).toBe(ref);
  });
});

describe('useShallowReactive', () => {
  it('returns a valid reactive object', () => {
    const { result } = renderHook(() => useShallowReactive({ a: 1, b: 2 }));
    expect(result.current).toEqual({ a: 1, b: 2 });
    expect(isReactive(result.current)).toBe(true);
    expect(isShallow(result.current)).toBe(true);
  });
  it('keeps the same instance across re-render', () => {
    const { result, rerender } = renderHook(() =>
      useShallowReactive({ a: 1, b: 2 })
    );
    const ref = result.current;

    rerender();

    expect(result.current).toBe(ref);
  });
  it('works with initializer function', () => {
    const initializer = jest.fn(() => ({ a: 1, b: 2 }));
    const { result, rerender } = renderHook(() =>
      useShallowReactive(initializer)
    );
    const ref = result.current;
    expect(result.current).toEqual({ a: 1, b: 2 });
    expect(initializer).toBeCalledTimes(1);

    rerender();

    expect(result.current).toEqual({ a: 1, b: 2 });
    expect(initializer).toBeCalledTimes(1);
    expect(result.current).toBe(ref);
  });
});

describe('useShallowReadonly', () => {
  it('returns a valid readonly object', () => {
    const { result } = renderHook(() => useShallowReadonly({ a: 1, b: 2 }));
    expect(result.current).toEqual({ a: 1, b: 2 });
    expect(isReadonly(result.current)).toBe(true);
    expect(isShallow(result.current)).toBe(true);
  });
  it('keeps the same instance across re-render', () => {
    const { result, rerender } = renderHook(() =>
      useShallowReadonly({ a: 1, b: 2 })
    );
    const ref = result.current;

    rerender();

    expect(result.current).toBe(ref);
  });
  it('works with initializer function', () => {
    const initializer = jest.fn(() => ({ a: 1, b: 2 }));
    const { result, rerender } = renderHook(() =>
      useShallowReadonly(initializer)
    );
    const ref = result.current;
    expect(result.current).toEqual({ a: 1, b: 2 });
    expect(initializer).toBeCalledTimes(1);

    rerender();

    expect(result.current).toEqual({ a: 1, b: 2 });
    expect(initializer).toBeCalledTimes(1);
    expect(result.current).toBe(ref);
  });
});
