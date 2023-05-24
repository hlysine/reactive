const messages = {
  warnLazyWatchEffect() {
    console.warn(
      '"lazy" option is not supported for useWatchEffect because the effect has to be run to collect dependencies. ' +
        'Use watchEffect if you want to control the execution timing of the effect.'
    );
  },
  warnInvalidWatchSource(s: unknown) {
    console.warn(
      'Invalid watch source: ',
      s,
      'A watch source can only be a getter/effect function, a ref, a reactive object, or an array of these types.'
    );
  },
  warnNotInEffectScope(hookName: string) {
    console.log(
      `${hookName} is called outside of an effect scope. ` +
        'Reactive hooks can only be used in the body of a React function component that is wrapped by makeReactive. ' +
        'If you want to call this outside of a component, use the non-hook version instead.'
    );
  },
};

export default messages;
