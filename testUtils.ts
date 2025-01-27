import { flatten, uniq, uniqBy, zip } from "lodash";
import { Program } from "./program";
import { BitIndex, toBit, toNibble } from "./simulate";
import * as percom from "percom";

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
const masks = range(0, 15).map(toNibble);
export const straightBitmaps = uniqBy(
  flatten(
    masks.map((mask) => {
      return bitPermuations.map((perm) => {
        const adds = zip(perm, mask).map(([p, m]) => (m === 1 ? p : 0));
        return {
          1: adds[0],
          2: adds[1],
          4: adds[2],
          8: adds[3],
        };
      });
    })
  ),
  ({ 1: a, 2: b, 4: c, 8: d }) => [a, b, c, d].join("")
);
