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
fuzz(
  {
    // a: range(0, 15),
    // c: range(0, 15),
    // bitA: bits,
    // bitB: bits,
    test: tests,
  },
  (vars) => {
    // const { a, c, bitA, bitB, test } = vars;
    const { test } = vars;
    const program = makeProgram(
      constant(add(not(other()))),
      constant(add(5)),
      vars
    );
    execute(program, test);
  }
);

// CANON: DO NOT CHANGE
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

const matches = meta(analyses, args["matchThreshold"], args["skipTwos"]);
matches.forEach((match) => displayCount(match, args["skipTwos"]));
