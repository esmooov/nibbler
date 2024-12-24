import { isEqual } from "lodash"
import { Nibble, State, toInt, add, getFormattedDigit, digit, displayTable, Result, Data } from "./utils"



const rows = Array.from(Array(32).keys())


const args = process.argv.slice(2)
const mode = args[0]
const addOn = Number(args[1])
const addOff = Number(args[2])
const addSpecial = Number(args[3])

const testNibble = (nibble: Nibble): Result => {
  const match = mode.match(/(\w+)\[((\d,?)+)\]/)
  if (!match) return {out: 1, operation: "ADD", argument: addOn}
  const method = match[1]
  const data = match[2].split(",")
  if (method === "AND") {
    const isOn = data.every(d => digit(nibble,d) === 1) 
    return {
      out: isOn ? 1 : 0, 
      operation: "ADD", 
      argument: isOn ? addOn : addOff
    }
  } else if (method === "OR") {
    const isOn = data.some(d => digit(nibble,d) === 1)
    return {
      out: isOn ? 1 : 0, 
      operation: "ADD", 
      argument: isOn ? addOn : addOff
    }
  }

  return {out: 1, operation: "ADD", argument: addOn}
}

  
const createAdderStateData = (nibble: Nibble): State["data"] => {
  const result = testNibble(nibble) 
  return {
    ...result,
    nibble,
    n: toInt(nibble),
  }
}

const getNextNibble = (data: Data): Nibble => {
  if (data.operation === "ADD") {
    return add(data.nibble,data.argument)
  }

  throw `Invalid operation ${data.operation}`
}

const firstDatum = createAdderStateData([0,0,0,0]) 
const initialAdderState: State = {
  history: [{loop: false, data: firstDatum}],
  data: firstDatum,
  loop: false,
}

const output = rows.reduce((m: State, i): State => {
  const {history, data} = m
  const newNibble = getNextNibble(data)
  const newData = createAdderStateData(newNibble)
  const loop = history.some(h => isEqual(h.data, newData))
  const newEntry = {data: newData, loop, i}
  history.push(newEntry) 

  return {history, ...newEntry}
}, initialAdderState)
console.log("")
console.log(`When taking the ${mode}`)
console.log(`  if ON add ${addOn}`)
console.log(`  if OFF add ${addOff} `)
const firstLoopIdx = output.history.findIndex(o => o.loop) 
const firstLoopState = output.history[firstLoopIdx]
const firstMatchedIdx = output.history.findIndex(h => isEqual(h.data, firstLoopState.data))
const preHistory = output.history.slice(0,firstMatchedIdx)
const mainHistory = output.history.slice(firstMatchedIdx, firstLoopIdx)
if (preHistory.length) {
  displayTable(preHistory)
  console.log("--------------------------------------")
}
displayTable(mainHistory)
