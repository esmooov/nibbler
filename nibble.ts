import { isEqual } from "lodash"
import { Nibble, toInt, add, State, History, Bit, parseProgram, rawState, defaultResult} from "./utils"

export const runNibblers = (rawProgramA: string, rawProgramB: string) => {

  const rows = Array.from(Array(32).keys())
  const programA = parseProgram(rawProgramA)
  const programB = parseProgram(rawProgramB)

  const createAdderState = (program: ReturnType<typeof parseProgram>, nibble: Nibble, otherNibble?: Nibble): Omit<State, "loop"> => {
    const result = program ? program(nibble, otherNibble) : defaultResult
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

  const initialHistoryA: History = [{...createAdderState(programA, [0,0,0,0], [0,0,0,0]), loop: false}]
  const initialHistoryB: History = [{...createAdderState(programB, [0,0,0,0], [0,0,0,0]), loop: false}]

  return rows.reduce(([currentHistoryA, currentHistoryB]): [History,History] => {
    const dataA = currentHistoryA.slice(-1)[0]
    const dataB = currentHistoryB.slice(-1)[0] 

    const newNibbleA = getNextNibble(dataA)
    const newNibbleB = getNextNibble(dataB)

    const newStateA = createAdderState(programA, newNibbleA, newNibbleB)
    const newStateB = createAdderState(programB, newNibbleB, newNibbleA)

    dataA.carry = newStateA.n < dataA.n ? 1 : 0
    dataB.carry = newStateB.n < dataB.n ? 1 : 0

    const loopA = currentHistoryA.some(state => isEqual(rawState(state), newStateA))
    const loopB = currentHistoryB.some(state => isEqual(rawState(state), newStateB))

    currentHistoryA.push({...newStateA, loop: loopA}) 
    currentHistoryB.push({...newStateB, loop: loopB}) 

    return [currentHistoryA, currentHistoryB]
  }, [initialHistoryA,initialHistoryB])

}