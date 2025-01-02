import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { Bit, BitIndex, runNibblers, toNibble } from "./simulate";
import {
  add,
  and,
  between,
  BitCalculator,
  choice,
  complement,
  constant,
  GT,
  makeProgram,
  mapOtherBits,
  n,
  nibble,
  not,
  or,
  other,
  own,
  Program,
  shift,
  twosComplement,
  x,
  xor,
} from "./program";
import { analyze, displayCount, printAnalysis, processTest } from "./analyze";
import { meta } from "./meta";
import { bits, fuzz, range } from "./testUtils";

const args = yargs(hideBin(process.argv)).string("test").parse();

const analyses = {};

const execute = (program: Program, testName: string) => {
  const state = runNibblers(program, args["iterations"]);
  const test = processTest(testName);
  test.testName = testName;
  const analysis = analyze(state, test, program.vars, args);
  if (!analyses[testName]) analyses[testName] = [];
  const loopMatchesStrictLength =
    !args["strictLength"] || args["strictLength"] === analysis.loopLength;
  if (analysis.inAny && loopMatchesStrictLength) {
    analyses[testName].push(analysis);
  }
  printAnalysis(analysis, program, args);
};

const tests = (args["test"] || "").split(",");
console.log(tests);
// fuzz(
//   {
//     a: range(5, 5),
//     c: range(13, 13),
//     test: tests,
//   },
//   (vars) => {
//     const { a, c, test } = vars;
//     const program = makeProgram(
//       choice(between(own(), a - 1, c), add(a), add(add(twosComplement(c), a))),
//       constant(nibble(c)),
//       vars
//     );
//     execute(program, test);
//   }
// );

// CANONICAL WORLD RHYTHM: DO NOT CHANGE
fuzz(
  {
    c: range(0, 15),
    test: tests,
  },
  (vars) => {
    const { c, test } = vars;
    const program = makeProgram(
      choice(and(x(4), x(8)), add(11), add(3)),
      constant(add(c)),
      vars
    );
    execute(program, test);
  }
);

// CANONICAL EUCLIDEAN
// fuzz(
//   {
//     a: range(0, 15),
//     c: range(0, 15),
//     test: tests,
//   },
//   (vars) => {
//     const { a, c, test } = vars;
//     const program = makeProgram(
//       choice(GT(own(), c - a), add(add(twosComplement(c), a)), add(a)),
//       constant(nibble(c)),
//       vars
//     );
//     execute(program, test);
//   }
// );
console.log("Beginning matching");
const matches = meta(analyses, args["matchThreshold"], args["skipTwos"]);
matches.forEach((match) => displayCount(match, args["skipTwos"]));
