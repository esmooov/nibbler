import { isNull, isUndefined } from "lodash";
import { Program } from "./program";

export type Bit = 0 | 1;
export const toBit = (b: boolean) => (b ? 1 : 0);

export type Nibble = [Bit, Bit, Bit, Bit];

export const toInt = (n: Nibble | number): number => {
  if (typeof n === "number") return n;
  return parseInt(n.slice().reverse().join(""), 2);
};

export const toNibble = (n: number): Nibble => {
  const mRaw = n % 16;
  const m = mRaw < 0 ? 16 + mRaw : mRaw;
  return Number(m)
    .toString(2)
    .padStart(4, "0")
    .split("")
    .reverse()
    .map((c) => Number(c)) as Nibble;
};

export const addBits = (
  a: Nibble | number | null,
  b: Nibble | number | null
): Nibble => {
  const aInt = isNull(a) ? 0 : toInt(a);
  const bInt = isNull(b) ? 0 : toInt(b);
  return toNibble(aInt + bInt);
};

export type BitIndex = 1 | 2 | 4 | 8;
export const digit = (n: Nibble, d: BitIndex) => {
  switch (d) {
    case 1:
      return n[0];
    case 2:
      return n[1];
    case 4:
      return n[2];
    case 8:
      return n[3];
  }
  throw `${d} is not a legal digit`;
};

export type Update = {
  value: Nibble;
  description: string;
};

export type BitUpdate = {
  value: Bit;
  description: string;
};

type Entry = {
  nibbleA: Nibble;
  nibbleB: Nibble;
  NA: number;
  NB: number;
  carryA: Bit;
  carryB: Bit;
  descriptionA: string;
  descriptionB: string;
  aux: Bit | null;
};

export type History = Array<Entry>;

export type State = {
  history: History;
  isLooping: boolean;
  willStartLooping: boolean;
  nibbleA: Nibble;
  nibbleB: Nibble;
  NA: number;
  NB: number;
};

export const runNibblers = (
  program: Program,
  iterations: number = 32
): State => {
  const rows = Array.from(Array(iterations).keys());

  const initialState: State = {
    nibbleA: [0, 0, 0, 0],
    nibbleB: [0, 0, 0, 0],
    NA: 0,
    NB: 0,
    history: [],
    willStartLooping: false,
    isLooping: false,
  };

  return rows.reduce((state: State) => {
    const { nibbleA, NA, nibbleB, NB, history, isLooping, willStartLooping } =
      state;
    if (isLooping) return state;

    const { updateA, updateB, updateAux } = program(nibbleA, nibbleB);
    const nextNibbleA = updateA.value;
    const nextNibbleB = updateB.value;
    const nextAux = updateAux?.value;
    const nextNA = toInt(nextNibbleA);
    const nextNB = toInt(nextNibbleB);

    const carryA = nextNA < NA ? 1 : 0;
    const carryB = nextNB < NB ? 1 : 0;

    const entry: Entry = {
      nibbleA,
      nibbleB,
      NA,
      NB,
      carryA,
      carryB,
      descriptionA: updateA.description,
      descriptionB: updateB.description,
      aux: isUndefined(nextAux) ? null : nextAux,
    };

    const nextIsLooping = willStartLooping;
    const nextWillStartLooping =
      willStartLooping ||
      history.some((oldEntry) => entriesAreEqual(entry, oldEntry));

    history.push(entry);

    return {
      nibbleA: nextNibbleA,
      nibbleB: nextNibbleB,
      NA: nextNA,
      NB: nextNB,
      history,
      willStartLooping: nextWillStartLooping,
      isLooping: nextIsLooping,
    };
  }, initialState);
};

export const entriesAreEqual = (a: Entry, b: Entry) =>
  a.NA === b.NA && a.NB === b.NB;
