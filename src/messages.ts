const messages = {
  warnLazyEffect() {
    console.warn(
      '"lazy" option is not supported for useEffect because the effect has to be run to collect dependencies. ' +
        'Use effect if you want to control the execution timing of the effect.'
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
};

export default messages;
