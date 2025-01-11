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
import { analyze, displayCount, printAnalysis, processTest, processTestSet } from "./analyze";
import { meta } from "./meta";
import { bits, fuzz, range } from "./testUtils";

const args = yargs(hideBin(process.argv)).string("test").parse();

const analyses = {};

let on = 0
const everyOther: BitCalculator = ({ carryA }) => {
  if (carryA === 1) {
    on = on ^ 1
    return (carryA ^ on) as Bit
  } else {
    return 0
  }
}
everyOther.description = "Every other carry bit"

const execute = (program: Program, testName: string) => {
  const state = runNibblers(program, args["iterations"]);
  const test = processTest(testName);
  // TODO: fix looping tests
  test.testName = testName;
  const analysis = analyze(state, test, program.vars, args);
  if (!analyses[testName]) analyses[testName] = [];
  if (analysis.inAny && (analysis.loopMatchesStrictLength || !args["strictLength"])) {
    analyses[testName].push(analysis);
  }
  printAnalysis(analysis, program, args);
};

let tests = (args["test"] || "").split(",");
if (args["testSet"]) tests = processTestSet(args["testSet"])
console.log(tests);
fuzz(
  {
    bitA: bits,
    test: tests,
  },
  (vars) => {
    const { bitA, test } = vars;
    const program = makeProgram(
      choice(n(bitA), add(1), add(9)),
      constant(add(0)),
      vars,
    );
    execute(program, test);
  }
);

// CANONICAL WORLD RHYTHM: DO NOT CHANGE
// fuzz(
//   {
//     a: range(0, 15),
//     b: range(0, 15),
//     c: range(0, 15),
//     bitA: bits,
//     bitB: bits,
//     test: tests,
//   },
//   (vars) => {
//     const { a, b, c, bitA, bitB, test } = vars;
//     const program = makeProgram(
//       choice(and(x(bitA), x(bitB)), add(a), add(b)),
//       constant(add(c)),
//       vars
//     );
//     execute(program, test);
//   }
// );

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
const matches = meta(analyses, args["matchThreshold"], args["strictSetMatch"]);
matches.forEach((match) => displayCount(match, args["strictSetMatch"]));
