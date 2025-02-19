import { flatten, isEqual, omit, sortBy, without, zip } from "lodash";
import { Analysis, Vars } from "./analyze";

type Matches = Record<string, Array<Vars>>;
export type Count = {
  vars: Vars;
  matchingOneOffs: Matches;
  matchingTwoOffs: Matches;
};

export const meta = (
  analyses: Record<string, Array<Analysis>>,
  matchThreshold: number = 1,
  strictSetMatch: boolean = false
) => {
  const rawTests = Object.keys(analyses);
  const tests = sortBy(rawTests, (t) => analyses[t].length);
  const totalTests = tests.length;

  const counts = tests.reduce((oldCounts, test, i) => {
    console.log("Match test: ", test, ". Analyses: ", analyses[test].length);
    if (i > 0 && matchThreshold === totalTests - 1) {
      return oldCounts;
    }
    const otherTests = without(tests, test);
    const currentAnalyses = analyses[test];
    const newCounts = currentAnalyses.reduce((counts, analysis) => {
      const [oneMatches, twoMatches] = otherTests.reduce(
        ([oneMatches, twoMatches], otherTest, ii) => {
          // TODO if you ever fail to match, give up
          const otherAnalyses = analyses[otherTest];
          const [newOneVars, newTwoVars] = otherAnalyses.reduce(
            ([oneVars, twoVars], otherAnalysis) => {
              const [withinOne, withinTwo] = calculateNearness(
                analysis,
                otherAnalysis
              );
              if (withinOne) process.stdout.write(".");
              if (withinOne) oneVars.push(otherAnalysis.vars);
              if (withinTwo) twoVars.push(otherAnalysis.vars);
              return [oneVars, twoVars];
            },
            [[], []] as [Array<Vars>, Array<Vars>]
          );
          oneMatches[otherTest] = newOneVars;
          twoMatches[otherTest] = newTwoVars;
          return [oneMatches, twoMatches];
        },
        [{}, {}] as [Matches, Matches]
      );
      counts.push({
        vars: analysis.vars,
        matchingOneOffs: oneMatches,
        matchingTwoOffs: twoMatches,
      });
      return counts;
    }, [] as Array<Count>);
    return [...oldCounts, ...newCounts];
  }, [] as Array<Count>);
  return filterByThreshold(counts, matchThreshold, strictSetMatch);
};

export const mapToValues = (
  map: Record<string, number>,
  filterZeros: boolean = false
): Array<string | number> => {
  const entries = filterZeros
    ? Object.entries(map).filter(([_k, v]) => v != 0)
    : Object.entries(map);
  return flatten(sortBy(entries, ([k, _v]) => k));
};

const calculateNearness = (a: Analysis, b: Analysis): [boolean, boolean] => {
  const rawAVars = Object.values(omit(a.vars, "test"));
  const rawBVars = Object.values(omit(b.vars, "test"));
  if (rawAVars.length === 0 || rawBVars.length === 0) return [false, false];
  const expandedAVars = flatten(
    rawAVars.map((a) => (typeof a === "object" ? mapToValues(a) : a))
  );
  const expandedBVars = flatten(
    rawBVars.map((b) => (typeof b === "object" ? mapToValues(b) : b))
  );

  const varPairs = zip(expandedAVars, expandedBVars);
  const matches = varPairs.filter(([a, b]) => isEqual(a, b));
  const totalVars = varPairs.length;
  const withinOne = matches.length >= totalVars - 1;
  const withinTwo = matches.length >= totalVars - 2;
  return [withinOne, withinTwo];
};

const filterByThreshold = (
  counts: Array<Count>,
  matchThreshold: number,
  strictSetMatch: boolean
) => {
  return counts.filter((count) => {
    const numberOfOneOffs = Object.values(count.matchingOneOffs).filter(
      (offs) => offs.length > 0
    );
    const numberOfTwoOffs = Object.values(count.matchingTwoOffs).filter(
      (offs) => offs.length > 0
    );
    if (strictSetMatch) {
      const passesThreshold = numberOfOneOffs.length >= matchThreshold;
      if (!passesThreshold) return false;
      const varOffs = Object.entries(count.matchingOneOffs).map(
        ([test, varArrays]) => {
          const diffs: Array<string> = [];
          varArrays.forEach((vars) => {
            const diff = findDifferentVar(count.vars, vars);
            if (diff) diffs.push(diff);
          });
          return diffs;
        }
      );
      return varOffs[0].some((v) => varOffs.every((offs) => offs.includes(v)));
    }

    return (
      numberOfOneOffs.length >= matchThreshold ||
      numberOfTwoOffs.length >= matchThreshold
    );
  });
};

const findDifferentVar = (a: Vars, b: Vars) => {
  return Object.keys(a).find((key) => b[key] !== a[key]);
};
