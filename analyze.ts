import { Table } from "console-table-printer";
import { flatten, pickBy, zipWith } from "lodash";
import { Bit, entriesAreEqual, State, History } from "./simulate";
import { Program } from "./program";
import { Count } from "./meta";

// Equivalent to Tonada and Asaadua
export const checkForSoli = (queue: Array<Bit>): boolean => {
  return !!queue.join("").match(/101010101101/);
};

// Equivalent also to Bembe and Yoruba
export const checkForTambu = (queue: Array<Bit>): boolean => {
  return !!queue.join("").match(/101010110101/);
};

export const checkForSorsonet = (queue: Array<Bit>): boolean => {
  return !!queue.join("").match(/111010101010/);
};

export const checkForSonClave = (queue: Array<Bit>): boolean => {
  return !!queue.join("").match(/1001001000101000/);
};

export const checkForRumbaClave = (queue: Array<Bit>): boolean => {
  return !!queue.join("").match(/1001000100101000/);
};

export const checkForShiko = (queue: Array<Bit>): boolean => {
  return !!queue.join("").match(/1000101000101000/);
};

export const checkForSoukous = (queue: Array<Bit>): boolean => {
  return !!queue.join("").match(/1001001000110000/);
};

export const checkForBossa = (queue: Array<Bit>): boolean => {
  return !!queue.join("").match(/1001001000100100/);
};

export const checkForGahu = (queue: Array<Bit>): boolean => {
  return !!queue.join("").match(/1001001000100010/);
};

export const checkForSRGenerator = (queue: Array<Bit>): boolean => {
  return !!queue.join("").match(/1101010111010101/);
};

export type Test = {
  (queue: Array<Bit>): boolean;
  testName?: string;
};

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
  const reps = args["strictOrder"] ? 1 : 10
  const testHistory = flatten(Array(reps).fill(mainHistory));
  const carriesA = testHistory.map((entry) => entry.carryA);
  const carriesB = testHistory.map((entry) => entry.carryB);
  const inCarriesA = test(carriesA);
  const inCarriesB = test(carriesB) && !args["skipCarriesB"];

  const auxValues = testHistory.map((entry) => (entry.aux || 0) as Bit);
  const inAux = test(auxValues);

  const xorcarries = zipWith(carriesA, carriesB, (a, b) => (a ^ b) as Bit);
  const inXORCarries = test(xorcarries);
  const orcarries = zipWith(carriesA, carriesB, (a, b) => (a | b) as Bit);
  const inORCarries = test(orcarries);
  const andcarries = zipWith(carriesA, carriesB, (a, b) => (a & b) as Bit);
  const inANDCarries = test(andcarries);

  const inAny = args["limitToAux"]
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
    loopLength: mainHistory.length,
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
      return checkForSonClave;
    case "son":
      return checkForSonClave;
    case "rumbaClave":
      return checkForRumbaClave;
    case "rumba":
      return checkForRumbaClave;
    case "shiko":
      return checkForShiko;
    case "soukous":
      return checkForSoukous;
    case "bossa":
      return checkForBossa;
    case "gahu":
      return checkForGahu;
    case "soli":
      return checkForSoli;
    case "tambu":
      return checkForTambu;
    case "sorsonet":
      return checkForSorsonet;
    case "srgen":
      return checkForSRGenerator;
    default:
      return (queue) => !!queue.join("").match(rawTest);
  }
};

export const printAnalysis = (
  analysis: Analysis,
  program: Program,
  opts: Record<string, any>
) => {
  const loopMatchesStrictLength =
    !opts["strictLength"] || opts["strictLength"] % analysis.loopLength === 0;
  const success = analysis.inAny && loopMatchesStrictLength;

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
