import { isArray } from "lodash";
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

enum TransformerType {
  Bit,
  Nibble,
}

type Update<T extends Bit | Nibble | number> = T extends Bit
  ? { value: Bit; description: string }
  : T extends Nibble
  ? { value: Nibble; description: string }
  : { value: number; description: string };

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
): T extends Bit ? Update<Bit> : Update<Nibble>;
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

export const choice = (
  test: NibbleTransformer<Bit>,
  left: NibbleTransformer<Nibble>,
  right: NibbleTransformer<Nibble>
): NibbleTransformer<Nibble> => {
  const fn = (nibble, otherNibble) => {
    const update = test(nibble, otherNibble);
    const isOn = update.value === 1;
    const chosenOperation = isOn ? left : right;
    const { value, description } = chosenOperation(nibble, otherNibble);

    return {
      value,
      description: `${isOn ? "⬅" : "⮕"} (${
        update.description
      }): ${description}`,
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
  transformer: NibbleTransformer<Bit>
): NibbleTransformer<Bit>;
export function not(
  transformer: NibbleTransformer<Nibble>
): NibbleTransformer<Nibble>;
export function not(
  transformer: NibbleTransformer<Bit> | NibbleTransformer<Nibble>
): NibbleTransformer<Bit> | NibbleTransformer<Nibble> {
  return makeLogicTransformer(
    [transformer] as
      | Array<NibbleTransformer<Bit>>
      | Array<NibbleTransformer<Nibble>>,
    (updates) => {
      return toBit(updates[0].value !== 1);
    },
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
  addend: number | Nibble | NibbleTransformer<Nibble>
): NibbleTransformer<Nibble> => {
  const fn = (nibble, otherNibble) => {
    const resolvedAddend = resolve(addend as any, nibble, otherNibble);
    const value = addBits(nibble, resolvedAddend.value);
    return { value, description: `Add ${resolvedAddend.description}` };
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
  n: NibbleTransformer<Nibble>
): NibbleTransformer<Nibble> => {
  const fn = (nibble, otherNibble) => {
    const v = resolve(n, nibble, otherNibble);
    const value = toNibble(toInt(v.value) ^ (15 + 1));
    return { value, description: String(v.description) };
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
  description: string;
};

export type Program = {
  (nibbleA: Nibble, nibbleB: Nibble): {
    updateA: Update<Nibble>;
    updateB: Update<Nibble>;
  };
  description: string;
  vars?: Record<"string", number>;
  updateAux?: BitCalculator;
};

export const makeProgram = (
  transformerA: NibbleTransformer<Nibble>,
  transformerB: NibbleTransformer<Nibble>,
  vars?: Record<string, number>,
  auxTransformer?: BitCalculator
): Program => {
  const fn = (nibbleA: Nibble, nibbleB: Nibble) => {
    const updateA = transformerA(nibbleA, nibbleB);
    const updateB = transformerB(nibbleB, nibbleA);
    return { updateA, updateB };
  };
  fn.description = `A: (${transformerA.description})\nB: (${transformerB.description})\nAUX: (${auxTransformer?.description})`;
  fn.vars = vars;
  fn.updateAux = auxTransformer;
  return fn;
};
