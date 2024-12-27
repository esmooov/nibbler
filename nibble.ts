import { isEqual } from "lodash"
import { Nibble, Program } from "./simulate"

export const runNibblers = (program: Program) => {

  const rows = Array.from(Array(32).keys())
  const nibbleA: Nibble = [0,0,0,0]
  const nibbleB: Nibble = [0,0,0,0]

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