import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { Bit, BitIndex, runNibblers, toNibble } from "./simulate";
import {
  add,
  and,
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
  const analysis = analyze(state, test, program.vars, args);
  if (!analyses[testName]) analyses[testName] = [];
  if (analysis.inAny) {
    analyses[testName].push(analysis);
  }
  printAnalysis(analysis, program, args);
};

const tests = (args["test"] || "").split(",");
console.log(tests);
// fuzz(
//   {
//     a: range(0, 15),
//     b: range(0, 15),
//     c: range(0, 15),
//     d: range(0, 15),
//     o: range(0, 15),
//     test: tests,
//   },
//   (vars) => {
//     const { a, b, c, d, o, test } = vars;
//     const program = makeProgram(
//       mapOtherBits({ 1: a, 2: b, 4: c, 8: d }),
//       constant(add(o)),
//       vars
//     );
//     execute(program, test);
//   }
// );

// CANON: DO NOT CHANGE
fuzz(
  {
    a: range(0, 15),
    b: range(0, 15),
    c: range(0, 15),
    bitA: bits,
    bitB: bits,
    test: tests,
  },
  (vars) => {
    const { a, b, c, bitA, bitB, test } = vars;
    const program = makeProgram(
      choice(and(x(bitA), x(bitB)), add(a), add(b)),
      constant(add(c)),
      vars
    );
    execute(program, test);
  }
);

const matches = meta(analyses, args["matchThreshold"], args["skipTwos"]);
matches.forEach((match) => displayCount(match, args["skipTwos"]));
