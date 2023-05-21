import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { makeReactive } from '..';

const TestComponent = makeReactive(function TestComponent() {
  return <p>Test component</p>;
});

describe('Reactive component', () => {
  it('renders without crashing', async () => {
    const { findByText } = render(<TestComponent />);
    const content = await findByText('Test component');
    expect(content).toBeTruthy();
  });
});
