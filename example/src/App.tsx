import React from 'react';
import {
  makeReactive,
  useReactive,
  useWatch,
  useWatchEffect,
} from '@hlysine/reactive';

export default makeReactive(function App() {
  const obj = useReactive(() => ({
    nested1: {
      a: 1,
    },
    nested2: {
      b: 1,
    },
    first: true,
  }));

  useWatchEffect(() => {
    console.log('watch effect', obj.nested1.a);
    return () => console.log('watch effect cleanup');
  });

  useWatch(
    obj,
    (newVal, oldVal) => {
      console.log('watch', oldVal, newVal);
      return () => console.log('watch cleanup');
    },
    { deep: true, immediate: true }
  );

  return (
    <>
      <button type="button" onClick={() => (obj.first = !obj.first)}>
        {obj.first ? 'first' : 'second'}
      </button>
      {obj.first ? (
        <button type="button" onClick={() => obj.nested1.a++}>
          {obj.nested1.a}
        </button>
      ) : (
        <button type="button" onClick={() => obj.nested2.b++}>
          {obj.nested2.b}
        </button>
      )}
    </>
  );
});
