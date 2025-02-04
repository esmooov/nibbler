import { flatten, uniq, uniqBy, zip } from "lodash";
import { other, Program } from "./program";
import { Bit, BitIndex, Nibble, toBit, toNibble } from "./simulate";
import * as percom from "percom";
import { mapToValues } from "./meta";

type VariableManifest<Keys extends string> = { [Key in Keys]: Array<any> };
type Variables<Keys extends string> = { [Key in Keys]: any };

export const fuzz = <Vars extends string>(
  manifest: VariableManifest<Vars>,
  fn: (variables: Variables<Vars>) => void
) => {
  const variables = distribute([], Object.entries(manifest));
  variables.forEach((v) => {
    fn(v);
  });
};

// TODO call without building options
export const fuzz2 = <Vars extends string>(
  manifest: VariableManifest<Vars>,
  fn: (variables: Variables<Vars>, totalRuns: number) => void
) => {
  const options = Object.values(manifest) as Array<Array<any>>;
  const totalRuns = options.reduce(
    (m: number, i: Array<any>) => m * i.length,
    1
  );
  const entries = Object.entries(manifest);
  fuzzInner(entries[0], entries.slice(1), {}, fn, totalRuns);
};

const fuzzInner = (currentEntry, otherEntries, map, fn, totalRuns) => {
  if (!currentEntry) {
    fn(map, totalRuns);
  } else {
    const [key, options] = currentEntry;
    options.forEach((o) =>
      fuzzInner(
        otherEntries[0],
        otherEntries.slice(1),
        { ...map, [key]: o },
        fn,
        totalRuns
      )
    );
  }
};

export const distribute = (accumulator, entries) => {
  if (!entries.length) return accumulator;

  const [entryKey, entryValues] = entries[0];
  const otherEntries = entries.slice(1);
  const newAccumulator = entryValues.reduce((m, v) => {
    const layer =
      accumulator.length === 0
        ? [{ [entryKey]: v }]
        : accumulator.map((vars) => {
            vars[entryKey] = v;
            return { ...vars, [entryKey]: v };
          });
    return m.concat(layer);
  }, []);

  return distribute(newAccumulator, otherEntries);
};

export const range = (a: number, b: number): Array<number> => {
  return Array(b - a + 1)
    .fill(null)
    .map((_, i) => i + a);
};

export const bits: Array<BitIndex> = [1, 2, 4, 8];

const bitPermuations = percom.per(bits, 4);
export const allMasks = range(0, 15).map(toNibble);
export const twoMasks: Array<Nibble> = [
  [0, 0, 1, 1],
  [0, 1, 1, 0],
  [1, 1, 0, 0],
  [1, 0, 0, 1],
  [1, 0, 1, 0],
  [0, 1, 0, 1],
];
export const oneMasks: Array<Nibble> = [
  [1, 0, 0, 0],
  [0, 1, 0, 0],
  [0, 0, 1, 0],
  [0, 0, 0, 1],
];

const generateFlipMasks = (masks: Array<Nibble>) => {
  const fullMasks: Array<Array<0 | 1 | -0 | -1>> = [];
  masks.forEach((m) => {
    allMasks.forEach((a) => {
      fullMasks.push(
        zip(m, a).map(([m, a]) => (a === 1 ? -1 * (m as Bit) : m)) as Array<
          0 | 1 | -0 | -1
        >
      );
    });
  });
  return fullMasks;
};

export const masksToBitmap = (
  masks: Array<Nibble>,
  includeFlips: boolean = false
) => {
  const fullMasks = includeFlips ? generateFlipMasks(masks) : masks;
  return uniqBy(
    flatten(
      fullMasks.map((mask) => {
        return bitPermuations.map((perm) => {
          const finalMap = {};
          mask.forEach((m, i) => {
            const isNegative = Object.is(m, -0) || Object.is(m, -1);
            const index = isNegative ? bits[i] * -1 : bits[i];
            finalMap[index] = m == 0 ? 0 : perm[i];
          });
          return finalMap;
        });
      })
    ),
    (map) => mapToValues(map, true).join("")
  );
};
