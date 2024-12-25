import yargs from "yargs"
import {hideBin} from "yargs/helpers"
import { printProgram} from "./utils"
import { analyze } from "./analyze"
import { omit } from "lodash"
import { runNibblers } from "./nibble"


const args = yargs(hideBin(process.argv)).string("on").string("off").parse()

const rawProgramA = args["aProgram"] || args["a"]
const rawProgramB = args["bProgram"] || args["b"]

const [historyA, historyB] = runNibblers(rawProgramA, rawProgramB)
const test = args["test"] ? (queue) => !!queue.join("").match(args["test"]) : () => true

const analysisA = analyze(historyA, test)
const analysisB = analyze(historyB, test)

printProgram(analysisA, rawProgramA)
if (args["test"]) {
  const tests = omit(analysisA, "preHistory", "mainHistory")
  console.log(tests)
}

printProgram(analysisB, rawProgramB)

