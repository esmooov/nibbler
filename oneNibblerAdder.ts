import yargs from "yargs"
import {hideBin} from "yargs/helpers"
import { printProgram} from "./utils"
import { runSingleNibbler } from "./singleNibble"
import { analyze } from "./analyze"
import { omit } from "lodash"


const args = yargs(hideBin(process.argv)).string("on").string("off").parse()

const rawProgram = args["program"] || args["p"]

const history = runSingleNibbler(rawProgram)
const test = args["test"] ? (queue) => !!queue.join("").match(args["test"]) : () => true

const analysis = analyze(history, test)

printProgram(analysis, rawProgram)

if (args["test"]) {
  const tests = omit(analysis, "preHistory", "mainHistory")
  console.log(tests)
}
