import {
  addBits,
  Bit,
  BitIndex,
  BitUpdate,
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
  BitUpdate,
}

type NibbleTransformer<T extends Bit | Nibble | Update | BitUpdate> =
  T extends Bit
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
    : T extends Update
    ? {
        (nibble: Nibble, otherNibble: Nibble): Update;
        type: TransformerType.Update;
        description?: string;
      }
    : {
        (nibble: Nibble, otherNibble: Nibble): BitUpdate;
        type: TransformerType.BitUpdate;
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

export const aux = (
  t: NibbleTransformer<Bit>
): NibbleTransformer<BitUpdate> => {
  const fn = (nibble, otherNibble) => {
    return {
      value: t(nibble, otherNibble),
      description: `${description(t)}`,
    };
  };
  fn.description = `AUX: ${description(t)}`;
  fn.type = TransformerType.BitUpdate;
  return fn as NibbleTransformer<BitUpdate>;
};

const makeLogicTransformer = (
  transformers:
    | Array<NibbleTransformer<Bit>>
    | Array<NibbleTransformer<Nibble>>,
  bitTransformer: Omit<NibbleTransformer<Bit>, "description" | "type">,
  nibbleTransformer: Omit<NibbleTransformer<Nibble>, "description" | "type">,
  prefix: string
) => {
  if (transformers[0].type === TransformerType.Bit) {
    const fn = bitTransformer as NibbleTransformer<Bit>;
    fn.description = `${prefix}(${transformers
      .map((c) => description(c))
      .join(", ")})`;
    fn.type = TransformerType.Bit;
    return fn;
  }

  const fn = nibbleTransformer as NibbleTransformer<Nibble>;
  fn.description = `${prefix}(${transformers
    .map((c) => description(c))
    .join(", ")})`;
  fn.type = TransformerType.Nibble;
  return fn;
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
    (nibble, otherNibble) => {
      return toBit(
        transformers.every(
          (transformer) => transformer(nibble, otherNibble) === 1
        )
      );
    },
    (nibble, otherNibble) => {
      const result = transformers.slice(1).reduce((n, transformer) => {
        return n & toInt(transformer(nibble, otherNibble));
      }, toInt(transformers[0](nibble, otherNibble)));
      return toNibble(result);
    },
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
    (nibble, otherNibble) => {
      return toBit(
        transformers.some(
          (transformer) => transformer(nibble, otherNibble) === 1
        )
      );
    },
    (nibble, otherNibble) => {
      const result = transformers.slice(1).reduce((n, transformer) => {
        return n | toInt(transformer(nibble, otherNibble));
      }, toInt(transformers[0](nibble, otherNibble)));
      return toNibble(result);
    },
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
) {
  return makeLogicTransformer(
    transformers,
    (nibble, otherNibble) => {
      const onBits = transformers.filter(
        (transformer) => transformer(nibble, otherNibble) === 1
      );
      return onBits.length & 1;
    },
    (nibble, otherNibble) => {
      const result = transformers.slice(1).reduce((n, transformer) => {
        return n ^ toInt(transformer(nibble, otherNibble));
      }, toInt(transformers[0](nibble, otherNibble)));
      return toNibble(result);
    },
    "XOR"
  );
}

export function not(
  transformers: NibbleTransformer<Bit>
): NibbleTransformer<Bit>;
export function not(
  transformers: NibbleTransformer<Nibble>
): NibbleTransformer<Nibble>;
export function not(
  transformer: NibbleTransformer<Bit> | NibbleTransformer<Nibble>
) {
  return makeLogicTransformer(
    [transformer] as
      | Array<NibbleTransformer<Bit>>
      | Array<NibbleTransformer<Nibble>>,
    (nibble, otherNibble) => {
      return toBit(transformer(nibble, otherNibble) !== 1);
    },
    (nibble, otherNibble) => {
      return toNibble(~toInt(transformer(nibble, otherNibble)));
    },
    "NOT"
  );
}

export const GT = (
  transformer: NibbleTransformer<Nibble>,
  comparator: number | NibbleTransformer<Nibble>
): NibbleTransformer<Bit> => {
  const fn = (nibble, otherNibble) => {
    const n = transformer(nibble, otherNibble);
    if (typeof comparator === "number") {
      return toBit(toInt(n) > comparator);
    } else {
      return toBit(toInt(n) > toInt(comparator(nibble, otherNibble)));
    }
  };

  if (typeof comparator === "number") {
    fn.description = `${transformer.description} > ${comparator}`;
  } else {
    fn.description = `${transformer.description} > ${comparator.description}`;
  }
  fn.type = TransformerType.Bit;
  return fn as NibbleTransformer<Bit>;
};

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

export const nibble = (n: number): NibbleTransformer<Nibble> => {
  const fn = (nibble, otherNibble) => {
    return toNibble(n);
  };
  fn.description = `${n}`;
  fn.type = TransformerType.Nibble;
  return fn as NibbleTransformer<Nibble>;
};

export type Program = {
  (nibbleA: Nibble, nibbleB: Nibble): {
    updateA: Update;
    updateB: Update;
    updateAux: BitUpdate | null;
  };
  description: string;
  vars?: Record<"string", number>;
};

export const makeProgram = (
  transformerA: NibbleTransformer<Update>,
  transformerB: NibbleTransformer<Update>,
  vars?: Record<string, number>,
  auxTransformer?: NibbleTransformer<BitUpdate>
): Program => {
  const fn = (nibbleA: Nibble, nibbleB: Nibble) => {
    const updateA = transformerA(nibbleA, nibbleB);
    const updateB = transformerB(nibbleB, nibbleA);
    const updateAux = auxTransformer ? auxTransformer(nibbleA, nibbleB) : null;
    return { updateA, updateB, updateAux };
  };
  fn.description = `A: (${transformerA.description})\nB: (${transformerB.description})\nAUX: (${auxTransformer?.description})`;
  fn.vars = vars;
  return fn;
};
