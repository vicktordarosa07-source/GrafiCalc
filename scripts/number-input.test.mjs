import assert from "node:assert/strict";
import { normalizeNumberInput, parseLocalizedNumber } from "../number-input.mjs";

const cases = [
  ["0", 0],
  ["0,5", 0.5],
  ["1,25", 1.25],
  ["100", 100],
  ["1.250,50", 1250.5],
  ["1,250.50", 1250.5],
  ["1.250.000", 1250000],
  ["1,250,000", 1250000],
  ["1.234,00", 1234],
  [" 1\u00a0250,50 ", 1250.5],
  [".5", 0.5],
  [",5", 0.5],
  ["1e3", 1000],
];

for (const [input, expected] of cases) {
  assert.equal(parseLocalizedNumber(input), expected, `failed to parse ${JSON.stringify(input)}`);
}

for (const input of ["1,2,3", "12abc", "1.25.0", "1,,25", "1e", "R$ 1.250,50"]) {
  assert.equal(parseLocalizedNumber(input), null, `malformed value was partially parsed: ${JSON.stringify(input)}`);
}

assert.equal(normalizeNumberInput("-1,25"), "-1.25");
assert.equal(parseLocalizedNumber(""), null);
assert.equal(parseLocalizedNumber(2.75), 2.75);

console.log("number-input: Brazilian/US decimal and grouping cases passed; malformed values are rejected");
