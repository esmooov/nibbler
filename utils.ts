import { error } from "console"

export type State = {
  history: Array<Omit<State, "history">>,
  data: Record<string, any>,
  loop: boolean,
}

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

export const add = (a: Nibble | number, b: Nibble | number): Nibble => {
  const aInt = toInt(a);
  const bInt = toInt(b);
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

export const displayTable = (history: State["history"]) => {
  const formattedTable = history.map(({data}) => {
    return {...data, 
      1: data.nibblerNumber[0], 
      2: data.nibblerNumber[1], 
      4: data.nibblerNumber[2],
      8: data.nibblerNumber[3],
    }
  })
  console.table(formattedTable, ["1","2","4","8"," ","d", "n", "addAmount"])
}