import {
  EffectScope,
  effectScope,
  ReactiveEffectRunner,
  effect,
  shallowReadonly,
  shallowReactive,
} from '@vue/reactivity';
import { assignDiff, getFiberInDev } from './helper';
import {
  MutableRefObject,
  useDebugValue,
  useEffect,
  useRef,
  useState,
} from 'react';

function destroyReactivityRef(
  reactivityRef: MutableRefObject<ComponentReactivity | null>
) {
  if (reactivityRef.current !== null) {
    reactivityRef.current.scope.stop();
    reactivityRef.current = null;
  }
}

interface ReactiveRerenderRef<T> {
  reactive: T;
  readonly: T;
}

/**
 * Converts an object that changes on re-render to a reactive object that maintains the same instance across re-renders.
 * The converted object is **only shallowly reactive and is readonly**.
 *
 * This hook converts data in React's reactivity system to reactive data that is compatible with the rest of this
 * library. You should use other hooks to create reactive data from source if possible, but if not, you can use this
 * hook to convert the data. A typical use case is to pass values from `useState` hooks or React contexts into this
 * function so that reactive effects, such as `useWatchEffect`, can react to data changes from those hooks. You can also
 * use this hook to create reactive props if the component is not already wrapped with `makeReactive`.
 *
 * @example
 * Converting a value from `useState` to a reactive object. Note that a better solution is to replace `useState` with
 * hooks such as `useReactive` if possible. This example is for illustration purpose only.
 * ```js
 * // Inside a function component:
 * const [count, setCount] = useState(0);
 * const state = useReactiveRerender({ count });
 *
 * useWatchEffect(() => {
 *   console.log(state.count); // executes whenever count changes
 * });
 * ```
 *
 * @example
 * Creating reactive props. Components wrapped with `makeReactive` already have reactive props, so you don't need this
 * hook in those components.
 * ```jsx
 * function App(props) {
 *   props = useReactiveRerender(props);
 *   return <div>{props.count}</div>;
 * }
 * ```
 *
 * @param target The data to be made reactive.
 * @returns A reactive object that maintains the same instance across re-renders.
 */
export const useReactiveRerender = <T extends object>(target: T): T => {
  const reactiveRef = useRef<ReactiveRerenderRef<T> | null>(null);
  if (reactiveRef.current === null) {
    const reactive = shallowReactive({ ...target });
    reactiveRef.current = {
      reactive,
      readonly: shallowReadonly(reactive),
    };
  } else {
    assignDiff(reactiveRef.current.reactive, target);
  }
  useDebugValue(reactiveRef.current.reactive);
  return reactiveRef.current.readonly;
};

interface ComponentReactivity {
  scope: EffectScope;
  effect: ReactiveEffectRunner;
  props: any;
  ctx: any;
  destroyAfterUse: boolean;
  /**
   * Reactive re-renders are paused when props are updating
   */
  updatingProps: boolean;
}

function useReactivityInternals<P extends {}>(
  component: React.FC<P>,
  props: P
): MutableRefObject<ComponentReactivity | null>;
function useReactivityInternals<T extends unknown[]>(
  hook: (...args: T) => any,
  args: T
): MutableRefObject<ComponentReactivity | null>;
function useReactivityInternals<P extends {}>(
  func: React.FC<P>,
  propsOrArgs: P
) {
  const reactivityRef = useRef<ComponentReactivity | null>(null);

  let reactiveProps: P;
  if (Array.isArray(propsOrArgs)) {
    // if propsOrArgs is an array, it comes from a hook function, which should not have reactive args
    reactiveProps = propsOrArgs;
    if (reactivityRef.current !== null) {
      reactivityRef.current.props = reactiveProps;
    }
  } else {
    // Stop reactive re-render when updating props because the component is already going to re-render
    if (reactivityRef.current !== null)
      reactivityRef.current.updatingProps = true;
    // eslint-disable-next-line react-hooks/rules-of-hooks
    reactiveProps = useReactiveRerender(propsOrArgs);
    if (reactivityRef.current !== null)
      reactivityRef.current.updatingProps = false;
  }

  const [, setTick] = useState(0);
  const rerender = () => setTick((v) => v + 1);

  const initializeRef = (inRender: boolean) => {
    if (reactivityRef.current === null) {
      const scope = effectScope();
      scope.run(() => {
        const runner = effect(
          function reactiveRender() {
            if (Array.isArray(reactivityRef.current!.props)) {
              return (func as (...args: any) => any)(
                ...reactivityRef.current!.props
              );
            } else {
              return func(
                reactivityRef.current!.props,
                reactivityRef.current!.ctx
              );
            }
          },
          {
            lazy: true,
            scheduler: () => {
              if (!reactivityRef.current!.updatingProps) rerender();
            },
          }
        );
        reactivityRef.current = {
          scope,
          effect: runner,
          props: reactiveProps,
          ctx: undefined,
          destroyAfterUse: inRender && getFiberInDev() !== null,
          updatingProps: false,
        };
      });
      if (!inRender) {
        rerender();
      }
    }
  };

  useEffect(() => {
    initializeRef(false);
    return () => {
      destroyReactivityRef(reactivityRef);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  initializeRef(true);

  return reactivityRef;
}

/**
 * Converts a function component into a reactive component. A reactive component receives reactive props and
 * re-renders automatically when its data dependencies are modified.
 *
 * If your function component makes use of a reactive value, the component has to be wrapped by `makeReactive` so
 * that it can re-render when the reactive value changes.
 *
 * @example
 * Simple usage of `makeReactive`.
 * ```tsx
 * export default makeReactive(function App() {
 *   const state = useReactive({ count: 1 });
 *   return <p>{state.count}</p>;
 * });
 * ```
 *
 * @example
 * Once a component is made reactive, it may access reactive values from any sources, not just from props, contexts
 * and hooks.
 * ```tsx
 * import { reactiveState } from './anotherFile';
 *
 * export default makeReactive(function App() {
 *   return <p>{reactiveState.count}</p>;
 * });
 * ```
 * @typeParam P - The props of a React function component.
 * @param component The function component to be made reactive.
 * @returns A reactive function component.
 */
export const makeReactive = <P extends {}>(
  component: React.FC<P>
): React.FC<P> => {
  const ReactiveFC: React.FC<P> = (props, ctx) => {
    const reactivityRef = useReactivityInternals(component, props);

    reactivityRef.current!.ctx = ctx;
    const ret = reactivityRef.current!.scope.run(function scopedRender() {
      return reactivityRef.current!.effect();
    });
    if (reactivityRef.current!.destroyAfterUse) {
      destroyReactivityRef(reactivityRef);
    }
    return ret;
  };
  ReactiveFC.propTypes = component.propTypes;
  ReactiveFC.contextTypes = component.contextTypes;
  ReactiveFC.defaultProps = component.defaultProps;
  ReactiveFC.displayName = component.displayName;
  Object.defineProperty(ReactiveFC, 'name', {
    value: component.name,
    writable: false,
  });
  return ReactiveFC;
};

/**
 * Converts a custom hook to be reactive. A reactive hook causes the component to re-render automatically when its data
 * dependencies are modified.
 *
 * If your custom hook makes use of a reactive value, the function has to be wrapped by `makeReactive` so
 * that it can trigger a re-render on the component when the reactive value changes.
 *
 * @example
 * Simple usage of `makeReactive`.
 * ```tsx
 * export default makeReactive(function useCount() {
 *   const state = useReactive({ count: 1 });
 *   return state.count;
 * });
 * ```
 *
 * @example
 * Once a custom hook is made reactive, it may access reactive values from any sources, not just from props, contexts
 * and hooks.
 * ```tsx
 * import { reactiveState } from './anotherFile';
 *
 * export default makeReactive(function useReactiveState() {
 *   return reactiveState.count;
 * });
 * ```
 * @typeParam T - A React custom hook function.
 * @param component The custom hook to be made reactive.
 * @returns A reactive custom hook.
 */
export const makeReactiveHook = <T extends (...args: any) => any>(
  hook: T
): T => {
  const useReactiveHook: T = ((...args: any) => {
    const reactivityRef = useReactivityInternals(hook, args);

    const ret = reactivityRef.current!.scope.run(function scopedRender() {
      return reactivityRef.current!.effect();
    });
    if (reactivityRef.current!.destroyAfterUse) {
      destroyReactivityRef(reactivityRef);
    }
    return ret;
  }) as T;
  return useReactiveHook;
};
