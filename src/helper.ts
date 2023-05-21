export function isCallable<T extends (...args: any[]) => any>(
  obj: T | unknown
): obj is T {
  return typeof obj === 'function';
}
