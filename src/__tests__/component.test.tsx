import React from 'react';
import { act, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { makeReactive, ref, useWatchEffect } from '..';
import { perf, wait } from 'react-performance-testing';
import 'jest-performance-testing';

describe('Reactive component', () => {
  it('renders without crashing', async () => {
    const Tester = makeReactive(function Tester() {
      return <p>Test component</p>;
    });

    const { findByText } = render(<Tester />);
    const content = await findByText('Test component');
    expect(content).toBeTruthy();
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
    const mockEffect = jest.fn();
    const mockCleanup = jest.fn();
    const count = ref(0);
    const Tester = makeReactive(function Tester() {
      useWatchEffect(() => {
        mockEffect(count.value);
        return mockCleanup;
      });
      return <p>{count.value}</p>;
    });

    const { unmount, findByText } = render(<Tester />);

    expect(mockEffect.mock.calls).toHaveLength(1);
    expect(mockCleanup.mock.calls).toHaveLength(0);
    const content1 = await findByText('0');
    expect(content1).toBeTruthy();

    act(() => {
      count.value++;
    });

    expect(mockEffect.mock.calls).toHaveLength(2);
    expect(mockCleanup.mock.calls).toHaveLength(1);
    const content2 = await findByText('1');
    expect(content2).toBeTruthy();

    unmount();

    expect(mockEffect.mock.calls).toHaveLength(2);
    expect(mockCleanup.mock.calls).toHaveLength(2);

    act(() => {
      count.value++;
    });

    expect(mockEffect.mock.calls).toHaveLength(2);
    expect(mockCleanup.mock.calls).toHaveLength(2);
  });
});
