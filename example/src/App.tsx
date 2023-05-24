import React from 'react';
import { reactive, useWatchEffect } from '@hlysine/reactive';

const obj = reactive({ a: 1, b: 2 });

export default function App() {
  useWatchEffect(() => {
    console.log(obj.a);
    return () => console.log('cleanup');
  });
  console.log('render');

  return <button onClick={() => obj.a++}>Test component</button>;
}
