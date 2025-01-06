import { Table } from "console-table-printer";
import { flatten, pickBy, zipWith } from "lodash";
import { Bit, entriesAreEqual, State, History } from "./simulate";
import { Program } from "./program";
import { Count } from "./meta";

// Equivalent to Tonada and Asaadua
const soli = "101010101101"

// Equivalent also to Bembe and Yoruba
const tambu = "101010110101"

const sorsonet = "111010101010"

const sonClave = "1001001000101000"
const rumbaClave = "1001000100101000"
const shiko = "1000101000101000"
const soukous = "1001001000110000"
const bossa = "1001001000100100"
const gahu = "1001001000100010"
const SRGenerator = "1101010111010101"


export type Test = {
  bits: string;
  testName?: string;
};

const evaluateTest = (test: Test, bits: Array<Bit>): boolean => {
  return !!bits.join("").match(test.bits)
}

export type Vars = Record<string, number>;

export type Analysis = {
  testName?: string;
  andcarries: Array<Bit>;
  xorcarries: Array<Bit>;
  orcarries: Array<Bit>;
  inAny: boolean;
  testResults: {
    inCarriesA: boolean;
    inCarriesB: boolean;
    inANDCarries: boolean;
    inORCarries: boolean;
    inXORCarries: boolean;
    inAux: boolean;
  };
  preHistory: History;
  mainHistory: History;
  loopLength: number;
  loopMatchesStrictLength: boolean;
  vars: Vars;
};

export const analyze = (
  state: State,
  test: Test,
  vars?: Vars,
  args?: any
): Analysis => {
  const { history, isLooping } = state;
  const lastEntry = history.slice(-1)[0];
  const firstMatchedIdx = history.findIndex((e) =>
    entriesAreEqual(e, lastEntry)
  );
  const preHistory = isLooping ? history.slice(0, firstMatchedIdx) : history;
  const mainHistory = isLooping ? history.slice(firstMatchedIdx, -1) : [];
  const loopLength = mainHistory.length
  const loopMatchesStrictLength = test.bits.length % loopLength === 0
  const reps = args["strictOrder"] ? 1 : 10
  const testHistory = flatten(Array(reps).fill(mainHistory));
  const carriesA = testHistory.map((entry) => entry.carryA);
  const carriesB = testHistory.map((entry) => entry.carryB);
  const inCarriesA = evaluateTest(test, carriesA);
  const inCarriesB = evaluateTest(test, carriesB) && !args["skipCarriesB"];

  const auxValues = testHistory.map((entry) => (entry.aux || 0) as Bit);
  const inAux = evaluateTest(test, auxValues);

  const xorcarries = zipWith(carriesA, carriesB, (a, b) => (a ^ b) as Bit);
  const inXORCarries = evaluateTest(test, xorcarries);
  const orcarries = zipWith(carriesA, carriesB, (a, b) => (a | b) as Bit);
  const inORCarries = evaluateTest(test, orcarries);
  const andcarries = zipWith(carriesA, carriesB, (a, b) => (a & b) as Bit);
  const inANDCarries = evaluateTest(test, andcarries);

  let inAny = args["limitToAux"]
    ? inAux
    : args["limitToA"]
      ? inCarriesA
      : inCarriesA ||
      inCarriesB ||
      inXORCarries ||
      inORCarries ||
      inANDCarries ||
      inAux;

  return {
    testName: test.testName,
    andcarries,
    xorcarries,
    orcarries,
    inAny,
    testResults: {
      inCarriesA,
      inCarriesB,
      inANDCarries,
      inORCarries,
      inXORCarries,
      inAux,
    },
    preHistory,
    mainHistory,
    loopLength,
    loopMatchesStrictLength,
    vars: vars || {},
  };
};

export const processTestSet = (rawTest: string) => {
  if (rawTest === "twelves") return [
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
    "101111111111"
  ]
}

export const processTest = (rawTest: string): Test => {
  switch (rawTest) {
    case "sonClave":
      return { testName: "son clave", bits: sonClave }
    case "son":
      return { testName: "son clave", bits: sonClave }
    case "rumbaClave":
      return { testName: "rumba clave", bits: rumbaClave }
    case "rumba":
      return { testName: "rumba clave", bits: rumbaClave }
    case "shiko":
      return { testName: "shiko", bits: shiko }
    case "soukous":
      return { testName: "soukous", bits: soukous }
    case "bossa":
      return { testName: "bossa nova", bits: bossa }
    case "gahu":
      return { testName: "gahu", bits: gahu }
    case "soli":
      return { testName: "soli", bits: soli }
    case "tambu":
      return { testName: "tambu", bits: tambu }
    case "sorsonet":
      return { testName: "sorsonet", bits: sorsonet }
    case "srgen":
      return { testName: "srgen", bits: SRGenerator }
    default:
      return { bits: rawTest }
  }
};

export const printAnalysis = (
  analysis: Analysis,
  program: Program,
  opts: Record<string, any>
) => {
  const success = analysis.inAny && analysis.loopMatchesStrictLength;

  if (success && opts["tiny"] && !opts["debugSuccess"]) {
    console.log(
      program.vars,
      `CA: ${analysis.testResults.inCarriesA} CB: ${analysis.testResults.inCarriesB}`
    );
    return;
  }

  if (success || opts["debug"]) {
    console.log("");
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
    table.addRow({ ...entry, i });
  });
  table.printTable();
};

export const displayCount = (count: Count, skipTwos: boolean = false) => {
  console.log("");
  console.log("VARS: ", count.vars);
  console.log("MATCHING ONE OFFS");
  Object.entries(count.matchingOneOffs).forEach(([key, value]) => {
    console.log(key);
    console.table(value);
  });

  if (!skipTwos) {
    console.log("MATCHING TWO OFFS");
    Object.entries(count.matchingTwoOffs).forEach(([key, value]) => {
      console.log(key);
      console.table(value);
    });
  }
  console.log("");
};
