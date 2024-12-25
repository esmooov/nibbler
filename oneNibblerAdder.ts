import yargs from "yargs"
import {hideBin} from "yargs/helpers"
import { printProgram} from "./utils"
import { runSingleNibbler } from "./singleNibble"
import { analyze } from "./analyze"


const args = yargs(hideBin(process.argv)).string("on").string("off").parse()

const rawProgram = args["program"] || args["p"]

const history = runSingleNibbler(rawProgram)

printProgram(rawProgram, history)

const analysis = analyze(history, (queue) => !!queue.join("").match(/101011010101001/))

console.log(analysis)
