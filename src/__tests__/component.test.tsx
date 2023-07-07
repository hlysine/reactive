import React, { useState } from 'react';
import { act, render, renderHook } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  isReactive,
  isReadonly,
  isShallow,
  makeReactive,
  makeReactiveHook,
  reactive,
  ref,
  useComputed,
  useReactive,
  useReactiveRerender,
  useReference,
  useWatch,
  useWatchEffect,
} from '..';
import { perf, wait } from 'react-performance-testing';
import 'jest-performance-testing';
import * as helper from '../helper';

let getFiberInDev: jest.SpyInstance;

beforeEach(() => {
  // mock getFiberInDev to simulate React production mode
  getFiberInDev = jest.spyOn(helper, 'getFiberInDev').mockReturnValue(null);
});

afterEach(() => {
  jest.resetAllMocks();
  jest.restoreAllMocks();
});

describe('useReactiveRerender', () => {
  it('returns a valid object', () => {
    const { result } = renderHook(() =>
      useReactiveRerender({ a: 1, b: 'abc' })
    );
    expect(result.current.a).toBe(1);
    expect(isReactive(result.current)).toBe(true);
    expect(isReadonly(result.current)).toBe(true);
    expect(isShallow(result.current)).toBe(true);
  });
  it('keeps the same instance across re-render', () => {
    const { result, rerender } = renderHook((obj: any = { a: 1, b: 'abc' }) =>
      useReactiveRerender(obj)
    );
    const ref = result.current;

    rerender();

    expect(result.current).toBe(ref);
    expect(result.current.a).toBe(1);

    rerender({ a: 2, b: 'def' });

    expect(result.current).toBe(ref);
    expect(result.current.a).toBe(2);
  });
  it('triggers reactive effects', async () => {
    const mockEffect = jest.fn();
    const Tester = function Tester(props: { a: number }) {
      props = useReactiveRerender(props);
      useWatchEffect(() => {
        mockEffect(props.a);
      });
      return <p>{props.a}</p>;
    };
    const { findByText, rerender } = render(<Tester a={1} />);
    const content = await findByText('1');
    expect(content).toBeTruthy();
    expect(mockEffect).toBeCalledTimes(1);

    rerender(<Tester a={2} />);

    expect(mockEffect).toBeCalledTimes(2);
    expect(mockEffect).toBeCalledWith(2);
  });
});

describe('makeReactive', () => {
  it('renders without crashing', async () => {
    const Tester = makeReactive(function Tester() {
      return <p>Test component</p>;
    });

    const { findByText } = render(<Tester />);
    const content = await findByText('Test component');
    expect(content).toBeTruthy();
  });
  it('renders custom hooks without crashing', async () => {
    const count = ref(0);
    const useCount = makeReactiveHook(function useCount() {
      return count.value;
    });
    const Tester = function Tester() {
      const count = useCount();
      return <p>{count}</p>;
    };

    const { renderCount } = perf(React);

    const { findByText, unmount } = render(<Tester />);
    const content1 = await findByText('0');
    expect(content1).toBeTruthy();
    expect(renderCount.current.Tester).toBeRenderedTimes(1);

    act(() => {
      count.value++;
    });

    const content2 = await findByText('1');
    expect(content2).toBeTruthy();
    expect(renderCount.current.Tester).toBeRenderedTimes(2);

    unmount();
    act(() => {
      count.value++;
    });

    expect(renderCount.current.Tester).toBeRenderedTimes(2);
  });
  it('renders custom hooks without crashing (Strict Mode)', async () => {
    // use orginal return value to restore React development mode
    getFiberInDev.mockRestore();

    const renderedHook = jest.fn();

    const count = ref(0);
    const useCount = makeReactiveHook(function useCount() {
      renderedHook();
      return count.value;
    });
    const Tester = function Tester() {
      const count = useCount();
      return <p>{count}</p>;
    };

    const { findByText, unmount } = render(
      <React.StrictMode>
        <Tester />
      </React.StrictMode>
    );
    const content1 = await findByText('0');
    expect(content1).toBeTruthy();
    expect(renderedHook).toBeCalledTimes(4);

    act(() => {
      count.value++;
    });

    const content2 = await findByText('1');
    expect(content2).toBeTruthy();
    expect(renderedHook).toBeCalledTimes(6);

    unmount();
    act(() => {
      count.value++;
    });

    expect(renderedHook).toBeCalledTimes(6);
  });
  it('renders custom hooks in reactive component without crashing', async () => {
    const count = ref(0);
    const useCount = makeReactiveHook(function useCount() {
      return count.value;
    });
    const Tester = makeReactive(function Tester() {
      const count = useCount();
      return <p>{count}</p>;
    });

    const { renderCount } = perf(React);

    const { findByText, unmount } = render(<Tester />);
    const content1 = await findByText('0');
    expect(content1).toBeTruthy();
    expect(renderCount.current.Tester).toBeRenderedTimes(1);

    act(() => {
      count.value++;
    });

    const content2 = await findByText('1');
    expect(content2).toBeTruthy();
    expect(renderCount.current.Tester).toBeRenderedTimes(2);

    unmount();
    act(() => {
      count.value++;
    });

    expect(renderCount.current.Tester).toBeRenderedTimes(2);
  });
  it('accepts props', async () => {
    const Tester = makeReactive(function Tester(props: {
      value: string;
      onChange: () => void;
      obj: { a: number; b: number };
    }) {
      expect(isReactive(props)).toBe(true);
      expect(isReadonly(props)).toBe(true);
      expect(isReactive(props.obj)).toBe(false);
      expect(isReadonly(props.obj)).toBe(false);
      return (
        <>
          <p>{props.value}</p>
          <input onChange={props.onChange} value={props.value} />
        </>
      );
    });

    const { findByText } = render(
      <Tester value="Test component" onChange={() => {}} obj={{ a: 1, b: 2 }} />
    );
    const content = await findByText('Test component');
    expect(content).toBeTruthy();
  });
  it('accepts args in hook version', async () => {
    const useCount = makeReactiveHook(function useCount(count: number) {
      return count;
    });
    const { result, rerender } = renderHook(useCount, { initialProps: 0 });

    expect(result.current).toBe(0);

    rerender(1);

    expect(result.current).toBe(1);
  });
  it('updates props', async () => {
    const mockEffect = jest.fn();
    const Tester = makeReactive(function Tester(props: { value?: string }) {
      useWatchEffect(() => {
        mockEffect(props.value);
      });
      return <p>{props.value}</p>;
    });

    const { findByText, rerender } = render(<Tester value="Test component" />);
    const content = await findByText('Test component');
    expect(content).toBeTruthy();
    expect(mockEffect).toHaveBeenCalledTimes(1);

    rerender(<Tester value="Test component 2" />);
    const content2 = await findByText('Test component 2');
    expect(content2).toBeTruthy();
    expect(mockEffect).toHaveBeenCalledTimes(2);

    rerender(<Tester value="Test component 2" />);
    const content3 = await findByText('Test component 2');
    expect(content3).toBeTruthy();
    expect(mockEffect).toHaveBeenCalledTimes(2);

    rerender(<Tester />);
    await expect(
      async () => await findByText('Test component 2')
    ).rejects.toThrow();
    expect(mockEffect).toHaveBeenCalledTimes(3);
  });
  it('re-renders when ref changes', async () => {
    const count = ref(0);
    const Tester = makeReactive(function Tester() {
      return <p>{count.value}</p>;
    });

    const { renderCount } = perf(React);

    const { findByText } = render(<Tester />);

    // count should first be 0
    const content = await findByText('0');
    expect(content).toBeTruthy();

    act(() => {
      count.value++;
    });

    await wait(async () => {
      // should re-render with updated value
      expect(renderCount.current.Tester).toBeRenderedTimes(2);
      const content = await findByText('1');
      expect(content).toBeTruthy();
    });
  });
  it('batches state updates', async () => {
    const obj = reactive({ a: 1, b: 2 });
    const Tester = makeReactive(function Tester() {
      return (
        <p data-testid="obj">
          a: {obj.a}, b: {obj.b}
        </p>
      );
    });

    const { renderCount } = perf(React);

    const { findByTestId } = render(<Tester />);

    const content = await findByTestId('obj');
    expect(content.innerHTML).toContain('a: 1, b: 2');

    act(() => {
      obj.a++;
      obj.b++;
    });

    await wait(async () => {
      // should re-render with updated value
      expect(renderCount.current.Tester).toBeRenderedTimes(2);
      const content = await findByTestId('obj');
      expect(content.innerHTML).toContain('a: 2, b: 3');
    });
  });
  it('does not re-render when unrelated state changes', async () => {
    const obj = reactive({ a: 1, b: 2 });
    const Tester = makeReactive(function Tester() {
      return <p>{obj.a}</p>;
    });

    const { renderCount } = perf(React);

    const { findByText } = render(<Tester />);

    const content = await findByText('1');
    expect(content).toBeTruthy();

    act(() => {
      obj.b++;
    });

    await wait(async () => {
      // should not re-render
      expect(renderCount.current.Tester).toBeRenderedTimes(1);
      const content = await findByText('1');
      expect(content).toBeTruthy();
    });
  });
  it('does not re-render when state changes in initializer', async () => {
    const count = ref(0);
    const mockInitializer = jest.fn(() => ({ a: count.value, b: 2 }));

    const Tester = makeReactive(function Tester() {
      const obj = useReactive(mockInitializer);
      return <p>{obj.a}</p>;
    });

    const { renderCount } = perf(React);

    const { findByText } = render(<Tester />);

    expect(mockInitializer).toBeCalledTimes(1);
    const content = await findByText('0');
    expect(content).toBeTruthy();

    act(() => {
      count.value++;
    });

    await wait(async () => {
      // should not re-render, but should trigger effect again
      expect(renderCount.current.Tester).toBeRenderedTimes(1);
      expect(mockInitializer).toBeCalledTimes(1);
      const content = await findByText('0');
      expect(content).toBeTruthy();
    });
  });
  it('does not re-render when state changes in nested watcher', async () => {
    const obj = reactive({ a: 1, b: 2 });
    const mockEffect = jest.fn();

    const Tester = makeReactive(function Tester() {
      useWatchEffect(() => {
        mockEffect(obj.b);
      });
      return <p>{obj.a}</p>;
    });

    const { renderCount } = perf(React);

    const { findByText } = render(<Tester />);

    expect(mockEffect).toBeCalledTimes(1);
    const content = await findByText('1');
    expect(content).toBeTruthy();

    act(() => {
      obj.b++;
    });

    await wait(async () => {
      // should not re-render, but should trigger effect again
      expect(renderCount.current.Tester).toBeRenderedTimes(1);
      expect(mockEffect).toBeCalledTimes(2);
      const content = await findByText('1');
      expect(content).toBeTruthy();
    });
  });
  it('transfers component attributes correctly', () => {
    const propTypes = {};
    const contextTypes = {};
    const defaultProps = {};
    const displayName = 'DisplayTester';
    function Tester() {
      return <p>Test component</p>;
    }
    Tester.propTypes = propTypes;
    Tester.contextTypes = contextTypes;
    Tester.defaultProps = defaultProps;
    Tester.displayName = displayName;

    const converted = makeReactive(Tester);

    expect(converted.propTypes).toBe(propTypes);
    expect(converted.contextTypes).toBe(contextTypes);
    expect(converted.defaultProps).toBe(defaultProps);
    expect(converted.displayName).toBe(displayName);
    expect(converted.name).toBe(Tester.name);
  });
  it('stops reactive effects on unmount', async () => {
    const count = ref(0);

    const mockEffect = jest.fn();
    const mockCleanup = jest.fn();
    const mockEffect2 = jest.fn();
    const mockCleanup2 = jest.fn();
    const mockGetter = jest.fn(() => count.value + 1);
    const Tester = makeReactive(function Tester() {
      useWatchEffect(() => {
        mockEffect(count.value);
        return mockCleanup;
      });
      useWatch(
        count,
        (...args) => {
          mockEffect2(...args);
          return mockCleanup2;
        },
        { immediate: true }
      );
      const derived = useComputed(mockGetter);
      return <p>{derived.value}</p>;
    });

    const { unmount, findByText } = render(<Tester />);

    expect(mockEffect).toBeCalledTimes(1);
    expect(mockCleanup).toBeCalledTimes(0);
    expect(mockEffect2).toBeCalledTimes(1);
    expect(mockCleanup2).toBeCalledTimes(0);
    expect(mockGetter).toBeCalledTimes(1);
    const content1 = await findByText('1');
    expect(content1).toBeTruthy();

    act(() => {
      count.value++;
    });

    expect(mockEffect).toBeCalledTimes(2);
    expect(mockCleanup).toBeCalledTimes(1);
    expect(mockEffect2).toBeCalledTimes(2);
    expect(mockCleanup2).toBeCalledTimes(1);
    expect(mockGetter).toBeCalledTimes(2);
    const content2 = await findByText('2');
    expect(content2).toBeTruthy();

    unmount();

    expect(mockEffect).toBeCalledTimes(2);
    expect(mockCleanup).toBeCalledTimes(2);
    expect(mockEffect2).toBeCalledTimes(2);
    expect(mockCleanup2).toBeCalledTimes(2);
    expect(mockGetter).toBeCalledTimes(2);

    act(() => {
      count.value++;
    });

    expect(mockEffect).toBeCalledTimes(2);
    expect(mockCleanup).toBeCalledTimes(2);
    expect(mockEffect2).toBeCalledTimes(2);
    expect(mockCleanup2).toBeCalledTimes(2);
    expect(mockGetter).toBeCalledTimes(2);
  });
  it('stops reactive effects on unmount (Dev Mode)', async () => {
    // use orginal return value to restore React development mode
    getFiberInDev.mockRestore();
    const count = ref(0);

    const mockEffect = jest.fn();
    const mockCleanup = jest.fn();
    const mockEffect2 = jest.fn();
    const mockCleanup2 = jest.fn();
    const mockGetter = jest.fn(() => count.value + 1);
    const Tester = makeReactive(function Tester() {
      useWatchEffect(() => {
        mockEffect(count.value);
        return mockCleanup;
      });
      useWatch(
        count,
        (...args) => {
          mockEffect2(...args);
          return mockCleanup2;
        },
        { immediate: true }
      );
      const derived = useComputed(mockGetter);
      return <p>{derived.value}</p>;
    });

    const { unmount, findByText } = render(<Tester />);

    expect(mockEffect).toBeCalledTimes(1);
    expect(mockCleanup).toBeCalledTimes(0);
    expect(mockEffect2).toBeCalledTimes(1);
    expect(mockCleanup2).toBeCalledTimes(0);
    expect(mockGetter).toBeCalledTimes(2);
    expect(await findByText('1')).toBeTruthy();

    act(() => {
      count.value++;
    });

    expect(mockEffect).toBeCalledTimes(2);
    expect(mockCleanup).toBeCalledTimes(1);
    expect(mockEffect2).toBeCalledTimes(2);
    expect(mockCleanup2).toBeCalledTimes(1);
    expect(mockGetter).toBeCalledTimes(3);
    expect(await findByText('2')).toBeTruthy();

    unmount();

    expect(mockEffect).toBeCalledTimes(2);
    expect(mockCleanup).toBeCalledTimes(2);
    expect(mockEffect2).toBeCalledTimes(2);
    expect(mockCleanup2).toBeCalledTimes(2);
    expect(mockGetter).toBeCalledTimes(3);

    act(() => {
      count.value++;
    });

    expect(mockEffect).toBeCalledTimes(2);
    expect(mockCleanup).toBeCalledTimes(2);
    expect(mockEffect2).toBeCalledTimes(2);
    expect(mockCleanup2).toBeCalledTimes(2);
    expect(mockGetter).toBeCalledTimes(3);
  });
  it('stops reactive effects on unmount (Strict Mode)', async () => {
    // use orginal return value to restore React development mode
    getFiberInDev.mockRestore();
    const count = ref(0);

    const mockEffect = jest.fn();
    const mockCleanup = jest.fn();
    const mockEffect2 = jest.fn();
    const mockCleanup2 = jest.fn();
    const mockGetter = jest.fn(() => count.value + 1);
    const Tester = makeReactive(function Tester() {
      useWatchEffect(() => {
        mockEffect(count.value);
        return mockCleanup;
      });
      useWatch(
        count,
        (...args) => {
          mockEffect2(...args);
          return mockCleanup2;
        },
        { immediate: true }
      );
      const derived = useComputed(mockGetter);
      return <p>{derived.value}</p>;
    });

    const { unmount, findByText } = render(
      <React.StrictMode>
        <Tester />
      </React.StrictMode>
    );

    expect(mockEffect).toBeCalledTimes(2);
    expect(mockCleanup).toBeCalledTimes(1);
    expect(mockEffect2).toBeCalledTimes(2);
    expect(mockCleanup2).toBeCalledTimes(1);
    expect(mockGetter).toBeCalledTimes(4);
    const content1 = await findByText('1');
    expect(content1).toBeTruthy();

    act(() => {
      count.value++;
    });

    expect(mockEffect).toBeCalledTimes(3);
    expect(mockCleanup).toBeCalledTimes(2);
    expect(mockEffect2).toBeCalledTimes(3);
    expect(mockCleanup2).toBeCalledTimes(2);
    expect(mockGetter).toBeCalledTimes(5);
    const content2 = await findByText('2');
    expect(content2).toBeTruthy();

    unmount();

    expect(mockEffect).toBeCalledTimes(3);
    expect(mockCleanup).toBeCalledTimes(3);
    expect(mockEffect2).toBeCalledTimes(3);
    expect(mockCleanup2).toBeCalledTimes(3);
    expect(mockGetter).toBeCalledTimes(5);

    act(() => {
      count.value++;
    });

    expect(mockEffect).toBeCalledTimes(3);
    expect(mockCleanup).toBeCalledTimes(3);
    expect(mockEffect2).toBeCalledTimes(3);
    expect(mockCleanup2).toBeCalledTimes(3);
    expect(mockGetter).toBeCalledTimes(5);
  });
  it('does not trigger infinite re-renders', async () => {
    // use orginal return value to restore React development mode
    getFiberInDev.mockRestore();

    const Tester = makeReactive(function Tester() {
      const [, setTick] = useState(0);
      const count = useReference(0);
      useWatchEffect(() => {
        setTick((t) => t + 1);
      });
      useWatch(
        count,
        () => {
          setTick((t) => t + 1);
        },
        { immediate: true }
      );
      return <p>{count.value}</p>;
    });

    const { findByText } = render(
      <React.StrictMode>
        <Tester />
      </React.StrictMode>
    );

    const content = await findByText('0');
    expect(content).toBeTruthy();
  });
});
