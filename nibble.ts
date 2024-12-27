import { isEqual } from "lodash"
import { Nibble, toInt, add, State, History, Bit, parseProgram, rawState, defaultResult} from "./utils"

export const runNibblers = (rawProgramA: string, rawProgramB: string) => {

  const rows = Array.from(Array(32).keys())
  const programA = parseProgram(rawProgramA)
  const programB = parseProgram(rawProgramB)

  const createAdderState = (program: ReturnType<typeof parseProgram>, nibble: Nibble, otherNibble: Nibble, oldA: number, oldB: number): Omit<State, "loop"> => {
    const result = program ? program(nibble, otherNibble, oldA, oldB) : defaultResult
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

  const initialHistoryA: History = [{...createAdderState(programA, [0,0,0,0], [0,0,0,0], 0, 0), loop: false}]
  const initialHistoryB: History = [{...createAdderState(programB, [0,0,0,0], [0,0,0,0], 0, 0), loop: false}]

  return rows.reduce(([currentHistoryA, currentHistoryB]): [History,History] => {
    const dataA = currentHistoryA.slice(-1)[0]
    const dataB = currentHistoryB.slice(-1)[0] 

    const newNibbleA = getNextNibble(dataA)
    const newNibbleB = getNextNibble(dataB)

    const newStateA = createAdderState(programA, newNibbleA, newNibbleB, dataA.n, dataB.n)
    const newStateB = createAdderState(programB, newNibbleB, newNibbleA, dataA.n, dataB.n)

    dataA.carry = newStateA.n < dataA.n ? 1 : 0
    dataB.carry = newStateB.n < dataB.n ? 1 : 0

    const loop = currentHistoryA.some((stateA, i) => {
       const matchA = isEqual(rawState(stateA), newStateA);
       const matchB = isEqual(rawState(currentHistoryB[i]), newStateB)
       return matchA && matchB
    })

    currentHistoryA.push({...newStateA, loop}) 
    currentHistoryB.push({...newStateB, loop}) 

    return [currentHistoryA, currentHistoryB]
  }, [initialHistoryA,initialHistoryB])

}