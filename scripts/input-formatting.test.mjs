import assert from "node:assert/strict";
import { formatBrazilianPhone, formatClientDocument, formatValuePreservingSelection } from "../input-format.mjs";
import { formatMaskedValuePreservingSelection, maskCpfCnpj, maskPhone } from "../lib/validation/documents.ts";

assert.equal(formatClientDocument("12345678901"), "123.456.789-01");
assert.equal(formatClientDocument("12345678000199", "legal"), "12.345.678/0001-99");
assert.equal(formatClientDocument("123456789012", "individual"), "123.456.789-01");
assert.equal(formatBrazilianPhone("48996594085"), "(48) 99659-4085");
assert.equal(formatBrazilianPhone("4899659408512"), "(48) 99659-4085");

const insertedInMiddle = formatValuePreservingSelection(
  "123.9456.789-00",
  5,
  5,
  (value) => formatClientDocument(value),
);
assert.deepEqual(insertedInMiddle, {
  value: "123.945.678-90",
  selectionStart: 5,
  selectionEnd: 5,
  selectionDirection: "none",
});

const deletedInMiddle = formatValuePreservingSelection(
  "123.45.678-90",
  4,
  4,
  (value) => formatClientDocument(value),
);
assert.deepEqual(deletedInMiddle, {
  value: "123.456.789-0",
  selectionStart: 3,
  selectionEnd: 3,
  selectionDirection: "none",
});

const selectedRange = formatValuePreservingSelection(
  "(48) 9965x9-4085",
  9,
  10,
  formatBrazilianPhone,
);
assert.deepEqual(selectedRange, {
  value: "(48) 99659-4085",
  selectionStart: 9,
  selectionEnd: 9,
  selectionDirection: "none",
});

const backwardSelection = formatValuePreservingSelection(
  "123.9456.789-00",
  5,
  9,
  (value) => formatClientDocument(value),
  "backward",
);
assert.deepEqual(backwardSelection, {
  value: "123.945.678-90",
  selectionStart: 5,
  selectionEnd: 9,
  selectionDirection: "backward",
});

assert.deepEqual(
  formatMaskedValuePreservingSelection("123.496.789-01", 6, 6, maskCpfCnpj),
  { value: "123.496.789-01", selectionStart: 6, selectionEnd: 6 },
);
assert.deepEqual(
  formatMaskedValuePreservingSelection("(48) 99659-4085", 9, 9, maskPhone),
  { value: "(48) 99659-4085", selectionStart: 9, selectionEnd: 9 },
);

console.log("input-formatting: CPF/CNPJ/phone formatting and caret mapping assertions passed");
