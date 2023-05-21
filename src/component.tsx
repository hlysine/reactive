import {
  EffectScope,
  effectScope,
  ReactiveEffectRunner,
  effect,
} from '@vue/reactivity';
import { useEffect, useRef, useState } from 'react';

interface ComponentReactivity {
  scope: EffectScope;
  effect: ReactiveEffectRunner;
}

export const makeReactive = <T extends React.FC>(component: T): T => {
  const reactiveFC = ((props, ctx) => {
    const reactivityRef = useRef<ComponentReactivity | null>(null);
    const [, setTick] = useState(0);

    const initializeRef = (requiresRerender: boolean) => {
      if (reactivityRef.current === null) {
        const scope = effectScope();
        scope.run(() => {
          const runner = effect(() => component(props, ctx), {
            lazy: true,
            scheduler: () => setTick((v) => v + 1),
          });
          reactivityRef.current = {
            scope,
            effect: runner,
          };
        });
        if (requiresRerender) {
          console.log(
            'reactive: reactivity is not initialized on mount, re-rendering component to collect dependencies.\n\nThis is normal if you are in React development mode.'
          );
          setTick((v) => v + 1);
        }
      }
    };

    useEffect(() => {
      initializeRef(true);
      return () => {
        reactivityRef.current?.scope.stop();
        reactivityRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    initializeRef(false);

    return reactivityRef.current?.scope.run(() =>
      reactivityRef.current?.effect()
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
