import {
  EffectScope,
  effectScope,
  ReactiveEffectRunner,
  effect,
  shallowReadonly,
  shallowReactive,
} from '@vue/reactivity';
import { getFiberInDev } from './helper';
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

function assignDiff(target: Record<any, any>, source: Record<any, any>) {
  let remainingKeys = Object.keys(target);
  if (source !== null && source !== undefined && typeof source === 'object') {
    Object.entries(source).forEach(([key, value]) => {
      remainingKeys = remainingKeys.filter((k) => k !== key);
      if (key in target && Object.is(target[key], value)) {
        return;
      }
      target[key] = value;
    });
  }
  remainingKeys.forEach((key) => {
    delete target[key];
  });
}

interface ReactiveRerenderRef<T> {
  reactive: T;
  readonly: T;
}

/**
 * Converts an object that changes on re-render to a reactive object that maintains the same instance across re-renders.
 *
 * This hook converts data in React's reactivity system to reactive data that is compatible with the rest of this
 * library. You should use other hooks to create reactive data from source if possible, but if not, you can use this
 * hook to convert the data. A typical use case is to pass values from `useState` hooks or React contexts into this
 * function so that reactive effects, such as `useWatchEffect`, can react to data changes from those hooks.
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
  props: P,
  component: React.FC<P>
) {
  const reactivityRef = useRef<ComponentReactivity | null>(null);

  // Stop reactive re-render when updating props because the component is already going to re-render
  if (reactivityRef.current !== null)
    reactivityRef.current.updatingProps = true;
  const reactiveProps = useReactiveRerender(props);
  if (reactivityRef.current !== null)
    reactivityRef.current.updatingProps = false;

  const [, setTick] = useState(0);
  const rerender = () => setTick((v) => v + 1);

  const initializeRef = (inRender: boolean) => {
    if (reactivityRef.current === null) {
      const scope = effectScope();
      scope.run(() => {
        const runner = effect(
          function reactiveRender() {
            return component(
              reactivityRef.current!.props,
              reactivityRef.current!.ctx
            );
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

interface MakeReactive {
  /**
   * Converts a function component into a reactive component.
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
  <P extends {}>(component: React.FC<P>): React.FC<P>;
  /**
   * Converts a custom hook to be reactive.
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
  <T extends (...args: any) => any>(
    hook: T extends React.FC<any> ? never : T
  ): T;
}

export const makeReactive: MakeReactive = <P extends {}>(
  component: React.FC<P>
): React.FC<P> => {
  const ReactiveFC: React.FC<P> = (props, ctx) => {
    const reactivityRef = useReactivityInternals(props, component);

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
