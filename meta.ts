import { without, zip } from "lodash";
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
  skipTwos: boolean = false
) => {
  const tests = Object.keys(analyses);
  const counts = tests.reduce((oldCounts, test) => {
    const otherTests = without(tests, test);
    const currentAnalyses = analyses[test];
    const newCounts = currentAnalyses.reduce((counts, analysis) => {
      const [oneMatches, twoMatches] = otherTests.reduce(
        ([oneMatches, twoMatches], otherTest) => {
          const otherAnalyses = analyses[otherTest];
          const [newOneVars, newTwoVars] = otherAnalyses.reduce(
            ([oneVars, twoVars], otherAnalysis) => {
              const [withinOne, withinTwo] = calculateNearness(
                analysis,
                otherAnalysis
              );
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
  return filterByThreshold(counts, matchThreshold, skipTwos);
};

const calculateNearness = (a: Analysis, b: Analysis): [boolean, boolean] => {
  const rawAVars = Object.values(a.vars);
  const rawBVars = Object.values(b.vars);

  if (rawAVars.length === 0 || rawBVars.length === 0) return [false, false];
  const varPairs = zip(rawAVars, rawBVars);
  const matches = varPairs.filter(([a, b]) => a === b);
  const totalVars = varPairs.length;
  const withinOne = matches.length >= totalVars - 1;
  const withinTwo = matches.length >= totalVars - 2;
  return [withinOne, withinTwo];
};

const filterByThreshold = (
  counts: Array<Count>,
  matchThreshold: number,
  skipTwos: boolean
) => {
  return counts.filter((count) => {
    const numberOfOneOffs = Object.values(count.matchingOneOffs).filter(
      (offs) => offs.length > 0
    );
    const numberOfTwoOffs = Object.values(count.matchingTwoOffs).filter(
      (offs) => offs.length > 0
    );
    if (skipTwos) return numberOfOneOffs.length >= matchThreshold;

    return (
      numberOfOneOffs.length >= matchThreshold ||
      numberOfTwoOffs.length >= matchThreshold
    );
  });
};
