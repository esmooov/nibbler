import { isEqual } from "lodash"
import { Nibble, State, toInt, add, getFormattedDigit, digit } from "./utils"



const rows = Array.from(Array(32).keys())


const args = process.argv.slice(2)
const mode = args[0]
const addOn = Number(args[1])
const addOff = Number(args[2])

const getEvalFn = () => {
  const match = mode.match(/(\w+)\[((\d,?)+)\]/)
  if (!match) return () => true
  const method = match[1]
  const data = match[2].split(",")
  if (method === "AND") {
    return (nibble) => {
      return data.every(d => digit(nibble,d) === 1)
    }
  }
}
  
const evalFn = getEvalFn()

const createAdderStateData = (nibble: Nibble): State["data"] => {
  return {
    nibblerNumber: nibble,
    addAmount: evalFn?.(nibble) ? addOn : addOff,
    n: toInt(nibble)
  }
}

const initialAdderState = {
  history: [{loop: false, data: createAdderStateData([0,0,0,0])}],
  data: createAdderStateData([0,0,0,0]),
  loop: false
}

const output = rows.reduce((m: State) => {
  const {history, data} = m
  const newNibble = add(data.n, data.addAmount)
  const newData = createAdderStateData(newNibble)
  const loop = history.some(h => isEqual(h.data, newData))
  const newEntry = {data: newData, loop}
  history.push(newEntry) 

  return {history, ...newEntry}
}, initialAdderState)

console.log("")
console.log(`When taking the ${mode}, if ON add ${addOn} if OFF add ${addOff} `)
const firstLoopIdx = output.history.findIndex(o => o.loop) 
const firstLoopState = output.history[firstLoopIdx]
const firstMatchedIdx = output.history.findIndex(h => isEqual(h.data, firstLoopState.data))
const preHistory = output.history.slice(0,firstMatchedIdx + 1)
const mainHistory = output.history.slice(firstMatchedIdx, firstLoopIdx)
if (preHistory.length) {
  preHistory.map(o => console.log(o.data))
  console.log("--------------------------------------")
}
mainHistory.map(o => console.log(o.data))
