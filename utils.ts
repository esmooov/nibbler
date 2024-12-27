import { isEqual, isNull, isNumber, omit } from "lodash"
import { Analysis } from "./analyze"

export type Operation = "ADD" | "SHIFT" | "AND" | "OR" | "XOR" | "NOT" | "GT" | "GTE" | "GTX" | "GTB" | "LTB" | "LT" | "LTE" | "EVEN" | "ODD" | "BETWEEN" | "OUTSIDE" | "BETWEENX" | "OUTSIDEX" | "CX"

export type Result = {
  operation: Operation,
  argument: number,
  out: Bit,
}

export const defaultResult: Result = {
  operation: "ADD",
  argument: 0,
  out: 0
}

export type State = Result & {nibble: Nibble, n: number, loop: boolean, carry?: Bit} 

export const rawState = state => omit(state, "loop", "carry")
export const statesAreEqual = (a: State, b: State) => isEqual(rawState(a), rawState(b))

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

export const parseProgram = (program: string): ((nibble: Nibble, otherNibble: Nibble, oldA: number, oldB: number) => Result) | null => {
  if (!program) return null
  const match = program.match(/^(\w+) (.+?)$/)
  if (!match) throw "Could not parse program"

  const programName = match[1]
  const programArguments = match[2].split(" ")

  if (programName === "CONSTANT") {
    return (nibble: Nibble, otherNibble: Nibble, oldA: number, oldB: number) => {
      const {value, operation} = decodeArgument(programArguments[0], nibble, otherNibble, oldA, oldB)
      return {
        out: 1,
        operation: operation || "ADD",
        argument: value
      }
    }
  } else if (programName === "CHOICE") {
    return (nibble: Nibble, otherNibble: Nibble, oldA: number, oldB: number) => {
      const {value: choice} = decodeArgument(programArguments[0], nibble, otherNibble, oldA, oldB) 
      const {value: onValue, operation: onOperation} = decodeArgument(programArguments[1], nibble, otherNibble, oldA, oldB) 
      const {value: offValue, operation: offOperation} = decodeArgument(programArguments[2], nibble, otherNibble, oldA, oldB) 
      if (choice === 0) {
        return {
          out: 0,
          operation: offOperation || "ADD",
          argument: offValue
        }
      } else {
        return {
          out: 1,
          operation: onOperation || "ADD",
          argument: onValue
        }
      }
    }
  }
  
  throw "Could not parse program"
}

export const decodeValue = (argument: string | number, nibble: Nibble, otherNibble?: Nibble): number => {
  if (typeof(argument) !== "string") return argument

  let p: any
  if (p = argument.match(/^\+?(\d+)/)) return Number(p[1])
  if (p = argument.match(/\-(\d+)/)) return Number(p[0])
  if (p = argument.match(/^\*(\d)$/)) return digit(nibble,p[1])
  if (p = argument.match(/^x(\d)$/)) return digit(otherNibble || nibble,p[1])
  
  // By default let's return a true bit
  return 1
}


export const decodeArgument = (argument: string, nibble: Nibble, otherNibble: Nibble, oldA: number, oldB: number) : {operation: Operation | null, value: number} => {
  if (typeof(argument) !== "string") return {operation: null, value: argument || 0}
  const fnMatch = /^(\w+)?\[(.+?)?\]$/ 
  const match = argument.match(fnMatch)

  // Without a function, treat argument as plain value
  if (!match) return {operation: null, value: decodeValue(argument, nibble, otherNibble)}

  const fn = match[1]
  const data = match[2]

  if (data?.match(fnMatch)) {
    const {operation: innerOperation, value: innerValue} = decodeArgument(data,nibble,otherNibble,oldA,oldB)

    // IMAGE SHIFT[XOR[2,4]]
    // HERE WE MIGHT HAVE operation = SHIFT, innerOperaton = XOR, innerValue = 1
    return {
      operation: fn as Operation,
      value: innerValue
    }
    // WE STILL CANT HANDLE THINGS LIKE OR[*2,AND[*4,*8]]

  } else {
    const values = data?.split(",").map(d => decodeArgument(d, nibble, otherNibble, oldA, oldB).value)
    if (fn === "AND") {
      const isOn = values.every(d => decodeValue(d, nibble, otherNibble) === 1) 
      return {operation: fn, value: toBit(isOn)}
    } else if (fn === "CX") {
      const isOn = toInt(otherNibble) < oldB
      return {operation: fn, value: toBit(isOn)}
    } else if (fn === "OR") {
      const isOn = values.some(d => decodeValue(d, nibble, otherNibble) === 1)
      return {operation: fn, value: toBit(isOn)}
    } else if (fn === "XOR") {
      const onBits = values.filter(d => decodeValue(d, nibble, otherNibble) === 1)
      const isOn = (onBits.length & 1) === 1
      return {operation: fn, value: toBit(isOn)}
    } else if (fn === "GT") {
      const comparator = decodeValue(values[0], nibble, otherNibble)
      const isOn = toInt(nibble) > comparator 
      return {operation: fn, value: toBit(isOn)}
    } else if (fn === "GTX") {
      const comparator = decodeValue(values[0], nibble, otherNibble)
      const isOn = otherNibble && toInt(otherNibble) > comparator 
      return {operation: fn, value: toBit(!!isOn)}
    } else if (fn === "GTB") {
      const isOn = otherNibble && (toInt(nibble) > toInt(otherNibble))
      return {operation: fn, value: toBit(!!isOn)}
    } else if (fn === "GTE") {
      const comparator = decodeValue(values[0], nibble, otherNibble)
      const isOn = toInt(nibble) >= comparator 
      return {operation: fn, value: toBit(isOn)}
    } else if (fn === "LT") {
      const comparator = decodeValue(values[0], nibble, otherNibble)
      const isOn = toInt(nibble) < comparator 
      return {operation: fn, value: toBit(isOn)}
    } else if (fn === "LTE") {
      const comparator = decodeValue(values[0], nibble, otherNibble)
      const isOn = toInt(nibble) <= comparator 
      return {operation: fn, value: toBit(isOn)}
    } else if (fn === "LTB") {
      const isOn = otherNibble && toInt(nibble) < toInt(otherNibble)
      return {operation: fn, value: toBit(!!isOn)}
    } else if (fn === "BETWEEN") {
      const low = decodeValue(values[0], nibble, otherNibble)
      const high = decodeValue(values[1], nibble, otherNibble)
      const isOn = toInt(nibble) > low && toInt(nibble) < high
      return {operation: fn, value: toBit(isOn)}
    } else if (fn === "OUTSIDE") {
      const low = decodeValue(values[0], nibble, otherNibble)
      const high = decodeValue(values[1], nibble, otherNibble)
      const isOn = toInt(nibble) < low || toInt(nibble) > high
      return {operation: fn, value: toBit(isOn)}
    } else if (fn === "OUTSIDEX") {
      const low = decodeValue(values[0], nibble, otherNibble)
      const high = decodeValue(values[1], nibble, otherNibble)
      const isOn = otherNibble && (toInt(otherNibble) < low || toInt(otherNibble) > high)
      return {operation: fn, value: toBit(!!isOn)}
    } else if (fn === "SHIFT") {
      // an empty SHIFT will copy the last bit from the nibble
      const value = data ? decodeValue(data[0], nibble, otherNibble): digit(nibble, 8)
      return {operation: "SHIFT", value}
    } else if (fn === "EVEN") {
      // This is the same as NOT[*1] but nicer to read
      const isOn = (toInt(nibble) & 1) === 0
      return {operation: fn, value: toBit(isOn)}
    } else if (fn === "ODD") {
      // This is the same as OR[*1] but nicer to read
      const isOn = (toInt(nibble) & 1) === 1
      return {operation: fn, value: toBit(isOn)}
    } else if (fn === "NOT") {
      const isOn = values.every(d => decodeValue(d, nibble, otherNibble) === 0) 
      return {operation: fn, value: toBit(isOn)}
    } else {
      return {operation: null, value: decodeValue(data, nibble, otherNibble)}
    }
  }
}

export const displayTable = (history?: History) => {
  if (!history) return
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

export const printProgram = (analysis: Analysis | null, rawProgram: string, short?: boolean) => {
  if (short) {
    console.log(rawProgram.replace(/[^,x*\d- ]/g,"").replace(" ","\t"))
  } else {
    console.log("")
    console.log(`PROGRAM: ${rawProgram}`)
  }
  if (analysis?.preHistory.length && !short) {
    displayTable(analysis.preHistory)
    console.log("--------------------------------------")
  }
  if (!short) {
    displayTable(analysis?.mainHistory)
    if (analysis?.inANDCarries) console.log("ANDCarries: ", analysis?.andcarries)
    if (analysis?.inORCarries) console.log("ORCarries: ", analysis?.orcarries)
    if (analysis?.inXORCarries) console.log("XORCarries: ", analysis?.xorcarries)
  }
}