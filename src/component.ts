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
}

const renderedComponents = new WeakMap<any, ComponentReactivity>();

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
export const makeReactive = <T extends React.FC>(component: T): T => {
  const reactiveFC = ((props, ctx) => {
    const reactivityRef = useRef<ComponentReactivity | null>(null);
    const [, setTick] = useState(0);
    const rerender = () => setTick((v) => v + 1);

    const initializeRef = (requiresRerender: boolean) => {
      if (reactivityRef.current === null) {
        const scope = effectScope();
        scope.run(() => {
          const runner = effect(() => component(props, ctx), {
            lazy: true,
            scheduler: rerender,
          });
          reactivityRef.current = {
            scope,
            effect: runner,
          };
        });
        if (requiresRerender) {
          rerender();
        }
      }
    };

    useEffect(() => {
      initializeRef(true);
      return () => {
        reactivityRef.current!.scope.stop();
        reactivityRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fiber = getFiberInDev();
    if (fiber !== null) {
      // only prevent double render when fiber is not null, indicating development mode
      const doubleRendered =
        renderedComponents.get(fiber) ??
        (fiber.alternate ? renderedComponents.get(fiber.alternate) : undefined);
      if (doubleRendered && reactivityRef.current === null) {
        doubleRendered.scope.stop();
      }
    }

    initializeRef(false);

    if (fiber !== null) {
      renderedComponents.set(fiber, reactivityRef.current!);
    }

    return reactivityRef.current!.scope.run(() =>
      reactivityRef.current!.effect()
    );
  }) as T;
  reactiveFC.propTypes = component.propTypes;
  reactiveFC.contextTypes = component.contextTypes;
  reactiveFC.defaultProps = component.defaultProps;
  reactiveFC.displayName = component.displayName;
  Object.defineProperty(reactiveFC, 'name', {
    value: component.name,
    writable: false,
  });
  return reactiveFC;
};
