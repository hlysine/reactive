import '@testing-library/jest-dom';
import { isRef, useShallowRef } from '..';
import 'jest-performance-testing';
import { renderHook } from '@testing-library/react';
import { isShallow } from '@vue/reactivity';

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
