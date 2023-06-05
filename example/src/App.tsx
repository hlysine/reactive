import React, { useState } from 'react';
import {
  makeReactive,
  reactive,
  useComputed,
  useCustomRef,
  useReactive,
  useReadonly,
  useReference,
  useShallowReactive,
  useShallowReadonly,
  useShallowRef,
  useWatchEffect,
} from '@hlysine/reactive';

const obj = reactive({ a: 1, b: 2 });

const Watcher = makeReactive(function Watcher() {
  const [, setState] = useState(0);
  useWatchEffect(() => {
    console.log('watchEffect', obj.a);
    setState(obj.a);
    return () => console.log('cleanup useWatchEffect');
  });
  console.log('render Watcher');

  return <button onClick={() => obj.a++}>Test update inside watcher</button>;
});

export default makeReactive(function App() {
  const [show, setShow] = useState(true);

  const count = useReference(0);
  useComputed(() => count.value + 1);
  const obj = useReactive({ a: 1 });
  useReadonly(obj);
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
