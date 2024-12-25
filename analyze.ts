import { Bit, History, statesAreEqual } from "./utils";

export const checkForSonClave = (queue: Array<Bit>): boolean => {
  return !!queue.join("").match(/1001001000101000/)
} 

export const checkForRumbaClave = (queue: Array<Bit>): boolean => {
  return !!queue.join("").match(/1001000100101000/)
} 

export const checkForShiko = (queue: Array<Bit>): boolean => {
  return !!queue.join("").match(/1000101000101000/)
} 

export const checkForSoukous = (queue: Array<Bit>): boolean => {
  return !!queue.join("").match(/1001001000110000/)
} 

export const checkForBossa = (queue: Array<Bit>): boolean => {
  return !!queue.join("").match(/1001001000100100/)
} 

export const checkForGahu = (queue: Array<Bit>): boolean => {
  return !!queue.join("").match(/1001001000100010/)
} 

export const analyze = (history: History, test: (queue: Array<Bit>) => boolean) => {
  const firstLoopIdx = history.findIndex(o => o.loop) 
  const firstLoopState = history[firstLoopIdx]
  const firstMatchedIdx = history.findIndex(h => statesAreEqual(h, firstLoopState))
  const preHistory = history.slice(0,firstMatchedIdx)
  const mainHistory = history.slice(firstMatchedIdx, firstLoopIdx)

  const oneBits = history.map(h => h.nibble[0])
  const twoBits = history.map(h => h.nibble[1])
  const fourBits = history.map(h => h.nibble[2])
  const eightBits = history.map(h => h.nibble[3])
  const carries = history.map(h => (h.carry || 0) as Bit)
  const outs = history.map(h => h.out)

  const inOnes = test(oneBits)
  const inTwos = test(twoBits)
  const inFours = test(fourBits)
  const inEights = test(eightBits)
  const inCarries = test(carries)
  const inOuts = test(outs)

  return {
    inOnes,
    inTwos,
    inFours,
    inEights,
    inCarries,
    inOuts,
    inAny: inOnes || inTwos || inFours || inEights || inCarries || inOuts,
    preHistory,
    mainHistory,
    loopLength: mainHistory.length,
  }
}

export type Analysis = ReturnType<typeof analyze>