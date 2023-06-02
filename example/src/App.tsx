// import React, { useState } from 'react';
// import { makeReactive, reactive, useWatchEffect } from '@hlysine/reactive';

import React, { useEffect } from 'react';
import { makeReactive, useComputed, useReference } from '@hlysine/reactive';

// const obj = reactive({ a: 1, b: 2 });

// const Watcher = makeReactive(function Watcher() {
//   const [, setState] = useState(0);
//   useWatchEffect(() => {
//     console.log('watchEffect', obj.a);
//     setState(obj.a);
//     return () => console.log('cleanup useWatchEffect');
//   });
//   console.log('render App');

//   return <button onClick={() => obj.a++}>Test update inside watcher</button>;
// });

// export default makeReactive(function App() {
//   const [show, setShow] = useState(true);

//   return (
//     <>
//       <button onClick={() => setShow((v) => !v)}>show watcher</button>
//       <button onClick={() => obj.a++}>Test update</button>
//       {show && <Watcher />}
//     </>
//   );
// });

export default makeReactive(function App() {
  const count = useReference(0);
  const comp = useComputed(() => {
    console.log('getter');
    return count.value + 1;
  });
  console.log('render(before) App');
  useEffect(() => {
    console.log('mount App');
    return () => console.log('unmount App');
  }, []);
  console.log('render(after) App');
  return <h1>comp: {comp.value}</h1>;
});
