import React from 'react';
import { act, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { makeReactive, ref } from '..';
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
  it('react to ref changes', async () => {
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
});
