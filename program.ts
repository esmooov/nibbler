import { addBits, Bit, BitIndex, digit, Nibble, toBit, Update } from "./simulate"

type NibbleTransformer<T> = 
 { 
    (nibble: Nibble, otherNibble: Nibble): T,
    description?: string
 }

type PFunction<T> = (...args: any[]) => NibbleTransformer<T>

export const choice: PFunction<Update> = (test: NibbleTransformer<Bit>, left: NibbleTransformer<Nibble>, right: NibbleTransformer<Nibble>) => {
  return (nibble, otherNibble) => {
    const isOn = test(nibble, otherNibble) === 1
    const chosenOperation = isOn ? left : right
    return {
      value: left(nibble, otherNibble),
      description: `CHOOSE ${test.description} (${isOn}): ${chosenOperation.description}`
    }
  }
}

export const constant: PFunction<Update> = (t: NibbleTransformer<Nibble>) => {
  return (nibble, otherNibble) => {
    return {
      value: t(nibble, otherNibble),
      description: `CONSTANT ${t.description}`
    }
  }
}

export const and: PFunction<Bit> = (...checks: Array<NibbleTransformer<Bit>>) => {
  const fn = (nibble, otherNibble) => {
    return toBit(checks.every(check => check(nibble, otherNibble) === 1))
  }
  fn.description = `AND(${checks.map(c => c.description).join(", ")})`
  return fn
}

export const b: PFunction<Bit> = (index: BitIndex) => {
  const fn = (nibble) => {
    return digit(nibble,index)
  }
  fn.description = `${index}-bit`
  return fn
}

export const x: PFunction<Bit> = (index: BitIndex) => {
  const fn = (nibble, otherNibble) => {
    return digit(otherNibble,index)
  }
  fn.description = `Other's ${index}-bit`
  return fn
}

export const add: PFunction<Nibble> = (addend: number) => {
  const fn = (nibble, otherNibble) => {
    return addBits(nibble, addend)
  }
  fn.description = `Add ${addend}`
  return fn
}