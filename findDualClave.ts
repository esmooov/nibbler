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
import { analyze, printAnalysis, processTest } from "./analyze";

const bits: Array<BitIndex> = [1, 2, 4, 8];

const args = yargs(hideBin(process.argv)).string("test").parse();

const execute = (program: Program, testName: string) => {
  const state = runNibblers(program, args["iterations"]);
  const test = processTest(testName);
  const analysis = analyze(state, test);
  printAnalysis(analysis, program, args);
};

// for (let a = 0; a < 16; a++) {
//   for (let b = 0; b < 16; b++) {
//     for (let c = 0; c < 16; c++) {
//       bits.forEach((bitA, i) => {
//         bits.forEach((bitB) => {
//           const program = makeProgram(
//             choice(and(x(bitA), x(bitB)), xor(other(), nibble(a)), add(b)),
//             constant(add(c)),
//             {
//               a,
//               b,
//               c,
//               bitA,
//               bitB,
//             }
//           );
//           execute(program);
//         });
//       });
//     }
//   }
// }

const tests = args["test"] || "";

tests.split(",").forEach((test) => {
  console.log(`TEST ${test}:`);
  for (let a = 0; a < 16; a++) {
    const program = makeProgram(
      choice(and(x(4), x(8)), add(11), add(3)),
      constant(add(a)),
      {
        a,
      }
    );
    execute(program, test);
  }
  console.log("");
});
