import { distribute, fuzz, range } from "./testUtils";

describe("distribute", () => {
  it("does simple distribution", () => {
    const result = distribute(
      [],
      [
        ["a", [1]],
        ["b", [2, 3]],
        ["c", [8]],
      ]
    );
    expect(result).toEqual([
      { a: 1, b: 2, c: 8 },
      { a: 1, b: 3, c: 8 },
    ]);
  });
  it("does more complex distribution", () => {
    const result = distribute(
      [],
      [
        ["a", [1]],
        ["b", [2, 3]],
        ["c", [8, 9, 10]],
      ]
    );
    expect(result).toEqual([
      { a: 1, b: 2, c: 8 },
      { a: 1, b: 3, c: 8 },
      { a: 1, b: 2, c: 9 },
      { a: 1, b: 3, c: 9 },
      { a: 1, b: 2, c: 10 },
      { a: 1, b: 3, c: 10 },
    ]);
  });
});

describe("fuzz", () => {
  it("calls a function with all combinations of arguments", () => {
    const fn = jest.fn();
    const manifest = {
      a: [1],
      b: [2, 3],
      c: [4, 5, 6],
    };
    fuzz(manifest, fn);
    expect(fn.mock.calls.length).toBe(6);
  });

  it("calls a function with a range of arguments", () => {
    const fn = jest.fn();
    const manifest = {
      a: range(0, 15),
      b: range(0, 15),
      c: range(0, 15),
    };
    fuzz(manifest, fn);
    expect(fn.mock.calls.length).toBe(4096);
    expect(fn).toHaveBeenCalledWith({ a: 0, b: 5, c: 9 });
  });
});

describe("range", () => {
  it("makes a range", () => {
    const r = range(4, 9);
    expect(r).toEqual([4, 5, 6, 7, 8, 9]);
  });
});
