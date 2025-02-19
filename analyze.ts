import { Table } from "console-table-printer";
import { flatten, pickBy, zipWith } from "lodash";
import { Bit, entriesAreEqual, State, History } from "./simulate";
import { Program } from "./program";
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
const bemba = "100101010010";
const columbia = "101001010100";
const aka = "100101001010";
const fume = "101010010100";
const ewe = "100101010100";

export type Test = {
  bits: string;
  testName?: string;
};

const evaluateTest = (test: Test, bits: Array<Bit>): boolean => {
  return !!bits.join("").match(test.bits);
};

export type Vars = Record<string, number | Record<string, number>>;

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
    inAOnes: boolean;
    inATwos: boolean;
    inAFours: boolean;
    inAEights: boolean;
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
  const loopMatchesStrictLength = test.bits.length % loopLength === 0;
  const reps = args["strictOrder"] ? 1 : 10;
  const testHistory = flatten(Array(reps).fill(mainHistory));
  const carriesA = testHistory.map((entry) => entry.carryA);
  const carriesB = testHistory.map((entry) => entry.carryB);
  const inCarriesA = evaluateTest(test, carriesA);
  const inCarriesB = evaluateTest(test, carriesB) && !args["skipCarriesB"];

  const inAOnes = evaluateTest(
    test,
    testHistory.map((entry) => entry.nibbleA[0])
  );
  const inATwos = evaluateTest(
    test,
    testHistory.map((entry) => entry.nibbleA[1])
  );
  const inAFours = evaluateTest(
    test,
    testHistory.map((entry) => entry.nibbleA[2])
  );
  const inAEights = evaluateTest(
    test,
    testHistory.map((entry) => entry.nibbleA[3])
  );

  const auxValuesRaw = testHistory.map((entry) => (entry.aux || 0) as Bit);
  const auxValues = program.auxPostProcess(auxValuesRaw);
  const inAux = evaluateTest(test, auxValues);

  const xorcarries = zipWith(carriesA, carriesB, (a, b) => (a ^ b) as Bit);
  const inXORCarries = evaluateTest(test, xorcarries);
  const orcarries = zipWith(carriesA, carriesB, (a, b) => (a | b) as Bit);
  const inORCarries = evaluateTest(test, orcarries);
  const andcarries = zipWith(carriesA, carriesB, (a, b) => (a & b) as Bit);
  const inANDCarries = evaluateTest(test, andcarries);

  const inA = inCarriesA || inAOnes || inATwos || inAFours || inAEights;

  let inAny = args["limitToAux"]
    ? inAux
    : args["limitToA"]
    ? inA
    : args["limitToCarriesA"]
    ? inCarriesA
    : args["limitToCarries"]
    ? inCarriesA || inCarriesB
    : inA || inCarriesB || inXORCarries || inORCarries || inANDCarries || inAux;

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
      inAOnes,
      inATwos,
      inAFours,
      inAEights,
    },
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

  if (rawTest === "touissant")
    return ["son", "rumba", "bossa", "soukous", "shiko", "gahu"];

  if (rawTest === "touissant12") return ["aka", "fume"];

  if (rawTest === "amenSnares")
    return ["0000100101001001", "0000100101000010", "0100100101000010"];

  if (rawTest === "aksak")
    return ["10100", "1010100", "101010100", "10101010100"];
};

export const processTest = (rawTest: string): Test => {
  switch (rawTest) {
    case "sonClave":
      return { testName: "son clave", bits: sonClave };
    case "son":
      return { testName: "son clave", bits: sonClave };
    case "rumbaClave":
      return { testName: "rumba clave", bits: rumbaClave };
    case "rumba":
      return { testName: "rumba clave", bits: rumbaClave };
    case "shiko":
      return { testName: "shiko", bits: shiko };
    case "soukous":
      return { testName: "soukous", bits: soukous };
    case "bossa":
      return { testName: "bossa nova", bits: bossa };
    case "gahu":
      return { testName: "gahu", bits: gahu };
    case "soli":
      return { testName: "soli", bits: soli };
    case "tambu":
      return { testName: "tambu", bits: tambu };
    case "sorsonet":
      return { testName: "sorsonet", bits: sorsonet };
    case "srgen":
      return { testName: "srgen", bits: SRGenerator };
    case "bemba":
      return { testName: "bemba", bits: bemba };
    case "columbia":
      return { testName: "columbia", bits: columbia };
    case "aka":
      return { testName: "aka", bits: aka };
    case "fume":
      return { testName: "fume", bits: fume };
    case "ewe":
      return { testName: "ewe", bits: ewe };
    default:
      return { bits: rawTest };
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
