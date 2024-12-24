import { isNull, isNumber } from "lodash"

export type Operation = "ADD" | "SHIFT" | "AND" | "OR" | "XOR" | "NOT" | "GT" | "GTE" | "LT" | "LTE"

export type Result = {
  operation: Operation,
  argument: number,
  out: Bit,
}

export type State = Result & {nibble: Nibble, n: number, loop: boolean, carry?: Bit} 

export type History = Array<State>

export type Bit = 0 | 1
export const toBit = (b: boolean) => b ? 1 : 0

export type Nibble = [Bit,Bit,Bit,Bit]

export const toInt = (n: Nibble | number): number => {
  if (typeof n === "number") return n
  return parseInt(n.slice().reverse().join(""),2);
}

export const toNibble = (n: number): Nibble => {
  const mRaw = n % 16;
  const m = mRaw < 0 ? 16 + mRaw : mRaw
  return Number(m).toString(2).padStart(4,"0").split("").reverse().map(c => Number(c)) as Nibble
}

export const add = (a: Nibble | number | null, b: Nibble | number | null): Nibble => {
  const aInt = isNull(a) ? 0 : toInt(a);
  const bInt = isNull(b) ? 0 : toInt(b);
  return toNibble(aInt + bInt);
}

export const digit = (n: Nibble, d: string | number) => {
  switch (d) {
    case "1":
      return n[0]
    case 1:
      return n[0]
    case "2":
      return n[1]
    case 2:
      return n[1]
    case "4":
      return n[2]
    case 4:
      return n[2]
    case "8":
      return n[3]
    case 8:
      return n[3]
  }
  throw `${d} is not a legal digit`
}

export const getFormattedDigit = (digit) => {
  switch (digit) {
    case 0:
      return "1-bit" 
    case 1:
      return "2-bit" 
    case 2:
      return "4-bit" 
    case 3:
      return "8-bit" 
    default:
      break;
  }
}

export const decodeValue = (argument: string | number, nibble: Nibble): number => {
  if (typeof(argument) !== "string") return argument

  let p: any
  if (p = argument.match(/\+(\d+)/)) return Number(p[1])
  if (p = argument.match(/\-(\d+)/)) return Number(p[0])
  if (p = argument.match(/^\*(\d)$/)) return digit(nibble,p[1])
  
  // By default let's return a true bit
  return 1
}


export const decodeArgument = (argument: string, nibble: Nibble) : {operation: Operation | null, value: number} => {
  if (typeof(argument) !== "string") return {operation: null, value: argument || 0}
  const fnMatch = /^(\w+)?\[(.+?)?\]$/ 
  const match = argument.match(fnMatch)

  // Without a function, treat argument as plain value
  if (!match) return {operation: null, value: decodeValue(argument, nibble)}

  const fn = match[1]
  const data = match[2]

  if (data?.match(fnMatch)) {
    const {operation: innerOperation, value: innerValue} = decodeArgument(data,nibble)
    // IMAGE SHIFT[XOR[2,4]]
    // HERE WE MIGHT HAVE operation = SHIFT, innerOperaton = XOR, innerValue = 1
    return {
      operation: fn as Operation,
      value: innerValue
    }
  } else {
    const values = data?.split(",").map(d => decodeArgument(d, nibble).value)
    if (fn === "AND") {
      const isOn = values.every(d => decodeValue(d, nibble) === 1) 
      return {operation: fn, value: toBit(isOn)}
    } else if (fn === "OR") {
      const isOn = values.some(d => decodeValue(d, nibble) === 1)
      return {operation: fn, value: toBit(isOn)}
    } else if (fn === "XOR") {
      const onBits = values.filter(d => decodeValue(d, nibble) === 1)
      const isOn = (onBits.length & 1) === 1
      return {operation: fn, value: toBit(isOn)}
    } else if (fn === "GT") {
      const comparator = decodeValue(values[0], nibble)
      const isOn = toInt(nibble) > comparator 
      return {operation: fn, value: toBit(isOn)}
    } else if (fn === "GTE") {
      const comparator = decodeValue(values[0], nibble)
      const isOn = toInt(nibble) >= comparator 
      return {operation: fn, value: toBit(isOn)}
    } else if (fn === "LT") {
      const comparator = decodeValue(values[0], nibble)
      const isOn = toInt(nibble) < comparator 
      return {operation: fn, value: toBit(isOn)}
    } else if (fn === "LTE") {
      const comparator = decodeValue(values[0], nibble)
      const isOn = toInt(nibble) <= comparator 
      return {operation: fn, value: toBit(isOn)}
    } else if (fn === "SHIFT") {
      // an empty SHIFT will copy the last bit from the nibble
      const value = data ? decodeValue(data[0], nibble): digit(nibble, 8)
      return {operation: "SHIFT", value}
    } else if (fn === "NOT") {
      const isOn = values.every(d => decodeValue(d, nibble) === 0) 
      return {operation: fn, value: toBit(isOn)}
    } else {
      return {operation: null, value: decodeValue(data, nibble)}
    }
  }
}

export const displayTable = (history: History) => {
  const formattedTable = history.map((data) => {
    return {...data, 
      1: data.nibble[0], 
      2: data.nibble[1], 
      4: data.nibble[2],
      8: data.nibble[3],
    }
  })
  console.table(formattedTable, ["1","2","4","8"," ","n", "out", "operation", "argument", "carry"])
}