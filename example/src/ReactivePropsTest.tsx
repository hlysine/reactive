import React from 'react';
import {
  makeReactive,
  toRaw,
  useReference,
  useWatchEffect,
} from '@hlysine/reactive';

interface CounterProps {
  count: number;
}

const Counter = makeReactive(function Counter(props: CounterProps) {
  console.log('render Counter', toRaw(props), props);
  useWatchEffect(() => {
    console.log('Watch effect: ', props.count);
    return () => console.log('cleanup useWatchEffect');
  });
  return <p>{props.count}</p>;
});

export default makeReactive(function App() {
  console.log('render App');
  const count = useReference(0);
  return (
    <>
      <button onClick={() => count.value++}>Test update</button>
      <Counter count={count.value} />
    </>
  );
});
