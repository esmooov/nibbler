import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { BitIndex, runNibblers, toNibble } from "./simulate";
import {
  add,
  and,
  choice,
  constant,
  makeProgram,
  nibble,
  not,
  or,
  other,
  own,
  Program,
  x,
  xor,
} from "./program";
import { analyze, displayCount, printAnalysis, processTest } from "./analyze";
import { meta } from "./meta";

const bits: Array<BitIndex> = [1, 2, 4, 8];

const args = yargs(hideBin(process.argv)).string("test").parse();

const analyses = {};

const execute = (program: Program, testName: string) => {
  const state = runNibblers(program, args["iterations"]);
  const test = processTest(testName);
  const analysis = analyze(state, test, program.vars);
  if (!analyses[testName]) analyses[testName] = [];
  if (analysis.inAny) {
    analyses[testName].push(analysis);
  }
  printAnalysis(analysis, program, args);
};

const tests = (args["test"] || "").split(",");
tests.forEach((test) => {
  console.log(`TEST ${test}:`);
  // for (let a = 0; a < 16; a++) {
  //   for (let b = 0; b < 16; b++) {
  //     for (let c = 0; c < 16; c++) {
  //       bits.forEach((bitA) => {
  //         bits.forEach((bitB) => {
  //           const program = makeProgram(
  //             choice(and(x(bitA), x(bitB)), add(a), add(b)),
  //             constant(add(c)),
  //             {
  //               a,
  //               b,
  //               c,
  //               bitA,
  //               bitB,
  //             }
  //           );
  //           execute(program, test);
  //         });
  //       });
  //     }
  //   }
  // }
  for (let a = 0; a < 16; a++) {
    for (let b = 0; b < 16; b++) {
      for (let c = 0; c < 16; c++) {
        for (let d = 0; d < 16; d++) {
          bits.forEach((bitA) => {
            bits.forEach((bitB) => {
              const program = makeProgram(
                choice(xor(x(bitA), x(bitB)), add(a), add(b)),
                choice(xor(x(bitA), x(bitB)), add(c), add(d)),
                {
                  a,
                  b,
                  c,
                  d,
                  bitA,
                  bitB,
                }
              );
              execute(program, test);
            });
          });
        }
      }
    }
  }

  console.log("");
});

const matches = meta(analyses, args["matchThreshold"], args["skipTwos"]);
matches.forEach((match) => displayCount(match, args["skipTwos"]));
