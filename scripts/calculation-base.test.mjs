import assert from "node:assert/strict";
import { calculateMaterialCosts, calculateSheetYield, normalizeMaterialConfiguration } from "../calculation-base.mjs";

const resma = normalizeMaterialConfiguration({
  acquisition: {
    mode: "ream",
    paidAmount: 750,
    purchaseQuantity: 1,
    unitsPerPurchase: 250,
    sheetWidthMm: 660,
    sheetHeightMm: 960,
  },
});

assert.equal(calculateSheetYield(660, 960, 210, 297), 9);
assert.equal(calculateSheetYield(660, 960, 148, 210), 19);
assert.equal(calculateSheetYield(660, 960, 457.2, 304.8), 4);
assert.equal(calculateMaterialCosts(resma, { widthMm: 210, heightMm: 297 }).piecesPerStockSheet, 9);
assert.ok(Math.abs(calculateMaterialCosts(resma, { widthMm: 210, heightMm: 297 }).estimatedCutUnitCost - (750 / 2250)) < 0.000001);

const linearPurchase = normalizeMaterialConfiguration({
  acquisition: { mode: "linear-meter", paidAmount: 400, purchaseQuantity: 20, rollWidthMm: 580 },
});
const linearCosts = calculateMaterialCosts(linearPurchase, { widthMm: 100, heightMm: 200 });
assert.equal(linearCosts.costPerLinearMeter, 20);
assert.ok(Math.abs(linearCosts.costPerSquareMeter - (20 / 0.58)) < 0.000001);
assert.ok(Math.abs(linearCosts.estimatedCutUnitCost - 0.8) < 0.000001);

const fullRoll = normalizeMaterialConfiguration({
  acquisition: { mode: "roll", paidAmount: 400, purchaseQuantity: 2, rollWidthMm: 580, rollLengthM: 20 },
});
const rollCosts = calculateMaterialCosts(fullRoll);
assert.equal(rollCosts.costPerLinearMeter, 10);
assert.ok(Math.abs(rollCosts.costPerSquareMeter - (10 / 0.58)) < 0.000001);

const squareMeterPurchase = normalizeMaterialConfiguration({
  acquisition: { mode: "square-meter", paidAmount: 500, purchaseQuantity: 10 },
});
assert.equal(calculateMaterialCosts(squareMeterPurchase, { widthMm: 1000, heightMm: 1000 }).estimatedCutUnitCost, 50);

console.log("calculation-base: sheet yield and acquisition cost assertions passed");
