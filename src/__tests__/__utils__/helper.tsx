import React from 'react';
import {
  Queries,
  RenderHookOptions,
  RenderHookResult,
  render,
} from '@testing-library/react';
import { queries } from '@testing-library/dom';

export function renderReactiveHook<
  Result,
  Props,
  Q extends Queries = typeof queries,
  Container extends Element | DocumentFragment = HTMLElement,
  BaseElement extends Element | DocumentFragment = Container
>(
  renderCallback: (initialProps: Props) => Result,
  options: RenderHookOptions<Props, Q, Container, BaseElement> = {}
): RenderHookResult<Result, Props> {
  const { initialProps, ...renderOptions } = options;
  const result = React.createRef<Result>() as {
    current: Result;
  };

  function TestComponent({
    renderCallbackProps,
  }: {
    renderCallbackProps: Props;
  }) {
    const pendingResult = renderCallback(renderCallbackProps);

    React.useEffect(() => {
      result.current = pendingResult;
    });

    return null;
  }

  const { rerender: baseRerender, unmount } = render(
    <TestComponent renderCallbackProps={initialProps!} />,
    renderOptions
  );

  function rerender(rerenderCallbackProps) {
    return baseRerender(
      <TestComponent renderCallbackProps={rerenderCallbackProps} />
    );
  }

  return { result, rerender, unmount };
}
