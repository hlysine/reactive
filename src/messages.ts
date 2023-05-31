const messages = {
  warnLazyWatchEffect() {
    console.warn(
      '"lazy" option is not supported for useWatchEffect because the effect has to be run to collect dependencies. ' +
        'Use watchEffect if you want to control the execution timing of the effect.'
    );
  },
  warnLazyWatch() {
    console.warn(
      '"lazy" option is not supported for useWatch because the effect has to be run to collect dependencies. ' +
        'Use the "immediate" option if you want to control callback execution. ' +
        'Use watch if you want to control the execution timing of the effect.'
    );
  },
  warnInvalidWatchSource(s: unknown) {
    console.warn(
      'Invalid watch source: ',
      s,
      'A watch source can only be a getter/effect function, a ref, a reactive object, or an array of these types.'
    );
  },
  warnNotInMakeReactive(hookName: string) {
    console.log(
      `${hookName} is called in a component not wrapped by makeReactive. ` +
        'Reactive hooks that register a side effect should be called in a makeReactive component to be compatible with React strict mode during development. ' +
        'You may ignore this warning if you are not using strict mode.'
    );
  },
};

export default messages;
