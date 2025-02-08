import { gateToTrigger, makePolyrhythmFn } from "./program";

describe("makePolyrhythmFn", () => {
  it("makes a 3:2 rhythm", () => {
    const fn = makePolyrhythmFn(3, 2);
    expect(fn(0)["updateA"]).toEqual(true);
    expect(fn(0)["updateB"]).toEqual(true);
    expect(fn(1)["updateA"]).toEqual(true);
    expect(fn(1)["updateB"]).toEqual(false);
    expect(fn(2)["updateA"]).toEqual(false);
    expect(fn(2)["updateB"]).toEqual(true);
    expect(fn(3)["updateA"]).toEqual(true);
    expect(fn(3)["updateB"]).toEqual(false);
    expect(fn(4)["updateA"]).toEqual(true);
    expect(fn(4)["updateB"]).toEqual(true);
  });
  it("makes a 5:3 rhythm", () => {
    const fn = makePolyrhythmFn(5, 3);
    expect(fn(0)["updateA"]).toEqual(true);
    expect(fn(0)["updateB"]).toEqual(true);
    expect(fn(1)["updateA"]).toEqual(true);
    expect(fn(1)["updateB"]).toEqual(false);
    expect(fn(2)["updateA"]).toEqual(false);
    expect(fn(2)["updateB"]).toEqual(true);
    expect(fn(3)["updateA"]).toEqual(true);
    expect(fn(3)["updateB"]).toEqual(false);
    expect(fn(4)["updateA"]).toEqual(true);
    expect(fn(4)["updateB"]).toEqual(false);
    expect(fn(5)["updateA"]).toEqual(false);
    expect(fn(5)["updateB"]).toEqual(true);
    expect(fn(6)["updateA"]).toEqual(true);
    expect(fn(6)["updateB"]).toEqual(false);
    expect(fn(7)["updateA"]).toEqual(true);
    expect(fn(7)["updateB"]).toEqual(true);
  });
});

describe("gateToTrigger", () => {
  it("works", () => {
    expect(gateToTrigger([1, 1, 0, 1, 1, 1, 0, 0])).toEqual([
      1, 0, 0, 1, 0, 0, 0, 0,
    ]);
    expect(gateToTrigger([1, 0, 0, 0, 0])).toEqual([1, 0, 0, 0, 0]);
    expect(gateToTrigger([0, 0, 1, 1, 0])).toEqual([0, 0, 1, 0, 0]);
  });
});
