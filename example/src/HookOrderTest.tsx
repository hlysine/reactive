import React, { useEffect } from 'react';
import {
  makeReactive,
  useComputed,
  useReference,
  useWatch,
} from '@hlysine/reactive';

export default makeReactive(function App() {
  useEffect(() => {
    console.log('App mounted');
    return () => console.log('App unmounted ');
  }, []);
  console.log('App render');

  const count = useReference(0);
  const count2 = useComputed(() => {
    console.log('useComputed triggered for count2');
    return count.value + 1;
  });
  const count3 = useComputed(() => {
    console.log('useComputed triggered for count3');
    return count2.value + 1;
  });
  useWatch(count3, (val) => console.log('useWatch count3:', val));
  return (
    <div>
      {count.value} -&gt; {count2.value} -&gt; {count3.value}
      <br></br>
      <button onClick={() => count.value++}>Test update</button>
    </div>
  );
});
