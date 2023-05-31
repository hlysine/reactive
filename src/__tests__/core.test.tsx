import '@testing-library/jest-dom';
import {
  effect,
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

describe('effect', () => {
  it('is reactive', () => {
    const counter = ref(1);
    const effectFn = jest.fn();

    const runner = effect(() => {
      effectFn(counter.value);
    });

    expect(effectFn).toBeCalledTimes(1);

    counter.value++;

    expect(effectFn).toBeCalledTimes(2);

    runner.effect.stop();
    counter.value++;

    expect(effectFn).toBeCalledTimes(2);
  });
  it('calls onStop function', () => {
    const counter = ref(1);
    const effectFn = jest.fn();
    const cleanupFn = jest.fn();
    const stopFn = jest.fn();

    const runner = effect(
      () => {
        effectFn(counter.value);
        return cleanupFn;
      },
      { onStop: stopFn }
    );

    expect(stopFn).toBeCalledTimes(0);
    expect(cleanupFn).toBeCalledTimes(0);

    runner.effect.stop();

    expect(stopFn).toBeCalledTimes(1);
    expect(cleanupFn).toBeCalledTimes(1);
  });
  it('cleans up properly', () => {
    const counter = ref(1);
    const effectFn = jest.fn();
    const cleanupFn = jest.fn();

    const runner = effect(() => {
      effectFn(counter.value);
      return cleanupFn;
    });

    expect(effectFn).toBeCalledTimes(1);
    expect(cleanupFn).toBeCalledTimes(0);

    counter.value++;

    expect(effectFn).toBeCalledTimes(2);
    expect(cleanupFn).toBeCalledTimes(1);

    runner.effect.stop();

    expect(effectFn).toBeCalledTimes(2);
    expect(cleanupFn).toBeCalledTimes(2);
  });
  it('maintains correct cleanup function instance', () => {
    const counter = ref(0);
    const effectPairs = [
      { effect: jest.fn(), cleanup: jest.fn() },
      { effect: jest.fn(), cleanup: jest.fn() },
    ];

    const runner = effect(() => {
      effectPairs[counter.value].effect();
      return effectPairs[counter.value].cleanup;
    });

    expect(effectPairs[0].effect).toBeCalledTimes(1);
    expect(effectPairs[0].cleanup).toBeCalledTimes(0);
    expect(effectPairs[1].effect).toBeCalledTimes(0);
    expect(effectPairs[1].cleanup).toBeCalledTimes(0);

    counter.value++;

    expect(effectPairs[0].effect).toBeCalledTimes(1);
    expect(effectPairs[0].cleanup).toBeCalledTimes(1);
    expect(effectPairs[1].effect).toBeCalledTimes(1);
    expect(effectPairs[1].cleanup).toBeCalledTimes(0);

    runner.effect.stop();

    expect(effectPairs[0].effect).toBeCalledTimes(1);
    expect(effectPairs[0].cleanup).toBeCalledTimes(1);
    expect(effectPairs[1].effect).toBeCalledTimes(1);
    expect(effectPairs[1].cleanup).toBeCalledTimes(1);
  });
});
