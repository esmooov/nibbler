import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { Program, runNibblers } from "./simulate";
import { add, and, choice, constant, makeProgram, other, x } from "./program";
import { analyze, printAnalysis, processTest } from "./analyze";

const bits = [1, 2, 4, 8];

const args = yargs(hideBin(process.argv)).parse();

const execute = (program: Program) => {
  const state = runNibblers(program);
  const test = processTest(args["test"]);
  const analysis = analyze(state, test);
  printAnalysis(analysis, program, args);
};

// for (let a = -15; a < 16; a++) {
//   for (let b = -15; b < 16; b++) {
//     for (let c = -15; c < 16; c++) {
//         const programA = `CHOICE CX[] ${a} ${b}`
//         const programB = `CONSTANT ${c}`
//         execute(programA, programB)
//     }
//   }
// }

// for (let a = 0; a < 16; a++) {
//   for (let b = 0; b < 16; b++) {
//     for (let c = 0; c < 16; c++) {
//       bits.forEach((bitA,i) => {
//         bits.forEach(bitB => {

// prettier-ignore
// const program = makeProgram(
//   choice(
//     and(x(4), x(8)),
//     add(11),
//     add(3)
//   ),
//   constant(
//     add(7)
//   )
// )
const program = makeProgram(
  constant(
    add(other())
  ),
  constant(
    add(7)
  )
)
execute(program);

//         })
//       })
//     }
//   }
// }

// for (let a = -15; a < 16; a++) {
//   for (let b = -15; b < 16; b++) {
//     bits.forEach(bitA => {
//       const programA = `CHOICE XOR[x${bitA}] SHIFT[x${bitA}] ${a}`
//       const programB = `CONSTANT ${b}`
//       execute(programA, programB)
//     })
//   }
// }

// for (let a = -15; a < 16; a++) {
//   for (let b = -15; b < 16; b++) {
//     const cleanA = a < 0 ? a : `+${a}`
//     const cleanB = b < 0 ? b : `+${b}`
//     bits.forEach(ba => {
//       const program = `CHOICE *${ba} ${cleanA} ${cleanB}`
//       execute(program)
//     })
//   }
// }

// for (let a = -15; a < 16; a++) {
//   for (let b = -15; b < 16; b++) {
//     const cleanA = a < 0 ? a : `+${a}`
//     const cleanB = b < 0 ? b : `+${b}`
//       const program = `CHOICE EVEN[] ${cleanA} ${cleanB}`
//       execute(program)
//   }
// }

// bits.forEach(ba => {
//   bits.forEach(bb => {
//     const program = `CHOICE XOR[*${ba},*${bb}] ${ba} ${bb}`
//     execute(program)
//   })
// })

// bits.forEach(ba => {
//   bits.forEach(bb => {
//     bits.forEach(bc => {
//       bits.forEach(bd => {
//         const program = `CHOICE OR[*${ba},*${bb}] SHIFT[*${bc}] SHIFT[*${bd}]`
//         execute(program)
//       })
//     })
//   })
// })

// for (let a = -15; a < 16; a++) {

//   const cleanA = a < 0 ? a : `+${a}`
//   bits.forEach(ba => {
//     bits.forEach(bb => {
//       bits.forEach(bc => {
//         const program = `CHOICE AND[*${ba},*${bb}] ${cleanA} SHIFT[*${bc}]`
//         execute(program)
//       })
//     })
//   })
// }

// for (let a = -15; a < 16; a++) {
//   for (let b = -15; b < 16; b++) {
//     const cleanA = a < 0 ? a : `+${a}`
//     const cleanB = b < 0 ? b : `+${b}`
//     for (let c = 0; c < 16; c++) {
//       const program = `CHOICE GTE[+${c}] ${cleanA} ${cleanB}`
//       execute(program)
//     }
//   }
// }
