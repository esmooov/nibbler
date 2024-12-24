import { isEqual, omit } from "lodash"
import { Nibble, toInt, add, digit, displayTable, Result, State, History } from "./utils"



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

  
const createAdderState = (nibble: Nibble): Omit<State, "loop"> => {
  const result = testNibble(nibble) 
  return {
    ...result,
    nibble,
    n: toInt(nibble),
  }
}

const getNextNibble = (data: State): Nibble => {
  if (data.operation === "ADD") {
    return add(data.nibble,data.argument)
  }

  throw `Invalid operation ${data.operation}`
}

const initialHistory: History = [{...createAdderState([0,0,0,0]), loop: false}]

const rawState = state => omit(state, "loop")

const output = rows.reduce((currentHistory: History): History => {
  const data = currentHistory.slice(-1)[0]
  const newNibble = getNextNibble(data)
  const newState = createAdderState(newNibble)
  const loop = currentHistory.some(state => rawState(state), newState)
  currentHistory.push({...newState, loop}) 

  return currentHistory
}, initialHistory)
console.log("")
console.log(`When taking the ${mode}`)
console.log(`  if ON add ${addOn}`)
console.log(`  if OFF add ${addOff} `)
console.log(output)
const firstLoopIdx = output.findIndex(o => o.loop) 
const firstLoopState = output[firstLoopIdx]
const firstMatchedIdx = output.findIndex(h => isEqual(rawState(h), rawState(firstLoopState)))
const preHistory = output.slice(0,firstMatchedIdx)
const mainHistory = output.slice(firstMatchedIdx, firstLoopIdx)
if (preHistory.length) {
  displayTable(preHistory)
  console.log("--------------------------------------")
}
displayTable(mainHistory)
