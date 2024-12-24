import { isEqual, omit } from "lodash"
import { Nibble, toInt, add, digit, displayTable, Result, State, History, processSimpleLogic, Bit } from "./utils"



const rows = Array.from(Array(32).keys())


const args = process.argv.slice(2)
const mode = args[0]
const addOn = args[1]
const addOff = args[2]
const addSpecial = args[3]


const testNibble = (nibble: Nibble): Result => {
  const match = mode.match(/(\w+)\[((\d,?)+)\]/)
  if (!match) return {out: 1, operation: "ADD", argument: Number(addOn)}
  const method = match[1]
  const data = match[2].split(",")
  if (method === "AND") {
    const isOn = data.every(d => digit(nibble,d) === 1) 
    return processSimpleLogic(nibble, isOn, addOn, addOff)
  } else if (method === "OR") {
    const isOn = data.some(d => digit(nibble,d) === 1)
    return processSimpleLogic(nibble, isOn, addOn, addOff)
  } else if (method === "XOR") {
    const onBits = data.filter(d => digit(nibble,d) === 1)
    const isOn = (onBits.length & 1) === 1
    return processSimpleLogic(nibble, isOn, addOn, addOff)
  }

  return {out: 1, operation: "ADD", argument: Number(addOn)}
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
  } else if (data.operation === "SHIFT") {
    return [data.argument as Bit, data.nibble[0], data.nibble[1], data.nibble[2]]
  }

  throw `Invalid operation ${data.operation}`
}

const initialHistory: History = [{...createAdderState([0,0,0,0]), loop: false}]

const rawState = state => omit(state, "loop", "carry")
const statesAreEqual = (a: State, b: State) => isEqual(rawState(a), rawState(b))

const output = rows.reduce((currentHistory: History): History => {
  const data = currentHistory.slice(-1)[0]
  const newNibble = getNextNibble(data)
  const newState = createAdderState(newNibble)
  data.carry = newState.n < data.n ? 1 : 0
  const loop = currentHistory.some(state => isEqual(rawState(state), newState))
  currentHistory.push({...newState, loop}) 

  return currentHistory
}, initialHistory)
console.log("")
console.log(`When taking the ${mode}`)
console.log(`  if ON add ${addOn}`)
console.log(`  if OFF add ${addOff} `)
const firstLoopIdx = output.findIndex(o => o.loop) 
const firstLoopState = output[firstLoopIdx]
const firstMatchedIdx = output.findIndex(h => statesAreEqual(h, firstLoopState))
const preHistory = output.slice(0,firstMatchedIdx)
const mainHistory = output.slice(firstMatchedIdx, firstLoopIdx)
if (preHistory.length) {
  displayTable(preHistory)
  console.log("--------------------------------------")
}
displayTable(mainHistory)
