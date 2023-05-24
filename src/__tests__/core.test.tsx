import '@testing-library/jest-dom';
import {
  isReactive,
  isReadonly,
  isRef,
  ref,
  useComputed,
  useReactive,
  useReadonly,
  useReference,
} from '..';
import 'jest-performance-testing';
import { renderHook, act } from '@testing-library/react';

describe('useReference', () => {
  it('returns a valid ref', () => {
    const { result } = renderHook(() => useReference(1));
    expect(result.current.value).toBe(1);
    expect(isRef(result.current)).toBe(true);
  });
  it('keeps the same instance across re-render', () => {
    const { result, rerender } = renderHook(() => useReference(1));
    const ref = result.current;

    rerender();

    expect(result.current).toBe(ref);
  });
  it('works with initializer function', () => {
    const initializer = jest.fn(() => ({ count: 1 }));
    const { result, rerender } = renderHook(() => useReference(initializer));
    const ref = result.current;
    expect(result.current.value.count).toBe(1);
    expect(initializer).toBeCalledTimes(1);

    rerender();

    expect(result.current.value.count).toBe(1);
    expect(initializer).toBeCalledTimes(1);
    expect(result.current).toBe(ref);
  });
});

describe('useComputed', () => {
  it('returns a valid ref', () => {
    const { result } = renderHook(() => useComputed(() => 1));
    expect(result.current.value).toBe(1);
    expect(isRef(result.current)).toBe(true);
    expect(isReadonly(result.current)).toBe(true);
  });
  it('works with writable computed ref', () => {
    const count = ref(0);
    const getter = jest.fn(() => count.value + 1);
    const setter = jest.fn((val) => (count.value = val - 1));
    const { result } = renderHook(() =>
      useComputed({
        get: getter,
        set: setter,
      })
    );
    expect(result.current.value).toBe(1);
    expect(isRef(result.current)).toBe(true);
    expect(isReadonly(result.current)).toBe(false);

    act(() => {
      result.current.value++;
      // test the value while also re-running the getter
      expect(result.current.value).toBe(2);
    });

    expect(getter).toBeCalledTimes(2);
    expect(setter).toBeCalledTimes(1);
  });
  it('keeps the same instance across re-render', () => {
    const obj = { count: 1 };
    const { result, rerender } = renderHook(() => useComputed(() => obj));
    const ref = result.current;
    expect(result.current.value).toBe(obj);

    rerender();

    expect(result.current).toBe(ref);
    expect(result.current.value).toBe(obj);
  });
  it('is reactive', () => {
    const count = ref(0);
    const getter = jest.fn(() => count.value + 1);
    const { result, rerender } = renderHook(() => useComputed(getter));

    expect(result.current.value).toBe(1);
    expect(getter).toBeCalledTimes(1);

    rerender();

    expect(result.current.value).toBe(1);
    expect(getter).toBeCalledTimes(1);

    act(() => {
      count.value++;
    });

    expect(result.current.value).toBe(2);
    expect(getter).toBeCalledTimes(2);
  });
});

describe('useReactive', () => {
  it('returns a valid reactive object', () => {
    const { result } = renderHook(() => useReactive({ a: 1, b: 2 }));
    expect(result.current).toEqual({ a: 1, b: 2 });
    expect(isReactive(result.current)).toBe(true);
  });
  it('keeps the same instance across re-render', () => {
    const { result, rerender } = renderHook(() => useReactive({ a: 1, b: 2 }));
    const ref = result.current;

    rerender();

    expect(result.current).toBe(ref);
  });
  it('works with initializer function', () => {
    const initializer = jest.fn(() => ({ a: 1, b: 2 }));
    const { result, rerender } = renderHook(() => useReactive(initializer));
    const ref = result.current;
    expect(result.current).toEqual({ a: 1, b: 2 });
    expect(initializer).toBeCalledTimes(1);

    rerender();

    expect(result.current).toEqual({ a: 1, b: 2 });
    expect(initializer).toBeCalledTimes(1);
    expect(result.current).toBe(ref);
  });
});

describe('useReadonly', () => {
  it('returns a valid readonly object', () => {
    const { result } = renderHook(() => useReadonly({ a: 1, b: 2 }));
    expect(result.current).toEqual({ a: 1, b: 2 });
    expect(isReadonly(result.current)).toBe(true);
  });
  it('keeps the same instance across re-render', () => {
    const { result, rerender } = renderHook(() => useReadonly({ a: 1, b: 2 }));
    const ref = result.current;

    rerender();

    expect(result.current).toBe(ref);
  });
  it('works with initializer function', () => {
    const initializer = jest.fn(() => ({ a: 1, b: 2 }));
    const { result, rerender } = renderHook(() => useReadonly(initializer));
    const ref = result.current;
    expect(result.current).toEqual({ a: 1, b: 2 });
    expect(initializer).toBeCalledTimes(1);

    rerender();

    expect(result.current).toEqual({ a: 1, b: 2 });
    expect(initializer).toBeCalledTimes(1);
    expect(result.current).toBe(ref);
  });
});
