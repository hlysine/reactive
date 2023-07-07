import React, { useEffect } from 'react';
import { makeReactive, useAsync, useAsyncWatch } from '@hlysine/reactive';

const UserProfile = makeReactive((props: { userId: string }) => {
  const { loading, result, error } = useAsyncWatch(
    () => props.userId,
    (id) => fetch('https://my-website.com/user/' + id).then((res) => res.json())
  );

  if (loading.value) {
    return <p>Loading...</p>;
  } else if (error.value) {
    return <p>{error.value}</p>;
  } else {
    return <p>{result.value}</p>;
  }
});

const VersionNumber = makeReactive(() => {
  const { loading, result, error, execute } = useAsync(() =>
    fetch('https://my-website.com/version/').then((res) => res.text())
  );
  // call api on page load
  useEffect(execute, [execute]);

  if (loading.value) {
    // if still loading
    return <p>Loading...</p>;
  } else if (error.value) {
    // if api call failed
    return (
      <>
        <button onClick={execute}>Retry</button>
        <p>{error.value}</p>
      </>
    );
  } else {
    // if api call successful
    return <p>{result.value}</p>;
  }
});

export default function App() {
  return (
    <>
      <UserProfile userId="lysine" />
      <VersionNumber />
    </>
  );
}
