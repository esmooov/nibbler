import {
  addBits,
  Bit,
  BitIndex,
  digit,
  Nibble,
  toBit,
  Update,
} from "./simulate";

type NibbleTransformer<T> = {
  (nibble: Nibble, otherNibble: Nibble): T;
  description?: string;
};

type PFunction<T> = (...args: any[]) => NibbleTransformer<T>;

export const choice: PFunction<Update> = (
  test: NibbleTransformer<Bit>,
  left: NibbleTransformer<Nibble>,
  right: NibbleTransformer<Nibble>
) => {
  const fn = (nibble, otherNibble) => {
    const isOn = test(nibble, otherNibble) === 1;
    const chosenOperation = isOn ? left : right;
    return {
      value: chosenOperation(nibble, otherNibble),
      description: `CHOICE: ${isOn} (${chosenOperation.description})`,
    };
  };
  fn.description = `CHOOSE ${test.description} ? ${left.description} : ${right.description}`;
  return fn;
};

export const constant: PFunction<Update> = (t: NibbleTransformer<Nibble>) => {
  const fn = (nibble, otherNibble) => {
    return {
      value: t(nibble, otherNibble),
      description: `${t.description}`,
    };
  };
  fn.description = `CONSTANT ${t.description}`;
  return fn;
};

export const and: PFunction<Bit> = (
  ...checks: Array<NibbleTransformer<Bit>>
) => {
  const fn = (nibble, otherNibble) => {
    return toBit(checks.every((check) => check(nibble, otherNibble) === 1));
  };
  fn.description = `AND(${checks.map((c) => c.description).join(", ")})`;
  return fn;
};

export const b: PFunction<Bit> = (index: BitIndex) => {
  const fn = (nibble) => {
    return digit(nibble, index);
  };
  fn.description = `${index}-bit`;
  return fn;
};

export const x: PFunction<Bit> = (index: BitIndex) => {
  const fn = (nibble, otherNibble) => {
    return digit(otherNibble, index);
  };
  fn.description = `Other's ${index}-bit`;
  return fn;
};

export const add: PFunction<Nibble> = (
  addend: number | Nibble | NibbleTransformer<Nibble>
) => {
  const fn = (nibble, otherNibble) => {
    return addBits(nibble, resolve(addend, nibble, otherNibble));
  };
  fn.description = `Add ${description(addend)}`;
  return fn;
};

export const resolve = <T>(
  value: T,
  nibble: Nibble,
  otherNibble: Nibble
): T extends NibbleTransformer<unknown> ? ReturnType<T> : T => {
  if (typeof value === "function") {
    return value(nibble, otherNibble);
  }

  return value as any;
};

const description = (
  t: NibbleTransformer<unknown> | number | Nibble
): string => {
  if (typeof t === "function" && t.description) return t.description;

  return String(t);
};

export const other: PFunction<Nibble> = () => {
  const fn = (nibble, otherNibble) => {
    return otherNibble;
  };
  fn.description = `Get Other`;
  return fn;
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
