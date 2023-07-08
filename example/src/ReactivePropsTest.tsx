import React from 'react';
import { makeReactive, toRaw, useRef, useEffect } from '@hlysine/reactive';

interface CounterProps {
  count: number;
}

const Counter = makeReactive(function Counter(props: CounterProps) {
  console.log('render Counter', toRaw(props), props);
  useEffect(() => {
    console.log('Watch effect: ', props.count);
    return () => console.log('cleanup useEffect');
  });
  return <p>{props.count}</p>;
});

export default makeReactive(function App() {
  console.log('render App');
  const count = useRef(0);
  return (
    <>
      <button onClick={() => count.value++}>Test update</button>
      <Counter count={count.value} />
    </>
  );
});
