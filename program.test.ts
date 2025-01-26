import { makePolyrhythmFn } from "./program";

describe("makePolyrhythmFn", () => {
  it("makes a 3:2 rhythm", () => {
    const fn = makePolyrhythmFn(3, 2);
    expect(fn(0)).toEqual([true, true]);
    expect(fn(1)).toEqual([true, false]);
    expect(fn(2)).toEqual([false, true]);
    expect(fn(3)).toEqual([true, false]);
    expect(fn(4)).toEqual([true, true]);
  });
  it("makes a 5:3 rhythm", () => {
    const fn = makePolyrhythmFn(5, 3);
    expect(fn(0)).toEqual([true, true]);
    expect(fn(1)).toEqual([true, false]);
    expect(fn(2)).toEqual([false, true]);
    expect(fn(3)).toEqual([true, false]);
    expect(fn(4)).toEqual([true, false]);
    expect(fn(5)).toEqual([false, true]);
    expect(fn(6)).toEqual([true, false]);
    expect(fn(7)).toEqual([true, true]);
  });
});
