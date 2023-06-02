import {
  EffectScope,
  effectScope,
  ReactiveEffectRunner,
  effect,
} from '@vue/reactivity';
import { getFiberInDev } from './helper';
import { useEffect, useRef, useState } from 'react';

interface ComponentReactivity {
  scope: EffectScope;
  effect: ReactiveEffectRunner;
  args: [props: any, ctx?: any];
  destroyAfterUse: boolean;
}

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
 * @typeParam T - A React function component.
 * @param component The function component to be made reactive.
 * @returns A reactive function component.
 */
export const makeReactive = <P extends {}>(
  component: React.FC<P>
): React.FC<P> => {
  const ReactiveFC: React.FC<P> = (...args) => {
    const reactivityRef = useRef<ComponentReactivity | null>(null);
    const [, setTick] = useState(0);
    const rerender = () => setTick((v) => v + 1);

    const initializeRef = (inRender: boolean) => {
      if (reactivityRef.current === null) {
        const scope = effectScope();
        scope.run(() => {
          const runner = effect(
            () => component(...reactivityRef.current!.args),
            {
              lazy: true,
              scheduler: rerender,
            }
          );
          reactivityRef.current = {
            scope,
            effect: runner,
            args,
            destroyAfterUse: inRender && getFiberInDev() !== null,
          };
        });
        if (!inRender) {
          rerender();
        }
      }
    };

    const destroyRef = () => {
      if (reactivityRef.current !== null) {
        reactivityRef.current.scope.stop();
        reactivityRef.current = null;
      }
    };

    useEffect(() => {
      initializeRef(false);
      return () => {
        destroyRef();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    initializeRef(true);

    reactivityRef.current!.args = args;
    const ret = reactivityRef.current!.scope.run(() =>
      reactivityRef.current!.effect()
    );
    if (reactivityRef.current!.destroyAfterUse) {
      destroyRef();
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
