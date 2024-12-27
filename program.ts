import {
  addBits,
  Bit,
  BitIndex,
  digit,
  Nibble,
  toBit,
  toInt,
  toNibble,
  Update,
} from "./simulate";

enum TransformerType {
  Bit,
  Nibble,
  Update,
}

type NibbleTransformer<T extends Bit | Nibble | Update> = T extends Bit
  ? {
      (nibble: Nibble, otherNibble: Nibble): Bit;
      type: TransformerType.Bit;
      description?: string;
    }
  : T extends Nibble
  ? {
      (nibble: Nibble, otherNibble: Nibble): Nibble;
      type: TransformerType.Nibble;
      description?: string;
    }
  : {
      (nibble: Nibble, otherNibble: Nibble): Update;
      type: TransformerType.Update;
      description?: string;
    };

export const resolve = <T>(
  value: T,
  nibble: Nibble,
  otherNibble: Nibble
): T extends NibbleTransformer<any> ? ReturnType<T> : T => {
  if (typeof value === "function") {
    return value(nibble, otherNibble);
  }

  return value as any;
};

const description = (t: NibbleTransformer<any> | number | Nibble): string => {
  if (typeof t === "function" && t.description) return t.description;

  return String(t);
};

export const choice = (
  test: NibbleTransformer<Bit>,
  left: NibbleTransformer<Nibble>,
  right: NibbleTransformer<Nibble>
): NibbleTransformer<Update> => {
  const fn = (nibble, otherNibble) => {
    const isOn = test(nibble, otherNibble) === 1;
    const chosenOperation = isOn ? left : right;
    return {
      value: chosenOperation(nibble, otherNibble),
      description: `${isOn ? "⬅" : "⮕"} (${description(chosenOperation)})`,
    };
  };
  fn.description = `CHOOSE ${description(test)} ? ${description(
    left
  )} : ${description(right)}`;
  fn.type = TransformerType.Update;
  return fn as NibbleTransformer<Update>;
};

export const constant = (
  t: NibbleTransformer<Nibble>
): NibbleTransformer<Update> => {
  const fn = (nibble, otherNibble) => {
    return {
      value: t(nibble, otherNibble),
      description: `${description(t)}`,
    };
  };
  fn.description = `CONSTANT ${description(t)}`;
  fn.type = TransformerType.Update;
  return fn as NibbleTransformer<Update>;
};

const makeLogicTransformer = (
  checks: Array<NibbleTransformer<Bit>> | Array<NibbleTransformer<Nibble>>,
  bitTransformer: Omit<NibbleTransformer<Bit>, "description" | "type">,
  nibbleTransformer: Omit<NibbleTransformer<Nibble>, "description" | "type">,
  prefix: string
) => {
  if (checks[0].type === TransformerType.Bit) {
    const fn = bitTransformer as NibbleTransformer<Bit>;
    fn.description = `${prefix}(${checks
      .map((c) => description(c))
      .join(", ")})`;
    fn.type = TransformerType.Bit;
    return fn;
  }

  const fn = nibbleTransformer as NibbleTransformer<Nibble>;
  fn.description = `${prefix}(${checks.map((c) => description(c)).join(", ")})`;
  fn.type = TransformerType.Nibble;
  return fn;
};

export function and(
  ...checks: Array<NibbleTransformer<Bit>>
): NibbleTransformer<Bit>;
export function and(
  ...checks: Array<NibbleTransformer<Nibble>>
): NibbleTransformer<Nibble>;
export function and(
  ...checks: Array<NibbleTransformer<Bit>> | Array<NibbleTransformer<Nibble>>
) {
  return makeLogicTransformer(
    checks,
    (nibble, otherNibble) => {
      return toBit(checks.every((check) => check(nibble, otherNibble) === 1));
    },
    (nibble, otherNibble) => {
      return toNibble(toInt(nibble) & toInt(otherNibble));
    },
    "AND"
  );
}

export function or(
  ...checks: Array<NibbleTransformer<Bit>>
): NibbleTransformer<Bit>;
export function or(
  ...checks: Array<NibbleTransformer<Nibble>>
): NibbleTransformer<Nibble>;
export function or(
  ...checks: Array<NibbleTransformer<Bit>> | Array<NibbleTransformer<Nibble>>
) {
  return makeLogicTransformer(
    checks,
    (nibble, otherNibble) => {
      return toBit(checks.some((check) => check(nibble, otherNibble) === 1));
    },
    (nibble, otherNibble) => {
      return toNibble(toInt(nibble) | toInt(otherNibble));
    },
    "OR"
  );
}

export function xor(
  ...checks: Array<NibbleTransformer<Bit>>
): NibbleTransformer<Bit>;
export function xor(
  ...checks: Array<NibbleTransformer<Nibble>>
): NibbleTransformer<Nibble>;
export function xor(
  ...checks: Array<NibbleTransformer<Bit>> | Array<NibbleTransformer<Nibble>>
) {
  return makeLogicTransformer(
    checks,
    (nibble, otherNibble) => {
      const onBits = checks.filter((check) => check(nibble, otherNibble) === 1);
      return onBits.length & 1;
    },
    (nibble, otherNibble) => {
      return toNibble(toInt(nibble) ^ toInt(otherNibble));
    },
    "XOR"
  );
}

export function not(checks: NibbleTransformer<Bit>): NibbleTransformer<Bit>;
export function not(
  checks: NibbleTransformer<Nibble>
): NibbleTransformer<Nibble>;
export function not(check: NibbleTransformer<Bit> | NibbleTransformer<Nibble>) {
  return makeLogicTransformer(
    [check] as Array<NibbleTransformer<Bit>> | Array<NibbleTransformer<Nibble>>,
    (nibble, otherNibble) => {
      return toBit(check(nibble, otherNibble) !== 1);
    },
    (nibble, otherNibble) => {
      return toNibble(~toInt(nibble));
    },
    "NOT"
  );
}

export const n = (index: BitIndex): NibbleTransformer<Bit> => {
  const fn = (nibble, otherNibble) => {
    return digit(nibble, index);
  };
  fn.description = `Self ${index}-bit`;
  fn.type = TransformerType.Bit;
  return fn as NibbleTransformer<Bit>;
};

export const x = (index: BitIndex): NibbleTransformer<Bit> => {
  const fn = (nibble, otherNibble) => {
    return digit(otherNibble, index);
  };
  fn.description = `Other ${index}-bit`;
  fn.type = TransformerType.Bit;
  return fn as NibbleTransformer<Bit>;
};

export const add = (
  addend: number | Nibble | NibbleTransformer<Nibble>
): NibbleTransformer<Nibble> => {
  const fn = (nibble, otherNibble) => {
    return addBits(nibble, resolve(addend, nibble, otherNibble));
  };
  fn.description = `Add ${description(addend)}`;
  fn.type = TransformerType.Nibble;
  return fn as NibbleTransformer<Nibble>;
};

export const own = (): NibbleTransformer<Nibble> => {
  const fn = (nibble) => {
    return nibble;
  };
  fn.description = `Self`;
  fn.type = TransformerType.Nibble;
  return fn as NibbleTransformer<Nibble>;
};

export const other = (): NibbleTransformer<Nibble> => {
  const fn = (nibble, otherNibble) => {
    return otherNibble;
  };
  fn.description = `Other`;
  fn.type = TransformerType.Nibble;
  return fn as NibbleTransformer<Nibble>;
};

export type Program = {
  (nibbleA: Nibble, nibbleB: Nibble): [Update, Update];
  description: string;
};

export const makeProgram = (
  transformerA: NibbleTransformer<Update>,
  transformerB: NibbleTransformer<Update>
): Program => {
  const fn = (nibbleA: Nibble, nibbleB: Nibble) => {
    const updateA = transformerA(nibbleA, nibbleB);
    const updateB = transformerB(nibbleB, nibbleA);
    return [updateA, updateB] as [Update, Update];
  };
  fn.description = `A: (${transformerA.description})\nB: (${transformerB.description})`;
  return fn;
};
