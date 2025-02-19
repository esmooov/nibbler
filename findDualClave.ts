import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { Bit, BitIndex, digit, runNibblers, toInt, toNibble } from "./simulate";
import {
  add,
  and,
  between,
  bit,
  BitCalculator,
  choice,
  complement,
  constant,
  gateToTrigger,
  GT,
  makePolyrhythmFn,
  makeProgram,
  mapBits,
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
import {
  analyze,
  displayCount,
  printAnalysis,
  processTest,
  processTestSet,
} from "./analyze";
import { meta } from "./meta";
import {
  allMasks,
  bits,
  fuzz,
  fuzz2,
  masksToBitmap,
  oneMasks,
  range,
  twoMasks,
} from "./testUtils";

const args = yargs(hideBin(process.argv)).string("test").parse();

const analyses = {};

let on = 0;
const everyOther: BitCalculator = ({ carryA }) => {
  if (carryA === 1) {
    on = on ^ 1;
    return (carryA ^ on) as Bit;
  } else {
    return 0;
  }
};
everyOther.description = "Every other carry bit";

const execute = (program: Program, testName: string, totalRuns: number) => {
  const state = runNibblers(program, args["iterations"]);
  const test = processTest(testName);
  // TODO: fix looping tests
  test.testName = testName;
  const analysis = analyze(state, test, program, args);
  if (!analyses[testName]) analyses[testName] = [];
  if (
    analysis.inAny &&
    (analysis.loopMatchesStrictLength || !args["strictLength"])
  ) {
    analyses[testName].push(analysis);
  }
  printAnalysis(analysis, program, args, totalRuns);
};

let tests = (args["test"] || "").split(",");
if (args["testSet"]) tests = processTestSet(args["testSet"]);
console.log(tests);
// fuzz(
//   {
//     b: range(0, 15),
//     c: range(0, 15),
//     bitA: bits,
//     test: tests,
//   },
//   (vars) => {
//     const { b, c, bitA, test } = vars;
//     const program = makeProgram(
//       add(other()),
//       constant(choice(x(bitA), add(b), add(c))),
//       vars,
//       {}
//     );
//     execute(program, test);
//   }
// );
fuzz2(
  {
    mapA: [{ "1": 4, "2": 0, "4": 0, "8": 8 }],
    mapB: [{ "1": 0, "2": 4, "4": 8, "8": 0 }],
    a: range(5, 5),
    b: range(0, 15),
    test: tests,
  },
  (vars, totalRuns) => {
    const { a, b, mapA, mapB, test } = vars;
    const program = makeProgram(mapBits(mapA, a), mapBits(mapB, b), vars, {
      auxTransformer: ({ carryA }) => carryA,
      auxPostProcess: gateToTrigger,
    });
    execute(program, test, totalRuns);
  }
);

// TODO: each update describes how to set add AND
// how to update nibble

// CANONICAL WORLD RHYTHM: DO NOT CHANGE
// fuzz(
//   {
//     a: range(11, 11),
//     b: range(3, 3),
//     c: range(0, 15),
//     bitA: [4],
//     bitB: [8],
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
