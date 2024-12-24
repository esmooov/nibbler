import { isNull } from "lodash"

export type Result = {
  operation: "ADD",
  argument: number | null,
  out: 1 | 0,
}

export type State = Result & {nibble: Nibble, n: number, loop: boolean, carry?: 1 | 0} 

export type History = Array<State>

export type Bit = 0 | 1
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
  throw `${d} is not legal digit`
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