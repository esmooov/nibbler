import yargs from "yargs"
import {hideBin} from "yargs/helpers"
import { printProgram} from "./utils"
import { runSingleNibbler } from "./singleNibble"
import { analyze, checkForBossa, checkForGahu, checkForRumbaClave, checkForShiko, checkForSonClave, checkForSoukous } from "./analyze"
import { omit, pickBy } from "lodash"
import { runNibblers } from "./nibble"

const bits = [1,2,4,8]

const args = yargs(hideBin(process.argv)).parse()
const test = (queue) => !!queue.join("").match(args["test"]) 

const execute = (programA: string, programB: string) => {
  const [historyA, historyB] = runNibblers(programA, programB)
  const analysisA = analyze(historyA, historyB, test)
  const analysisB = analyze(historyB, null, test)

  if (analysisA.inAny && (!args["strictLength"] || args["strictLength"] === analysisA.loopLength)) {
    printProgram(analysisA, programA, args["short"])
    printProgram(analysisB, programB, args["short"])

    const tests = omit(analysisA, "preHistory", "mainHistory", "andcarries", "orcarries", "xorcarries")
    if (args["shortest"]) {
      console.log(pickBy(tests, (value) => value))
    } else {
      console.log(tests)
    }
  }
}

// for (let a = -15; a < 16; a++) {
//   for (let b = -15; b < 16; b++) {
//     for (let c = -15; c < 16; c++) {
//         const programA = `CHOICE CX[] ${a} ${b}`
//         const programB = `CONSTANT ${c}`
//         execute(programA, programB)
//     }
//   }
// }

for (let a = 0; a < 16; a++) {
  for (let b = 0; b < 16; b++) {
    for (let c = 0; c < 16; c++) {
      bits.forEach((bitA,i) => {
        bits.forEach(bitB => {
            const programA = `CHOICE AND[x${bitA},x${bitB}] ${a} ${b}`
            const programB = `CONSTANT ${c}`
            execute(programA, programB)
        })
      })
    }
  }
}

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