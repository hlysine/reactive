import React, { useState } from 'react';
import {
  makeReactive,
  reactive,
  useComputed,
  useCustomRef,
  useReactive,
  useReadonly,
  useRef,
  useShallowReactive,
  useShallowReadonly,
  useShallowRef,
  useEffect,
} from '@hlysine/reactive';

const obj = reactive({ a: 1, b: 2 });

const Watcher = makeReactive(function Watcher() {
  const [, setState] = useState(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    console.log('effect', obj.a);
    setState(obj.a);
    return () => console.log('cleanup useEffect');
  });
  console.log('render Watcher');

  return <button onClick={() => obj.a++}>Test update inside watcher</button>;
});

export default makeReactive(function App() {
  const [show, setShow] = useState(true);

  const count = useRef(0);
  useComputed(() => count.value + 1);
  const obj2 = useReactive({ a: 1 });
  useReadonly(obj2);
  useShallowRef(0);
  useShallowReactive({ b: 2 });
  useShallowReadonly({ c: 2 });
  useCustomRef((track, trigger) => ({
    get() {
      track();
      return count.value;
    },
    set(value) {
      count.value = value;
      trigger();
    },
  }));

  console.log('render App');

  return (
    <>
      <button onClick={() => setShow((v) => !v)}>show watcher</button>
      <button onClick={() => obj.a++}>Test update</button>
      {show && <Watcher />}
    </>
  );
});
