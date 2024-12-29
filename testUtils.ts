import { Program } from "./program";
import { BitIndex } from "./simulate";

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
