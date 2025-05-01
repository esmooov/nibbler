import { Table } from "console-table-printer";
import { flatten, pickBy, zipWith } from "lodash";
import { Bit, entriesAreEqual, State, History, Entry } from "./simulate";
import { gateToTrigger, Program } from "./program";
import { Count } from "./meta";
const terminalOverwrite = require("terminal-overwrite");

// Equivalent to Tonada and Asaadua
const soli = "101010101101";

// Equivalent also to Bembe and Yoruba
const tambu = "101010110101";

const sorsonet = "111010101010";

const sonClave = "1001001000101000";
const rumbaClave = "1001000100101000";
const shiko = "1000101000101000";
const soukous = "1001001000110000";
const bossa = "1001001000100100";
const gahu = "1001001000100010";
const SRGenerator = "1101010111010101";
const columbia = "101001010100";
const bemba = "100101010010";
const aka = "100101001010";
const fume = "101010010100";
const ewe = "100101010100";

const leftRightSonClave = (entries: Array<Entry>) => {
  const { carriesA, carriesB } = decomposeEntries(entries);
  const leftHand = "1000001000101000".split("");
  const rightHand = "0001000000000000".split("");
  const testPattern = zipWith(leftHand, rightHand, (a, b) => `${a}${b}`).join(
    ","
  );
  return !!zipWith(
    gateToTrigger(carriesA),
    gateToTrigger(carriesB),
    (a, b) => `${a}${b}`
  )
    .join(",")
    .match(testPattern);
};

const leftRightRumbaClave = (entries: Array<Entry>) => {
  const { carriesA, carriesB } = decomposeEntries(entries);
  const leftHand = "1000000000101000".split("");
  const rightHand = "0001000100000000".split("");
  const testPattern = zipWith(leftHand, rightHand, (a, b) => `${a}${b}`).join(
    ","
  );
  return !!zipWith(
    gateToTrigger(carriesA),
    gateToTrigger(carriesB),
    (a, b) => `${a}${b}`
  )
    .join(",")
    .match(testPattern);
};

const leftRightSonSeed = (entries: Array<Entry>) => {
  const { carriesA, carriesB } = decomposeEntries(entries);
  const leftHand = "1001001000101000".split("");
  const rightHand = "0010100010010010".split("");
  const testPattern = zipWith(leftHand, rightHand, (a, b) => `${a}${b}`).join(
    ","
  );
  return !!zipWith(
    gateToTrigger(carriesA),
    gateToTrigger(carriesB),
    (a, b) => `${a}${b}`
  )
    .join(",")
    .match(testPattern);
};

export type Test =
  | {
      bits: string;
      testName?: string;
      length?: number;
    }
  | {
      fn: (bits: Array<Bit>) => boolean;
      testName?: string;
      length?: number;
    }
  | {
      totalFn: (entries: Array<Entry>) => boolean;
      testName?: string;
      length?: number;
    };

type Decomp = {
  carriesA: Array<Bit>;
  carriesB: Array<Bit>;
  aOnes: Array<Bit>;
  aTwos: Array<Bit>;
  aFours: Array<Bit>;
  aEights: Array<Bit>;
  aux: Array<Bit>;
};
export const decomposeEntries = (entries: Array<Entry>): Decomp => {
  return {
    carriesA: entries.map((entry) => entry.carryA),
    carriesB: entries.map((entry) => entry.carryB),
    aOnes: entries.map((entry) => entry.nibbleA[0]),
    aTwos: entries.map((entry) => entry.nibbleA[1]),
    aFours: entries.map((entry) => entry.nibbleA[2]),
    aEights: entries.map((entry) => entry.nibbleA[3]),
    aux: entries.map((entry) => (entry.aux || 0) as Bit),
  };
};

const evaluateTest = (test: Test, bits: Array<Bit>): boolean => {
  if ("bits" in test && test.bits) {
    return !!bits.join("").match(test.bits);
  }

  if ("fn" in test && test.fn) {
    return test.fn(bits);
  }

  return false;
};

export type Vars = Record<string, number | Record<string, number>>;

export type Analysis = {
  testName?: string;
  andcarries: Array<Bit>;
  xorcarries: Array<Bit>;
  orcarries: Array<Bit>;
  inAny: boolean;
  testResults: {
    inCarriesA?: boolean;
    inCarriesB?: boolean;
    inANDCarries?: boolean;
    inORCarries?: boolean;
    inXORCarries?: boolean;
    inAux?: boolean;
    inAOnes?: boolean;
    inATwos?: boolean;
    inAFours?: boolean;
    inAEights?: boolean;
    inTotal?: boolean;
  };
  preHistory: History;
  mainHistory: History;
  loopLength: number;
  loopMatchesStrictLength: boolean;
  vars: Vars;
  polyrhythmName: string;
};

export const analyze = (
  state: State,
  test: Test,
  program: Program,
  args?: any
): Analysis => {
  const { history, isLooping } = state;
  const lastEntry = history.slice(-1)[0];
  const firstMatchedIdx = history.findIndex((e) =>
    entriesAreEqual(e, lastEntry)
  );
  const preHistory = isLooping ? history.slice(0, firstMatchedIdx) : history;
  const mainHistory = isLooping ? history.slice(firstMatchedIdx, -1) : [];
  const loopLength = mainHistory.length;
  const loopMatchesStrictLength = test.length
    ? test.length % loopLength === 0
    : true;
  const reps = args["strictOrder"] ? 1 : 10;
  const testHistory: Array<Entry> = flatten(Array(reps).fill(mainHistory));
  let inAny;
  let testResults;
  let carries: any = {};

  if ("totalFn" in test) {
    const result = test.totalFn(testHistory);
    inAny = result;
    testResults = {
      inTotal: inAny,
    };
  } else {
    const { carriesA, carriesB, aOnes, aTwos, aFours, aEights, aux } =
      decomposeEntries(testHistory);
    const inCarriesA = evaluateTest(test, carriesA);
    const inCarriesB = evaluateTest(test, carriesB) && !args["skipCarriesB"];
    const inAOnes = evaluateTest(test, aOnes);
    const inATwos = evaluateTest(test, aTwos);
    const inAFours = evaluateTest(test, aFours);
    const inAEights = evaluateTest(test, aEights);
    const auxValues = program.auxPostProcess(aux);
    const inAux = evaluateTest(test, auxValues);

    const xorcarries = zipWith(carriesA, carriesB, (a, b) => (a ^ b) as Bit);
    const inXORCarries = evaluateTest(test, xorcarries);
    const orcarries = zipWith(carriesA, carriesB, (a, b) => (a | b) as Bit);
    const inORCarries = evaluateTest(test, orcarries);
    const andcarries = zipWith(carriesA, carriesB, (a, b) => (a & b) as Bit);
    const inANDCarries = evaluateTest(test, andcarries);

    const inA = inCarriesA || inAOnes || inATwos || inAFours || inAEights;
    const inMainA = inCarriesA || inAux;
    inAny = args["limitToMain"]
      ? inMainA
      : args["limitToAux"]
      ? inAux
      : args["limitToA"]
      ? inA
      : args["limitToCarriesA"]
      ? inCarriesA
      : args["limitToCarries"]
      ? inCarriesA || inCarriesB
      : inA ||
        inCarriesB ||
        inXORCarries ||
        inORCarries ||
        inANDCarries ||
        inAux;
    testResults = {
      inCarriesA,
      inCarriesB,
      inANDCarries,
      inORCarries,
      inXORCarries,
      inAux,
      inAOnes,
      inATwos,
      inAFours,
      inAEights,
    };
    carries = {
      andcarries,
      xorcarries,
      orcarries,
    };
  }

  return {
    andcarries: carries.andcarries,
    xorcarries: carries.xorcarries,
    orcarries: carries.orcarries,
    testName: test.testName,
    inAny,
    testResults,
    preHistory,
    mainHistory,
    loopLength,
    loopMatchesStrictLength,
    vars: program.vars || {},
    polyrhythmName: program.polyrhythmFn.description,
  };
};

export const processTestSet = (rawTest: string) => {
  if (rawTest === "flamenco")
    return [
      "100100100100",
      "100100101010",
      "101010010010",
      "001000110101",
      "001001010101",
    ];
  if (rawTest === "twelves")
    return [
      "100000000000",
      "100000100000",
      "100010001000",
      "100100100100",
      "100101010010",
      "101010101010",
      "101101010110",
      "101101101101",
      "101110111011",
      "101111101111",
      "101111111111",
    ];

  if (rawTest === "elevens")
    return [
      "10000000000",
      "10000010000",
      "10001001000",
      "10010100100",
      "10010101010",
      "10110101010",
      "10110101101",
      "10111011011",
      "10111110111",
      "10111111111",
    ];

  if (rawTest === "tens")
    return [
      "1000000000",
      "1000010000",
      "1000100100",
      "1001010010",
      "1010101010",
      "1011010110",
      "1011101101",
      "1011110111",
      "1011111111",
    ];

  if (rawTest === "5ons")
    return [
      "1011101",
      "10110101",
      "101101010",
      "1010101010",
      "10010101010",
      "100101010010",
      "1001010010010",
      "10010100100100",
      "100100100100100",
      "1000100100100100",
    ];

  if (rawTest === "mod7")
    return ["0000001", "0001001", "0010101", "0101011", "0110111", "0111111"];

  if (rawTest === "mod8")
    return [
      "00000001",
      "00010001",
      "00100101",
      "01010101",
      "01011011",
      "01110111",
      "01111111",
    ];

  if (rawTest === "mod9")
    return [
      "000000001",
      "000010001",
      "001001001",
      "001010101",
      "010101011",
      "011011011",
      "011101111",
      "011111111",
    ];

  if (rawTest === "touissant")
    return ["son", "rumba", "bossa", "soukous", "shiko", "gahu"];

  if (rawTest === "touissant12") return ["aka", "fume", "bemba", "ewe"];

  if (rawTest === "amenSnares")
    return ["0000100101001001", "0000100101000010", "0100100101000010"];

  if (rawTest === "aksak")
    return ["10100", "1010100", "101010100", "10101010100"];

  if (rawTest === "lengths")
    return ["shortPeriod", "mediumPeriod", "longPeriod", "microPeriod"];
};

const stringToTest = (testName: string, bits: string): Test => {
  return {
    testName,
    bits,
    length: bits.length,
  };
};

export const processTest = (rawTest: string): Test => {
  switch (rawTest) {
    case "sonClave":
      return stringToTest("son clave", sonClave);
    case "son":
      return stringToTest("son clave", sonClave);
    case "rumbaClave":
      return stringToTest("rumba clave", rumbaClave);
    case "rumba":
      return stringToTest("rumba clave", rumbaClave);
    case "shiko":
      return stringToTest("shiko", shiko);
    case "soukous":
      return stringToTest("soukus", soukous);
    case "bossa":
      return stringToTest("bossa nova", bossa);
    case "gahu":
      return stringToTest("gahu", gahu);
    case "soli":
      return stringToTest("soli", soli);
    case "tambu":
      return stringToTest("tambu", tambu);
    case "sorsonet":
      return stringToTest("sorsonet", sorsonet);
    case "srgen":
      return stringToTest("srgen", SRGenerator);
    case "bemba":
      return stringToTest("bemba", bemba);
    case "columbia":
      return stringToTest("columbia", columbia);
    case "aka":
      return stringToTest("aka", aka);
    case "fume":
      return stringToTest("fume", fume);
    case "ewe":
      return stringToTest("ewe", ewe);
    case "7mod12":
      return {
        length: 12,
        totalFn: (entries: Array<Entry>) => {
          const nums = entries.map((entry) => entry.NA).join(",");
          const test = "0,7,2,9,4,11,6,1,8,3,10,5";
          return !!nums.match(test);
        },
      };
    case "7mod10":
      return {
        length: 10,
        totalFn: (entries: Array<Entry>) => {
          const nums = entries.map((entry) => entry.NA).join(",");
          const test = "0,7,4,1,8,5,2,9,6,3";
          return !!nums.match(test);
        },
      };
    case "leftRightSonClave":
      return {
        length: 16,
        totalFn: leftRightSonClave,
      };
    case "leftRightRumbaClave":
      return {
        length: 16,
        totalFn: leftRightRumbaClave,
      };
    case "longPeriod":
      return {
        totalFn: (entries: Array<Entry>) => {
          return entries.length >= 250;
        },
      };
    case "mediumPeriod":
      return {
        totalFn: (entries: Array<Entry>) => {
          return entries.length > 15 && entries.length < 32;
        },
      };
    case "shortPeriod":
      return {
        totalFn: (entries: Array<Entry>) => {
          return entries.length > 4 && entries.length <= 30;
        },
      };
    case "microPeriod":
      return {
        totalFn: (entries: Array<Entry>) => {
          return entries.length <= 4 && entries.length > 0;
        },
      };
    default:
      return { bits: rawTest, length: rawTest.length };
  }
};

let sCount = 0;
let tCount = 0;

export const printAnalysis = (
  analysis: Analysis,
  program: Program,
  opts: Record<string, any>,
  totalRuns: number
) => {
  const success =
    analysis.inAny &&
    (analysis.loopMatchesStrictLength || !opts["strictLength"]);
  if (opts["micro"]) {
    tCount += 1;
    if (success) sCount += 1;
    terminalOverwrite(
      `Hits: ${sCount} / Total: ${tCount} / ${(tCount / totalRuns) * 100}%`
    );

    // success && process.stdout.write(".");
    return;
  }
  if (success && opts["tiny"] && !opts["debugSuccess"]) {
    console.log("Poly: ", analysis.polyrhythmName);
    console.log(
      program.vars,
      `CA: ${analysis.testResults.inCarriesA} CB: ${analysis.testResults.inCarriesB}`
    );
    return;
  }

  if (success || opts["debug"]) {
    console.log("");
    console.log("Poly: ", analysis.polyrhythmName);
    console.log("Vars: ", program.vars);
    console.log(program.description);
    if (opts["debug"] || opts["debugSuccess"]) {
      if (analysis?.preHistory.length) {
        displayTable(analysis.preHistory);
        console.log("--------------------------------------");
      }
      displayTable(analysis?.mainHistory);
    }

    if (opts["short"]) {
      console.log(
        analysis.testName,
        pickBy(analysis.testResults, (value) => value)
      );
    } else {
      console.log(analysis.testName, analysis.testResults);
    }
  }
};

const displayTable = (history: History) => {
  const table = new Table({
    columns: [
      { name: "n" },
      { name: "i" },
      {
        name: "descriptionA",
        alignment: "left",
      },
      {
        name: "NA",
      },
      {
        name: "nibbleA",
      },
      {
        name: "carryA",
      },
      {
        name: "descriptionB",
        alignment: "left",
      },
      {
        name: "NB",
      },
      {
        name: "nibbleB",
      },
      {
        name: "carryB",
      },
      {
        name: "aux",
      },
    ],
  });
  history.forEach((entry, i) => {
    table.addRow({ ...entry, n: i });
  });
  table.printTable();
};

export const displayCount = (count: Count, strictSetMatch: boolean = false) => {
  console.log("");
  console.log("VARS: ", count.vars);
  console.log("MATCHING ONE OFFS");
  Object.entries(count.matchingOneOffs).forEach(([key, value]) => {
    const formattedValue = value.map((v) => {
      const output = { ...v };
      if (output.mapA) {
        output.mapA = JSON.stringify(output.mapA) as any;
      }
      if (output.mapB) {
        output.mapB = JSON.stringify(output.mapB) as any;
      }
      return output;
    });
    console.table(formattedValue);
  });

  if (!strictSetMatch) {
    console.log("MATCHING TWO OFFS");
    Object.entries(count.matchingTwoOffs).forEach(([key, value]) => {
      console.log(key);
      console.table(value);
    });
  }
  console.log("");
};
