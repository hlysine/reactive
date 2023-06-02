import React from 'react';
import { act, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  makeReactive,
  reactive,
  ref,
  useComputed,
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

describe('makeReactive', () => {
  it('renders without crashing', async () => {
    const Tester = makeReactive(function Tester() {
      return <p>Test component</p>;
    });

    const { findByText } = render(<Tester />);
    const content = await findByText('Test component');
    expect(content).toBeTruthy();
  });
  it('accepts props', async () => {
    const Tester = makeReactive(function Tester({
      value,
      onChange,
    }: {
      value: string;
      onChange: () => void;
    }) {
      return (
        <>
          <p>{value}</p>
          <input onChange={onChange} value={value} />
        </>
      );
    });

    const { findByText } = render(
      <Tester value="Test component" onChange={() => {}} />
    );
    const content = await findByText('Test component');
    expect(content).toBeTruthy();
  });
  it('updates props', async () => {
    const Tester = makeReactive(function Tester({ value }: { value: string }) {
      return <p>{value}</p>;
    });

    const { findByText, rerender } = render(<Tester value="Test component" />);
    const content = await findByText('Test component');
    expect(content).toBeTruthy();

    rerender(<Tester value="Test component 2" />);
    const content2 = await findByText('Test component 2');
    expect(content2).toBeTruthy();
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
    const content1 = await findByText('1');
    expect(content1).toBeTruthy();

    act(() => {
      count.value++;
    });

    expect(mockEffect).toBeCalledTimes(2);
    expect(mockCleanup).toBeCalledTimes(1);
    expect(mockEffect2).toBeCalledTimes(2);
    expect(mockCleanup2).toBeCalledTimes(1);
    expect(mockGetter).toBeCalledTimes(3);
    const content2 = await findByText('2');
    expect(content2).toBeTruthy();

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
    expect(mockGetter).toBeCalledTimes(3);
    const content1 = await findByText('1');
    expect(content1).toBeTruthy();

    act(() => {
      count.value++;
    });

    expect(mockEffect).toBeCalledTimes(3);
    expect(mockCleanup).toBeCalledTimes(2);
    expect(mockEffect2).toBeCalledTimes(3);
    expect(mockCleanup2).toBeCalledTimes(2);
    expect(mockGetter).toBeCalledTimes(4);
    const content2 = await findByText('2');
    expect(content2).toBeTruthy();

    unmount();

    expect(mockEffect).toBeCalledTimes(3);
    expect(mockCleanup).toBeCalledTimes(3);
    expect(mockEffect2).toBeCalledTimes(3);
    expect(mockCleanup2).toBeCalledTimes(3);
    expect(mockGetter).toBeCalledTimes(4);

    act(() => {
      count.value++;
    });

    expect(mockEffect).toBeCalledTimes(3);
    expect(mockCleanup).toBeCalledTimes(3);
    expect(mockEffect2).toBeCalledTimes(3);
    expect(mockCleanup2).toBeCalledTimes(3);
    expect(mockGetter).toBeCalledTimes(4);
  });
});
