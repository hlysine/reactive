import { WrappedRef, createWrappedRef } from '../helper';

describe('createWrappedRef', () => {
  it('traps defineProperty', () => {
    const obj: { a: number; b?: number } = { a: 1 };
    const wrapped = createWrappedRef(obj);
    Object.defineProperty(wrapped, 'b', { value: 2 });
    expect(wrapped.b).toBe(2);
  });
  it('traps deleteProperty', () => {
    const obj: { a?: number } = { a: 1 };
    const wrapped = createWrappedRef(obj);
    delete wrapped.a;
    expect(wrapped.a).toBeUndefined();
  });
  it('traps get', () => {
    const obj = { a: 1 };
    const wrapped = createWrappedRef(obj);
    expect(wrapped.a).toBe(obj.a);
    expect(wrapped.__current__).toBe(obj);
  });
  it('traps getOwnPropertyDescriptor', () => {
    const obj = { a: 1 };
    const wrapped = createWrappedRef(obj);
    expect(Object.getOwnPropertyDescriptor(wrapped, 'a')).toEqual(
      Object.getOwnPropertyDescriptor(obj, 'a')
    );
  });
  it('traps getPrototypeOf', () => {
    const obj = { a: 1 };
    const wrapped = createWrappedRef(obj);
    expect(Object.getPrototypeOf(wrapped)).toBe(Object.getPrototypeOf(obj));
  });
  it('traps has', () => {
    const obj = { a: 1 };
    const wrapped = createWrappedRef(obj);
    expect('a' in wrapped).toBe(true);
    expect('b' in wrapped).toBe(false);
    expect('__current__' in wrapped).toBe(false);
  });
  it('traps isExtensible', () => {
    const obj = { a: 1 };
    const wrapped = createWrappedRef(obj);
    expect(Object.isExtensible(wrapped)).toBe(true);
  });
  it('traps ownKeys', () => {
    const obj = { a: 1 };
    const wrapped = createWrappedRef(obj);
    expect(Reflect.ownKeys(wrapped)).toEqual(Reflect.ownKeys(obj));
  });
  it('traps preventExtensions', () => {
    const obj = { a: 1 };
    const wrapped = createWrappedRef(obj);
    expect(() => Object.preventExtensions(wrapped)).toThrow();
  });
  it('traps set', () => {
    const obj = { a: 1 };
    const wrapped: WrappedRef<{ a: number } | { b: string }> =
      createWrappedRef(obj);
    wrapped.a = 2;
    expect(wrapped.a).toBe(2);
    expect(wrapped.a).toBe(obj.a);
    expect(wrapped).toEqual(obj);

    const newObj = { b: 'str' };
    wrapped.__current__ = newObj;
    expect(wrapped.__current__).toBe(newObj);
    expect(wrapped).toEqual(newObj);
  });
  it('traps setPrototypeOf', () => {
    const obj: { a: number; b?: number } = { a: 1 };
    const wrapped = createWrappedRef(obj);
    Object.setPrototypeOf(wrapped, { b: 2 });
    expect(wrapped.b).toBe(2);
    expect(obj.b).toBe(2);
  });
  it('does not accept non-extensible objects', () => {
    const obj = Object.preventExtensions({ a: 1 });
    expect(() => createWrappedRef(obj)).toThrow();

    const obj2: { b?: number; c?: number } = { b: 2 };
    const obj3 = Object.preventExtensions({
      c: 4,
    });
    const wrapped = createWrappedRef(obj2);
    expect(() => (wrapped.__current__ = obj3)).toThrow();
  });
});
