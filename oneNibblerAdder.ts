import { isEqual, omit } from "lodash"
import { Nibble, toInt, add, displayTable, Result, State, History, Bit, decodeArgument} from "./utils"



const rows = Array.from(Array(32).keys())


const args = process.argv.slice(2)
const program = args[0]
const aValue = args[1]
const bValue = args[2]


const testNibble = (nibble: Nibble): Result => {

  const {value: onValue, operation: onOperation} = decodeArgument(aValue, nibble) 
  const {value: offValue, operation: offOperation} = decodeArgument(bValue, nibble) 
  const {value: programValue} = decodeArgument(program, nibble) 
  const isOn = programValue === 0 ? false : true
  
  if (isOn) {
    return {
      out: 1,
      operation: onOperation || "ADD",
      argument: onValue
    }
  }

  return {
    out: 0,
    operation: offOperation || "ADD",
    argument: offValue
  }

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
console.log(`When taking the ${program}`)
console.log(`  if ON ${aValue}`)
console.log(`  if OFF ${bValue}`)
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
