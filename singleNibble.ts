import { isEqual } from "lodash"
import { Nibble, toInt, add, State, History, Bit, parseProgram, rawState} from "./utils"

export const runSingleNibbler = (rawProgram: string) => {

  const rows = Array.from(Array(32).keys())
  const program = parseProgram(rawProgram)
  const createAdderState = (nibble: Nibble): Omit<State, "loop"> => {
    const result = program(nibble) 
    return {
      ...result,
      nibble,
      n: toInt(nibble),
    }
  }

  const getNextNibble = (data: State): Nibble => {
    if (data.operation === "SHIFT") {
      return [data.argument as Bit, data.nibble[0], data.nibble[1], data.nibble[2]]
    }

    return add(data.nibble,data.argument)
  }

  const initialHistory: History = [{...createAdderState([0,0,0,0]), loop: false}]

  return rows.reduce((currentHistory: History): History => {
    const data = currentHistory.slice(-1)[0]
    const newNibble = getNextNibble(data)
    const newState = createAdderState(newNibble)
    data.carry = newState.n < data.n ? 1 : 0
    const loop = currentHistory.some(state => isEqual(rawState(state), newState))
    currentHistory.push({...newState, loop}) 

    return currentHistory
  }, initialHistory)
}