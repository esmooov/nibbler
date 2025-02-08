import { isArray, isNumber } from "lodash";
import {
  addBits,
  Bit,
  BitIndex,
  digit,
  Nibble,
  toBit,
  toInt,
  toNibble,
} from "./simulate";
import * as math from "mathjs";

enum TransformerType {
  Bit,
  Nibble,
}

type Update<T extends Bit | Nibble | number> = T extends Bit
  ? { value: Bit; description: string; add?: number }
  : T extends Nibble
  ? { value: Nibble; description: string; add?: number }
  : { value: number; description: string; add?: number };

type NibbleTransformer<T extends Bit | Nibble> = T extends Bit
  ? {
      (nibble: Nibble, otherNibble: Nibble): Update<Bit>;
      type: TransformerType.Bit;
      description?: string;
    }
  : {
      (nibble: Nibble, otherNibble: Nibble): Update<Nibble>;
      type: TransformerType.Nibble;
      description?: string;
    };

function resolve(
  value: number,
  nibble: Nibble,
  otherNibble: Nibble
): Update<number>;
function resolve(
  value: Nibble,
  nibble: Nibble,
  otherNibble: Nibble
): Update<Nibble>;
function resolve<T extends Bit | Nibble>(
  value: NibbleTransformer<T>,
  nibble: Nibble,
  otherNibble: Nibble
): T extends Bit
  ? Update<Bit>
  : T extends Nibble
  ? Update<Nibble>
  : Update<number>;
function resolve(value, nibble, otherNibble) {
  if (typeof value === "function") {
    return value(nibble, otherNibble);
  }

  return { value, description: String(value) } as any;
}

const description = (t: NibbleTransformer<any> | number | Nibble): string => {
  if (isArray(t)) return String(t);
  if ((typeof t === "function" || typeof t === "object") && t.description)
    return t.description;

  return String(t);
};

// TODO ADD NOT SUPPORT

type BitMap = {
  1?: number;
  2?: number;
  4?: number;
  8?: number;
  "-1"?: number;
  "-2"?: number;
  "-4"?: number;
  "-8"?: number;
};

export const mapBits = (
  map: BitMap,
  baseAddend: number = 0,
  opts: {
    useOwnBits?: boolean;
  } = {}
): NibbleTransformer<Nibble> => {
  const fn = (ownNibble, otherNibble) => {
    const nibble = opts.useOwnBits ? ownNibble : otherNibble;
    let addend = baseAddend;
    if (digit(nibble, 1)) {
      addend += map["1"] || 0;
    } else {
      addend += map["-1"] || 0;
    }
    if (digit(nibble, 2)) {
      addend += map["2"] || 0;
    } else {
      addend += map["-2"] || 0;
    }
    if (digit(nibble, 4)) {
      addend += map["4"] || 0;
    } else {
      addend += map["-4"] || 0;
    }
    if (digit(nibble, 8)) {
      addend += map["8"] || 0;
    } else {
      addend += map["-8"] || 0;
    }
    const newNibble = addBits(addend, ownNibble);
    return {
      value: newNibble,
      description: `Add ${addend}`,
      add: addend,
    };
  };
  fn.description = `BITMAP ${JSON.stringify(map)} (Base: ${baseAddend})`;
  fn.type = TransformerType.Nibble;
  return fn as NibbleTransformer<Nibble>;
};

export const choice = (
  test: NibbleTransformer<Bit>,
  left: NibbleTransformer<Nibble>,
  right: NibbleTransformer<Nibble>
): NibbleTransformer<Nibble> => {
  const fn = (nibble, otherNibble) => {
    const update = test(nibble, otherNibble);
    const isOn = update.value === 1;
    const chosenOperation = isOn ? left : right;
    const { value, description, add } = chosenOperation(nibble, otherNibble);

    return {
      value,
      description: `${isOn ? "⬅" : "⮕"} (${
        update.description
      }): ${description}`,
      add,
    };
  };
  fn.description = `CHOOSE ${description(test)}: (${left.description}) OR (${
    right.description
  }`;
  fn.type = TransformerType.Nibble;
  return fn as NibbleTransformer<Nibble>;
};

export const constant = (
  t: NibbleTransformer<Nibble>
): NibbleTransformer<Nibble> => {
  const fn = (nibble, otherNibble) => {
    return t(nibble, otherNibble);
  };
  fn.description = `CONSTANT ${description(t)}`;
  fn.type = TransformerType.Nibble;
  return fn as NibbleTransformer<Nibble>;
};

const isBitTransformerArray = (
  arg: any
): arg is Array<NibbleTransformer<Bit>> => {
  return (
    Array.isArray(arg) && arg.every((item) => item.type === TransformerType.Bit)
  );
};

const makeLogicTransformer = <
  T extends Array<NibbleTransformer<Bit>> | Array<NibbleTransformer<Nibble>>
>(
  transformers: T,
  bitFn: (transformers: Array<Update<Bit>>) => Bit,
  nibbleFn: (transformers: Array<Update<Nibble>>) => Nibble,
  prefix: string
): T extends Array<NibbleTransformer<Bit>>
  ? NibbleTransformer<Bit>
  : NibbleTransformer<Nibble> => {
  if (isBitTransformerArray(transformers)) {
    const fn = (nibble, otherNibble) => {
      const updates = transformers.map((t) => t(nibble, otherNibble));
      const value = bitFn(updates);
      const truthValue = value === 1;

      const innerDescription = updates
        .map((update) => update.description)
        .join(", ");
      return {
        value,
        description: `${prefix} = ${truthValue} (${innerDescription})`,
      };
    };
    fn.description = `${prefix}(${transformers
      .map((c) => description(c))
      .join(", ")})`;
    fn.type = TransformerType.Bit;
    return fn as any;
  }

  const fn = (nibble, otherNibble) => {
    const updates = transformers.map((t) => t(nibble, otherNibble));
    const value = nibbleFn(updates);

    const innerDescription = updates
      .map((update) => update.description)
      .join(", ");
    return {
      value,
      description: `${prefix} (${innerDescription}) = ${toInt(value)}`,
    };
  };

  fn.description = `${prefix}(${transformers
    .map((c) => description(c))
    .join(", ")})`;
  fn.type = TransformerType.Nibble;
  return fn as any;
};

export function and(
  ...transformers: Array<NibbleTransformer<Bit>>
): NibbleTransformer<Bit>;
export function and(
  ...transformers: Array<NibbleTransformer<Nibble>>
): NibbleTransformer<Nibble>;
export function and(
  ...transformers:
    | Array<NibbleTransformer<Bit>>
    | Array<NibbleTransformer<Nibble>>
) {
  return makeLogicTransformer(
    transformers,
    (updates) => toBit(updates.every((update) => update.value === 1)),
    (updates) =>
      toNibble(
        updates.slice(1).reduce((n, update) => {
          return n & toInt(update.value);
        }, toInt(updates[0].value))
      ),
    "AND"
  );
}

export function or(
  ...transformers: Array<NibbleTransformer<Bit>>
): NibbleTransformer<Bit>;
export function or(
  ...transformers: Array<NibbleTransformer<Nibble>>
): NibbleTransformer<Nibble>;
export function or(
  ...transformers:
    | Array<NibbleTransformer<Bit>>
    | Array<NibbleTransformer<Nibble>>
) {
  return makeLogicTransformer(
    transformers,
    (updates) => toBit(updates.some((update) => update.value === 1)),
    (updates) =>
      toNibble(
        updates.slice(1).reduce((n, update) => {
          return n | toInt(update.value);
        }, toInt(updates[0].value))
      ),
    "OR"
  );
}

export function xor(
  ...transformers: Array<NibbleTransformer<Bit>>
): NibbleTransformer<Bit>;
export function xor(
  ...transformers: Array<NibbleTransformer<Nibble>>
): NibbleTransformer<Nibble>;
export function xor(
  ...transformers:
    | Array<NibbleTransformer<Bit>>
    | Array<NibbleTransformer<Nibble>>
): NibbleTransformer<Bit> | NibbleTransformer<Nibble> {
  return makeLogicTransformer(
    transformers,
    (updates) => {
      const onBits = updates.filter((update) => update.value === 1);
      return (onBits.length & 1) as Bit;
    },
    (updates) =>
      toNibble(
        updates.slice(1).reduce((n, update) => {
          return n ^ toInt(update.value);
        }, toInt(updates[0].value))
      ),
    "XOR"
  );
}

export function not(
  ...transformers: Array<NibbleTransformer<Bit>>
): NibbleTransformer<Bit>;
export function not(
  ...transformers: Array<NibbleTransformer<Nibble>>
): NibbleTransformer<Nibble>;
export function not(
  ...transformers:
    | Array<NibbleTransformer<Bit>>
    | Array<NibbleTransformer<Nibble>>
): NibbleTransformer<Bit> | NibbleTransformer<Nibble> {
  return makeLogicTransformer(
    transformers as
      | Array<NibbleTransformer<Bit>>
      | Array<NibbleTransformer<Nibble>>,
    (updates) => toBit(!updates.some((update) => update.value === 1)),
    (updates) => {
      return toNibble(~toInt(updates[0].value));
    },
    "NOT"
  );
}

export const GT = (
  transformer: NibbleTransformer<Nibble>,
  comparator: number | NibbleTransformer<Nibble>
): NibbleTransformer<Bit> => {
  const fn = (nibble, otherNibble) => {
    const n = transformer(nibble, otherNibble).value;
    const isGreater =
      typeof comparator === "number"
        ? toInt(n) > comparator
        : toInt(n) > toInt(comparator(nibble, otherNibble).value);
    return {
      value: toBit(isGreater),
      description: isGreater
        ? `Greater than ${description(comparator)}`
        : `Less than ${description(comparator)}`,
    };
  };

  fn.description = `${description(transformer)} > ${description(comparator)}`;
  fn.type = TransformerType.Bit;
  return fn as NibbleTransformer<Bit>;
};

export const between = (
  transformer: NibbleTransformer<Nibble>,
  low: number | NibbleTransformer<Nibble>,
  high: number | NibbleTransformer<Nibble>
): NibbleTransformer<Bit> => {
  const fn = (nibble, otherNibble) => {
    const n = transformer(nibble, otherNibble).value;
    const isGreater =
      typeof low === "number"
        ? toInt(n) > low
        : toInt(n) > toInt(low(nibble, otherNibble).value);
    const isLesser =
      typeof high === "number"
        ? toInt(n) < high
        : toInt(n) < toInt(high(nibble, otherNibble).value);
    const isBetween = isGreater && isLesser;
    return {
      value: toBit(isBetween),
      description: isBetween
        ? `Is between ${description(low)} and ${description(high)}`
        : `Is NOT between ${description(low)} and ${description(high)}`,
    };
  };

  fn.description = `${description(transformer)} IS BETWEEN (${description(
    low
  )} and ${description(high)})`;
  fn.type = TransformerType.Bit;
  return fn as NibbleTransformer<Bit>;
};

export const bit = (n: Nibble | NibbleTransformer<Nibble>, index: BitIndex) => {
  const fn = (nibble, otherNibble) => {
    const resolvedN = resolve(n as any, nibble, otherNibble);
    const resolvedNibble = isNumber(resolvedN.value)
      ? toNibble(resolvedN.value)
      : resolvedN.value;
    const value = digit(resolvedNibble, index);
    const name = description(resolvedNibble);
    return { value, description: `${index}-bit: ${name}` };
  };
  fn.description =
    "description" in n
      ? `${n.description}'s ${index}-bit`
      : `${n} ${index}-bit`;
  fn.type = TransformerType.Bit;
  return fn as NibbleTransformer<Bit>;
};

export const n = (index: BitIndex): NibbleTransformer<Bit> => {
  const fn = (nibble, otherNibble) => {
    const value = digit(nibble, index);
    return { value, description: `Own ${index}-bit: ${String(value)}` };
  };
  fn.description = `Self ${index}-bit`;
  fn.type = TransformerType.Bit;
  return fn as NibbleTransformer<Bit>;
};

export const x = (index: BitIndex): NibbleTransformer<Bit> => {
  const fn = (nibble, otherNibble) => {
    const value = digit(otherNibble, index);
    return { value, description: `Other ${index}-bit: ${String(value)}` };
  };
  fn.description = `Other ${index}-bit`;
  fn.type = TransformerType.Bit;
  return fn as NibbleTransformer<Bit>;
};

export const add = (
  addend: number | Nibble | NibbleTransformer<Nibble>,
  transformer?: number | Nibble | NibbleTransformer<Nibble>
): NibbleTransformer<Nibble> => {
  const fn = (nibble, otherNibble) => {
    const resolvedAddend = resolve(addend as any, nibble, otherNibble);
    const transformerUpdate =
      transformer && resolve(transformer as any, nibble, otherNibble);
    const value = transformerUpdate ? transformerUpdate.value : nibble;
    const innerDescription = transformerUpdate
      ? transformerUpdate.description
      : `Self`;
    const result = addBits(value, resolvedAddend.value);
    return {
      value: result,
      description: `Add (${resolvedAddend.description} to ${innerDescription})`,
      add: resolvedAddend.value,
    };
  };
  fn.description = `Add ${description(addend)}`;
  fn.type = TransformerType.Nibble;
  return fn as NibbleTransformer<Nibble>;
};

export const shift = (
  bit: NibbleTransformer<Bit> | Bit
): NibbleTransformer<Nibble> => {
  const fn = (nibble, otherNibble) => {
    const resolvedBit = resolve(bit as any, nibble, otherNibble);
    const value = [resolvedBit.value, ...nibble.slice(0, 3)];
    return { value, description: `Shift ${resolvedBit.description}` };
  };
  fn.description = `Shift ${description(bit)}`;
  fn.type = TransformerType.Nibble;
  return fn as NibbleTransformer<Nibble>;
};

export const complement = (
  n: NibbleTransformer<Nibble>
): NibbleTransformer<Nibble> => {
  const fn = (nibble, otherNibble) => {
    const v = resolve(n, nibble, otherNibble);
    const value = toNibble(toInt(v.value) ^ 15);
    return { value, description: String(value) };
  };
  fn.description = `Complement ${description(n)}`;
  fn.type = TransformerType.Nibble;
  return fn as NibbleTransformer<Nibble>;
};

export const twosComplement = (
  n: NibbleTransformer<Nibble> | number
): NibbleTransformer<Nibble> => {
  const fn = (nibble, otherNibble) => {
    const v = resolve(n as any, nibble, otherNibble);
    const value = toNibble((toInt(v.value) ^ 15) + 1);
    return { value, description: String(toInt(value)) };
  };
  fn.description = `Two's Complement ${description(n)}`;
  fn.type = TransformerType.Nibble;
  return fn as NibbleTransformer<Nibble>;
};

export const own = (): NibbleTransformer<Nibble> => {
  const fn = (nibble) => {
    return { value: nibble, description: String(nibble) };
  };
  fn.description = `Self`;
  fn.type = TransformerType.Nibble;
  return fn as NibbleTransformer<Nibble>;
};

export const other = (): NibbleTransformer<Nibble> => {
  const fn = (nibble, otherNibble) => {
    return { value: otherNibble, description: String(otherNibble) };
  };
  fn.description = `Other`;
  fn.type = TransformerType.Nibble;
  return fn as NibbleTransformer<Nibble>;
};

export const nibble = (n: number): NibbleTransformer<Nibble> => {
  const fn = (nibble, otherNibble) => {
    return { value: toNibble(n), description: String(toNibble(n)) };
  };
  fn.description = `${n}`;
  fn.type = TransformerType.Nibble;
  return fn as NibbleTransformer<Nibble>;
};

export const makePolyrhythmFn = (a: number, b: number): PolyrhythmFn => {
  const fractionA = math.fraction(`1/${a}`);
  const fractionB = math.fraction(`1/${b}`);
  let aCount = math.fraction("0");
  let bCount = math.fraction("0");
  let results = [] as Array<{ updateA: boolean; updateB: boolean }>;

  while (results.length === 0 || !math.equal(aCount, bCount)) {
    if (math.smaller(aCount, bCount)) {
      aCount = math.add(aCount, fractionA);
      results.push({ updateA: true, updateB: false });
    } else if (math.smaller(bCount, aCount)) {
      bCount = math.add(bCount, fractionB);
      results.push({ updateA: false, updateB: true });
    } else {
      aCount = math.add(aCount, fractionA);
      bCount = math.add(bCount, fractionB);
      results.push({ updateA: true, updateB: true });
    }
  }

  const steps = results.length;
  const fn = (i) => {
    const modIndex = i % steps;
    return {
      ...results[modIndex],
      i: modIndex,
    };
  };
  fn.description = `${a}:${b} Rhythm`;
  return fn;
};

export type BitCalculator = {
  ({
    nibbleA,
    nibbleB,
    carryA,
    carryB,
  }: {
    nibbleA: Nibble;
    nibbleB: Nibble;
    carryA: Bit;
    carryB: Bit;
  }): Bit;
  description?: string;
};

export type Program = {
  (nibbleA: Nibble, nibbleB: Nibble): {
    updateA: Update<Nibble>;
    updateB: Update<Nibble>;
  };
  description: string;
  polyrhythmFn: PolyrhythmFn;
  vars?: Record<"string", number>;
  updateAux?: BitCalculator;
  auxPostProcess: (bits: Array<Bit>) => Array<Bit>;
};

type PolyrhythmFn = {
  (i: number): {
    i: number;
    updateA: boolean;
    updateB: boolean;
  };
  description: string;
};

export const makeProgram = (
  transformerA: NibbleTransformer<Nibble>,
  transformerB: NibbleTransformer<Nibble>,
  vars?: Record<string, number>,
  opts?: {
    auxTransformer?: BitCalculator;
    polyrhythmFn?: PolyrhythmFn;
    auxPostProcess?: (bits: Array<Bit>) => Array<Bit>;
  }
): Program => {
  const fn = (nibbleA: Nibble, nibbleB: Nibble) => {
    const updateA = transformerA(nibbleA, nibbleB);
    const updateB = transformerB(nibbleB, nibbleA);
    return { updateA, updateB };
  };
  fn.description = `A: (${transformerA.description})\nB: (${transformerB.description})\nAUX: (${opts?.auxTransformer?.description})`;
  fn.vars = vars;
  fn.updateAux = opts?.auxTransformer;
  fn.polyrhythmFn = opts?.polyrhythmFn || defaultPolyrhythmFn;
  fn.auxPostProcess = opts?.auxPostProcess || ((bits) => bits);
  return fn;
};

export const gateToTrigger = (bits: Array<Bit>): Array<Bit> => {
  return bits.reduce(
    ({ bits, low }, i) => {
      if (i === 1 && low) {
        return { bits: bits.concat(1), low: false };
      }
      if (i === 1 && !low) {
        return { bits: bits.concat(0), low: false };
      }
      if (i === 0) {
        return { bits: bits.concat(0), low: true };
      }
      return { bits, low };
    },
    { bits: [] as Array<Bit>, low: true }
  )["bits"];
};

const defaultPolyrhythmFn = () => ({ updateA: true, updateB: true, i: 0 });
defaultPolyrhythmFn.description = "";
