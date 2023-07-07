import '@testing-library/jest-dom';
import {
  effect,
  isReactive,
  isReadonly,
  isRef,
  makeReactive,
  reactive,
  ref,
  useComputed,
  useReactive,
  useReadonly,
  useRef,
  useWatch,
  useEffect,
  watch,
} from '..';
import React from 'react';
import 'jest-performance-testing';
import { renderHook, act, render } from '@testing-library/react';
import * as helper from '../helper';

let consoleWarn: jest.SpyInstance;
let getFiberInDev: jest.SpyInstance;

beforeEach(() => {
  consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  // mock getFiberInDev to simulate React production mode
  getFiberInDev = jest.spyOn(helper, 'getFiberInDev').mockReturnValue(null);
});

afterEach(() => {
  jest.resetAllMocks();
  jest.restoreAllMocks();
});

describe('useRef', () => {
  it('returns a valid ref', () => {
    const { result } = renderHook(() => useRef(1));
    expect(result.current.value).toBe(1);
    expect(isRef(result.current)).toBe(true);
  });
  it('keeps the same instance across re-render', () => {
    const { result, rerender } = renderHook(() => useRef(1));
    const ref = result.current;

    rerender();

    expect(result.current).toBe(ref);
  });
  it('works with initializer function', () => {
    const initializer = jest.fn(() => ({ count: 1 }));
    const { result, rerender } = renderHook(() => useRef(initializer));
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
  it('works with writable computed ref (Dev Mode)', () => {
    // enable React development mode
    getFiberInDev.mockRestore();

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

    expect(getter).toBeCalledTimes(3);
    expect(setter).toBeCalledTimes(1);
  });
  it('works with writable computed ref (Strict Mode)', () => {
    // enable React development mode
    getFiberInDev.mockRestore();

    const count = ref(0);
    const getter = jest.fn(() => count.value + 1);
    const setter = jest.fn((val) => (count.value = val - 1));
    const { result } = renderHook(
      () =>
        useComputed({
          get: getter,
          set: setter,
        }),
      {
        wrapper: ({ children }) => (
          <React.StrictMode>{children}</React.StrictMode>
        ),
      }
    );
    expect(result.current.value).toBe(1);
    expect(isRef(result.current)).toBe(true);
    expect(isReadonly(result.current)).toBe(false);

    act(() => {
      result.current.value++;
      // test the value while also re-running the getter
      expect(result.current.value).toBe(2);
    });

    expect(getter).toBeCalledTimes(4);
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
    const { result, rerender, unmount } = renderHook(() => useComputed(getter));

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

    unmount();
    act(() => {
      count.value++;
    });

    expect(result.current.value).toBe(2);
    expect(getter).toBeCalledTimes(2);
  });
  it('is reactive (Dev Mode)', () => {
    // enable React development mode
    getFiberInDev.mockRestore();

    const count = ref(0);
    const getter = jest.fn(() => count.value + 1);
    const { result, rerender, unmount } = renderHook(() => useComputed(getter));

    expect(result.current.value).toBe(1);
    expect(getter).toBeCalledTimes(2);

    rerender();

    expect(result.current.value).toBe(1);
    expect(getter).toBeCalledTimes(2);

    act(() => {
      count.value++;
    });

    expect(result.current.value).toBe(2);
    expect(getter).toBeCalledTimes(3);

    unmount();
    act(() => {
      count.value++;
    });

    expect(result.current.value).toBe(2);
    expect(getter).toBeCalledTimes(3);
  });
  it('is reactive (Strict Mode)', () => {
    // enable React development mode
    getFiberInDev.mockRestore();

    const count = ref(0);
    const getter = jest.fn(() => count.value + 1);
    const { result, rerender, unmount } = renderHook(
      () => useComputed(getter),
      {
        wrapper: ({ children }) => (
          <React.StrictMode>{children}</React.StrictMode>
        ),
      }
    );

    expect(result.current.value).toBe(1);
    expect(getter).toBeCalledTimes(3);

    rerender();

    expect(result.current.value).toBe(1);
    expect(getter).toBeCalledTimes(3);

    act(() => {
      count.value++;
    });

    expect(result.current.value).toBe(2);
    expect(getter).toBeCalledTimes(4);

    unmount();
    act(() => {
      count.value++;
    });

    expect(result.current.value).toBe(2);
    expect(getter).toBeCalledTimes(4);
  });
  it('triggers reactive effects with makeReactive', async () => {
    const mockEffect = jest.fn();
    const count = ref(0);
    const Tester = makeReactive(function Tester() {
      const derived = useComputed(() => count.value + 1);
      useWatch(derived, (val) => mockEffect(val));
      return <div>{derived.value}</div>;
    });
    const { unmount, findByText } = render(<Tester />);

    await expect(findByText('1')).resolves.toBeInTheDocument();
    expect(mockEffect).toBeCalledTimes(0);

    act(() => {
      count.value++;
    });

    await expect(findByText('2')).resolves.toBeInTheDocument();
    expect(mockEffect).toBeCalledTimes(1);

    unmount();
    act(() => {
      count.value++;
    });

    expect(mockEffect).toBeCalledTimes(1);
  });
  it('triggers reactive effects without makeReactive', async () => {
    const mockEffect = jest.fn();
    const count = ref(0);
    const Tester = function Tester() {
      const derived = useComputed(() => count.value + 1);
      useWatch(derived, (val) => mockEffect(val));
      return <div>{derived.value}</div>;
    };
    const { unmount, findByText } = render(<Tester />);

    await expect(findByText('1')).resolves.toBeInTheDocument();
    expect(mockEffect).toBeCalledTimes(0);

    act(() => {
      count.value++;
    });

    expect(mockEffect).toBeCalledTimes(1);

    unmount();
    act(() => {
      count.value++;
    });

    expect(mockEffect).toBeCalledTimes(1);
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

describe('useEffect', () => {
  it('is reactive', () => {
    const counter = ref(1);
    const effectFn = jest.fn();

    const { unmount } = renderHook(() =>
      useEffect(() => {
        effectFn(counter.value);
      })
    );

    expect(effectFn).toBeCalledTimes(1);

    act(() => {
      counter.value++;
    });

    expect(effectFn).toBeCalledTimes(2);

    unmount();
    act(() => {
      counter.value++;
    });

    expect(effectFn).toBeCalledTimes(2);
  });
  it('keeps the same instance across re-render', () => {
    const counter = ref(1);
    const effectFn = jest.fn();

    const { rerender, unmount } = renderHook(() =>
      useEffect(() => {
        effectFn(counter.value);
      })
    );

    expect(effectFn).toBeCalledTimes(1);

    rerender();

    expect(effectFn).toBeCalledTimes(1);

    unmount();
    act(() => {
      counter.value++;
    });

    expect(effectFn).toBeCalledTimes(1);
  });
  it('cleans up without effect scope', () => {
    const counter = ref(1);
    const effectFn = jest.fn();
    const cleanupFn = jest.fn();

    const { unmount } = renderHook(() =>
      useEffect(() => {
        effectFn(counter.value);
        return cleanupFn;
      })
    );

    expect(effectFn).toBeCalledTimes(1);
    expect(cleanupFn).toBeCalledTimes(0);

    act(() => {
      counter.value++;
    });

    expect(effectFn).toBeCalledTimes(2);
    expect(cleanupFn).toBeCalledTimes(1);

    unmount();

    expect(effectFn).toBeCalledTimes(2);
    expect(cleanupFn).toBeCalledTimes(2);
  });
  it('cleans up without effect scope (Dev Mode)', () => {
    // enable React development mode
    getFiberInDev.mockRestore();

    const counter = ref(1);
    const effectFn = jest.fn();
    const cleanupFn = jest.fn();

    const { unmount } = renderHook(() =>
      useEffect(() => {
        effectFn(counter.value);
        return cleanupFn;
      })
    );

    expect(effectFn).toBeCalledTimes(1);
    expect(cleanupFn).toBeCalledTimes(0);

    act(() => {
      counter.value++;
    });

    expect(effectFn).toBeCalledTimes(2);
    expect(cleanupFn).toBeCalledTimes(1);

    unmount();

    expect(effectFn).toBeCalledTimes(2);
    expect(cleanupFn).toBeCalledTimes(2);
  });
  it('cleans up without effect scope (Strict Mode)', () => {
    // enable React development mode
    getFiberInDev.mockRestore();

    const counter = ref(1);
    const effectFn = jest.fn();
    const cleanupFn = jest.fn();

    const { unmount } = renderHook(
      () =>
        useEffect(() => {
          effectFn(counter.value);
          return cleanupFn;
        }),
      {
        wrapper: ({ children }) => (
          <React.StrictMode>{children}</React.StrictMode>
        ),
      }
    );

    expect(effectFn).toBeCalledTimes(2);
    expect(cleanupFn).toBeCalledTimes(1);

    act(() => {
      counter.value++;
    });

    expect(effectFn).toBeCalledTimes(3);
    expect(cleanupFn).toBeCalledTimes(2);

    unmount();

    expect(effectFn).toBeCalledTimes(3);
    expect(cleanupFn).toBeCalledTimes(3);
  });
  it('rejects lazy option', () => {
    const counter = ref(1);
    const effectFn = jest.fn();

    const { unmount } = renderHook(() =>
      useEffect(
        () => {
          effectFn(counter.value);
        },
        // @ts-expect-error - lazy is not a valid option
        // eslint-disable-next-line react-hooks/exhaustive-deps
        { lazy: true }
      )
    );

    expect(effectFn).toBeCalledTimes(1);

    act(() => {
      counter.value++;
    });

    expect(effectFn).toBeCalledTimes(2);

    unmount();
    act(() => {
      counter.value++;
    });

    expect(effectFn).toBeCalledTimes(2);

    // should warn about the lazy option
    expect(consoleWarn).toBeCalled();
  });
});

describe('watch', () => {
  it('is reactive with ref', () => {
    const counter = ref(1);
    const effectFn = jest.fn();

    const runner = watch(counter, (...args) => {
      effectFn(...args);
    });

    expect(effectFn).toBeCalledTimes(0);

    counter.value++;

    expect(effectFn).toBeCalledTimes(1);
    expect(effectFn).toBeCalledWith(2, 1);

    runner();
    counter.value++;

    expect(effectFn).toBeCalledTimes(1);
  });
  it('is reactive with reactive object', () => {
    const obj = reactive({ a: 1, nested: { b: 2 } });
    const effectFn = jest.fn();

    const runner = watch(obj, (...args) => {
      effectFn(...args);
    });

    expect(effectFn).toBeCalledTimes(0);

    obj.nested.b++;

    expect(effectFn).toBeCalledTimes(1);
    expect(effectFn).toBeCalledWith(obj, obj);

    runner();
    obj.nested.b++;

    expect(effectFn).toBeCalledTimes(1);
  });
  it('is reactive with compound getter function', () => {
    const counter = ref(1);
    const obj = reactive({ a: 1, nested: { b: 2 } });
    const effectFn = jest.fn();

    const runner = watch(
      () => counter.value + obj.nested.b,
      (...args) => {
        effectFn(...args);
      }
    );

    expect(effectFn).toBeCalledTimes(0);

    obj.nested.b++;

    expect(effectFn).toBeCalledTimes(1);
    expect(effectFn).toBeCalledWith(4, 3);

    counter.value++;

    expect(effectFn).toBeCalledTimes(2);
    expect(effectFn).toBeCalledWith(5, 4);

    runner();
    obj.nested.b++;

    expect(effectFn).toBeCalledTimes(2);
  });
  it('is reactive with array of sources', () => {
    const counter = ref(1);
    const obj = reactive({ a: 1, nested: { b: 2 } });
    const obj2 = reactive({ a: 1, nested: { b: 2 } });
    const effectFn = jest.fn();

    const runner = watch([counter, obj, () => obj2.a], (...args) => {
      effectFn(...args);
    });

    expect(effectFn).toBeCalledTimes(0);

    counter.value++;

    expect(effectFn).toBeCalledTimes(1);
    expect(effectFn).toBeCalledWith([2, obj, 1], [1, obj, 1]);

    obj.nested.b++;

    expect(effectFn).toBeCalledTimes(2);
    expect(effectFn).toBeCalledWith([2, obj, 1], [2, obj, 1]);

    obj2.a++;

    expect(effectFn).toBeCalledTimes(3);
    expect(effectFn).toBeCalledWith([2, obj, 2], [2, obj, 1]);

    runner();
    obj.nested.b++;

    expect(effectFn).toBeCalledTimes(3);
  });
  it('calls onStop function', () => {
    const counter = ref(1);
    const effectFn = jest.fn();
    const cleanupFn = jest.fn();
    const stopFn = jest.fn();

    const runner = watch(
      counter,
      () => {
        effectFn(counter.value);
        return cleanupFn;
      },
      { onStop: stopFn, immediate: true }
    );

    expect(stopFn).toBeCalledTimes(0);
    expect(cleanupFn).toBeCalledTimes(0);

    runner();

    expect(stopFn).toBeCalledTimes(1);
    expect(cleanupFn).toBeCalledTimes(1);
  });
  it('cleans up properly', () => {
    const counter = ref(1);
    const effectFn = jest.fn();
    const cleanupFn = jest.fn();

    const runner = watch(counter, () => {
      effectFn(counter.value);
      return cleanupFn;
    });

    expect(effectFn).toBeCalledTimes(0);
    expect(cleanupFn).toBeCalledTimes(0);

    counter.value++;

    expect(effectFn).toBeCalledTimes(1);
    expect(cleanupFn).toBeCalledTimes(0);

    counter.value++;

    expect(effectFn).toBeCalledTimes(2);
    expect(cleanupFn).toBeCalledTimes(1);

    runner();

    expect(effectFn).toBeCalledTimes(2);
    expect(cleanupFn).toBeCalledTimes(2);
  });
  it('maintains correct cleanup function instance', () => {
    const counter = ref(-1);
    const effectPairs = [
      { effect: jest.fn(), cleanup: jest.fn() },
      { effect: jest.fn(), cleanup: jest.fn() },
    ];

    const runner = watch(counter, () => {
      effectPairs[counter.value].effect();
      return effectPairs[counter.value].cleanup;
    });

    counter.value++;

    expect(effectPairs[0].effect).toBeCalledTimes(1);
    expect(effectPairs[0].cleanup).toBeCalledTimes(0);
    expect(effectPairs[1].effect).toBeCalledTimes(0);
    expect(effectPairs[1].cleanup).toBeCalledTimes(0);

    counter.value++;

    expect(effectPairs[0].effect).toBeCalledTimes(1);
    expect(effectPairs[0].cleanup).toBeCalledTimes(1);
    expect(effectPairs[1].effect).toBeCalledTimes(1);
    expect(effectPairs[1].cleanup).toBeCalledTimes(0);

    runner();

    expect(effectPairs[0].effect).toBeCalledTimes(1);
    expect(effectPairs[0].cleanup).toBeCalledTimes(1);
    expect(effectPairs[1].effect).toBeCalledTimes(1);
    expect(effectPairs[1].cleanup).toBeCalledTimes(1);
  });
  it('works with immediate option', () => {
    const counter = ref(1);
    const effectFn = jest.fn();

    const runner = watch(
      counter,
      (...args) => {
        effectFn(...args);
      },
      { immediate: true }
    );

    expect(effectFn).toBeCalledTimes(1);
    expect(effectFn).toBeCalledWith(1, undefined);

    counter.value++;

    expect(effectFn).toBeCalledTimes(2);
    expect(effectFn).toBeCalledWith(2, 1);

    runner();
    counter.value++;

    expect(effectFn).toBeCalledTimes(2);
  });
  it('works with deep option (deep: false)', () => {
    const obj = reactive({ nested: { a: 1 } });
    const effectFn = jest.fn();

    const runner = watch(
      () => obj,
      (...args) => {
        effectFn(...args);
      }
    );

    expect(effectFn).toBeCalledTimes(0);

    obj.nested.a++;

    expect(effectFn).toBeCalledTimes(0);

    runner();
    obj.nested.a++;

    expect(effectFn).toBeCalledTimes(0);
  });
  it('works with deep option (deep: true)', () => {
    const obj = reactive({ nested: { a: 1 } });
    const effectFn = jest.fn();

    const runner = watch(
      () => obj,
      (...args) => {
        effectFn(...args);
      },
      { deep: true }
    );

    expect(effectFn).toBeCalledTimes(0);

    obj.nested.a++;

    expect(effectFn).toBeCalledTimes(1);
    expect(effectFn).toBeCalledWith(obj, obj);

    runner();
    obj.nested.a++;

    expect(effectFn).toBeCalledTimes(1);
  });
  it('warns about invalid source', () => {
    const obj = { nested: { a: 1 } };
    const effectFn = jest.fn();

    const runner = watch(obj, (...args) => {
      effectFn(...args);
    });

    expect(effectFn).toBeCalledTimes(0);

    obj.nested.a++;

    expect(effectFn).toBeCalledTimes(0);

    runner();
    obj.nested.a++;

    expect(effectFn).toBeCalledTimes(0);

    expect(consoleWarn).toBeCalled();
  });
  it('warns about invalid source in array', () => {
    const counter = ref(1);
    const obj = { a: 1, nested: { b: 2 } };
    const obj2 = reactive({ a: 1, nested: { b: 2 } });
    const effectFn = jest.fn();

    const runner = watch([counter, obj, () => obj2.a], (...args) => {
      effectFn(...args);
    });

    expect(effectFn).toBeCalledTimes(0);

    counter.value++;

    expect(effectFn).toBeCalledTimes(1);
    expect(effectFn).toBeCalledWith([2, obj, 1], [1, obj, 1]);

    obj.nested.b++;

    expect(effectFn).toBeCalledTimes(1);

    obj2.a++;

    expect(effectFn).toBeCalledTimes(2);
    expect(effectFn).toBeCalledWith([2, obj, 2], [2, obj, 1]);

    runner();
    obj.nested.b++;

    expect(effectFn).toBeCalledTimes(2);

    expect(consoleWarn).toBeCalled();
  });
  it('traverses complex object', () => {
    const obj = reactive({
      a: 1,
      nested: { b: 2 },
      nested2: { b: 2 },
      r: ref(2),
      values: [{ a: 1 }, { a: 2 }, ref(5)],
      set: new Set([{ a: 1 }, { a: 2 }]),
      map: new Map([
        ['a', 1],
        ['b', 2],
      ]),
    });
    obj.nested2 = obj.nested;

    const effectFn = jest.fn();

    const runner = watch(obj, (...args) => {
      effectFn(...args);
    });

    expect(effectFn).toBeCalledTimes(0);

    obj.nested.b++;

    expect(effectFn).toBeCalledTimes(1);
    expect(effectFn).toBeCalledWith(obj, obj);

    runner();
    obj.nested.b++;

    expect(effectFn).toBeCalledTimes(1);
  });
});

describe('useWatch', () => {
  it('is reactive', () => {
    const counter = ref(1);
    const effectFn = jest.fn();

    const { unmount } = renderHook(() =>
      useWatch(counter, (...args) => {
        effectFn(...args);
      })
    );

    expect(effectFn).toBeCalledTimes(0);

    act(() => {
      counter.value++;
    });

    expect(effectFn).toBeCalledTimes(1);

    unmount();
    act(() => {
      counter.value++;
    });

    expect(effectFn).toBeCalledTimes(1);
  });
  it('keeps the same instance across re-render', () => {
    const counter = ref(1);
    const effectFn = jest.fn();

    const { rerender, unmount } = renderHook(() =>
      useWatch(
        counter,
        (...args) => {
          effectFn(...args);
        },
        { immediate: true }
      )
    );

    expect(effectFn).toBeCalledTimes(1);

    rerender();

    expect(effectFn).toBeCalledTimes(1);

    unmount();
    act(() => {
      counter.value++;
    });

    expect(effectFn).toBeCalledTimes(1);
  });
  it('cleans up without effect scope', () => {
    const counter = ref(1);
    const effectFn = jest.fn();
    const cleanupFn = jest.fn();

    const { unmount } = renderHook(() =>
      useWatch(
        counter,
        (...args) => {
          effectFn(...args);
          return cleanupFn;
        },
        { immediate: true }
      )
    );

    expect(effectFn).toBeCalledTimes(1);
    expect(cleanupFn).toBeCalledTimes(0);

    act(() => {
      counter.value++;
    });

    expect(effectFn).toBeCalledTimes(2);
    expect(cleanupFn).toBeCalledTimes(1);

    unmount();

    expect(effectFn).toBeCalledTimes(2);
    expect(cleanupFn).toBeCalledTimes(2);
  });
  it('cleans up without effect scope (Dev Mode)', () => {
    // enable React development mode
    getFiberInDev.mockRestore();

    const counter = ref(1);
    const effectFn = jest.fn();
    const cleanupFn = jest.fn();

    const { unmount } = renderHook(() =>
      useWatch(
        counter,
        (...args) => {
          effectFn(...args);
          return cleanupFn;
        },
        { immediate: true }
      )
    );

    expect(effectFn).toBeCalledTimes(1);
    expect(cleanupFn).toBeCalledTimes(0);

    act(() => {
      counter.value++;
    });

    expect(effectFn).toBeCalledTimes(2);
    expect(cleanupFn).toBeCalledTimes(1);

    unmount();

    expect(effectFn).toBeCalledTimes(2);
    expect(cleanupFn).toBeCalledTimes(2);
  });
  it('cleans up without effect scope (Strict Mode)', () => {
    // enable React development mode
    getFiberInDev.mockRestore();

    const counter = ref(1);
    const effectFn = jest.fn();
    const cleanupFn = jest.fn();

    const { unmount } = renderHook(
      () =>
        useWatch(
          counter,
          (...args) => {
            effectFn(...args);
            return cleanupFn;
          },
          { immediate: true }
        ),
      {
        wrapper: ({ children }) => (
          <React.StrictMode>{children}</React.StrictMode>
        ),
      }
    );

    expect(effectFn).toBeCalledTimes(2);
    expect(cleanupFn).toBeCalledTimes(1);

    act(() => {
      counter.value++;
    });

    expect(effectFn).toBeCalledTimes(3);
    expect(cleanupFn).toBeCalledTimes(2);

    unmount();

    expect(effectFn).toBeCalledTimes(3);
    expect(cleanupFn).toBeCalledTimes(3);
  });
  it('is reactive', () => {
    const counter = ref(1);
    const effectFn = jest.fn();

    const { unmount } = renderHook(() =>
      useWatch(
        counter,
        (...args) => {
          effectFn(...args);
        },
        // @ts-expect-error - lazy is not a valid option
        { lazy: true }
      )
    );

    expect(effectFn).toBeCalledTimes(0);

    act(() => {
      counter.value++;
    });

    expect(effectFn).toBeCalledTimes(1);

    unmount();
    act(() => {
      counter.value++;
    });

    expect(effectFn).toBeCalledTimes(1);

    expect(consoleWarn).toBeCalled();
  });
});
