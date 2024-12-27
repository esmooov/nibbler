import { Table } from "console-table-printer";
import { pickBy, zipWith } from "lodash";
import { Bit, entriesAreEqual, State, History } from "./simulate";
import { Program } from "./program";

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

export type Test = (queue: Array<Bit>) => boolean;

export const analyze = (state: State, test: Test) => {
  const { history, isLooping } = state;
  const lastEntry = history.slice(-1)[0];
  const firstMatchedIdx = history.findIndex((e) =>
    entriesAreEqual(e, lastEntry)
  );
  const preHistory = isLooping ? history.slice(0, firstMatchedIdx) : history;
  const mainHistory = isLooping ? history.slice(firstMatchedIdx, -1) : [];
  const testHistory = [...mainHistory, ...mainHistory];
  const carriesA = testHistory.map((entry) => entry.carryA);
  const carriesB = testHistory.map((entry) => entry.carryB);
  const inCarriesA = test(carriesA);
  const inCarriesB = test(carriesB);

  const xorcarries = zipWith(carriesA, carriesB, (a, b) => (a ^ b) as Bit);
  const inXORCarries = test(xorcarries);
  const orcarries = zipWith(carriesA, carriesB, (a, b) => (a | b) as Bit);
  const inORCarries = test(orcarries);
  const andcarries = zipWith(carriesA, carriesB, (a, b) => (a & b) as Bit);
  const inANDCarries = test(andcarries);

  return {
    andcarries,
    xorcarries,
    orcarries,
    inAny:
      inCarriesA || inCarriesB || inXORCarries || inORCarries || inANDCarries,
    testResults: {
      inCarriesA,
      inCarriesB,
      inANDCarries,
      inORCarries,
      inXORCarries,
    },
    preHistory,
    mainHistory,
    loopLength: mainHistory.length,
  };
};

export type Analysis = ReturnType<typeof analyze>;

export const processTest = (rawTest: string): Test => {
  switch (rawTest) {
    case "sonClave":
      return checkForSonClave;
    case "rumbaClave":
      return checkForRumbaClave;
    case "shiko":
      return checkForShiko;
    case "soukous":
      return checkForSoukous;
    case "bossa":
      return checkForBossa;
    case "gahu":
      return checkForGahu;
    default:
      return (queue) => !!queue.join("").match(rawTest);
  }
};

export const printAnalysis = (
  analysis: Analysis,
  program: Program,
  opts: Record<string, any>
) => {
  const matchIsFound = analysis.inAny;
  const loopMatchesStrictLength =
    !opts["strictLength"] || opts["strictLength"] === analysis.loopLength;

  if ((analysis.inAny && loopMatchesStrictLength) || opts["debug"]) {
    console.log("");
    console.log(program.description);
    if (opts["debug"]) {
      if (analysis?.preHistory.length) {
        displayTable(analysis.preHistory);
        console.log("--------------------------------------");
      }
      displayTable(analysis?.mainHistory);
    }

    if (!opts["short"]) {
      console.log(pickBy(analysis.testResults, (value) => value));
    }
  }
};

const displayTable = (history: History) => {
  const table = new Table({
    columns: [
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
    ],
  });
  history.forEach((entry) => {
    table.addRow(entry);
  });
  table.printTable();
};
