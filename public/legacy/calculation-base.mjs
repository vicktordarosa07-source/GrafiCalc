export const MATERIAL_ACQUISITION_MODES = ["ream", "box", "unit", "roll", "square-meter", "linear-meter"];
export const MATERIAL_SALE_MODES = ["unit", "fixed-size", "square-meter", "linear-meter"];
export const PRINT_PROCESS_BILLING_MODES = ["per-sheet", "per-side", "front-back"];
export const FINISH_BILLING_MODES = ["unit", "square-meter", "linear-meter"];

const MODES_WITH_SHEET_STOCK = new Set(["ream", "box", "unit"]);

function positive(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function uniqueStrings(values) {
  return [...new Set((Array.isArray(values) ? values : []).filter((value) => typeof value === "string" && value.trim()).map((value) => value.trim().slice(0, 120)))];
}

export function normalizePrintProcess(candidate = {}) {
  return {
    id: String(candidate?.id || "").trim().slice(0, 100),
    name: String(candidate?.name || "").trim().slice(0, 100),
    technology: String(candidate?.technology || "").trim().slice(0, 100),
    colorMode: ["monochrome", "color", "both"].includes(candidate?.colorMode) ? candidate.colorMode : "both",
    costEnabled: candidate?.costEnabled === true,
    billingMode: PRINT_PROCESS_BILLING_MODES.includes(candidate?.billingMode) ? candidate.billingMode : "per-sheet",
    costPerSheet: Math.max(0, Number(candidate?.costPerSheet) || 0),
    costPerSide: Math.max(0, Number(candidate?.costPerSide) || 0),
    frontSideCost: Math.max(0, Number(candidate?.frontSideCost) || 0),
    backSideCost: Math.max(0, Number(candidate?.backSideCost) || 0),
  };
}

export function calculatePrintChargeUnits(rawProcess, usage = {}) {
  const process = normalizePrintProcess(rawProcess);
  const sheets = Math.max(0, Number(usage.sheets) || 0);
  const frontSides = Math.max(0, Number(usage.frontSides) || 0);
  const backSides = Math.max(0, Number(usage.backSides) || 0);
  if (process.billingMode === "per-sheet") return { sheets, frontSides: 0, backSides: 0, totalUnits: sheets };
  if (process.billingMode === "per-side") {
    const totalUnits = frontSides + backSides;
    return { sheets: 0, frontSides: totalUnits, backSides: 0, totalUnits };
  }
  return { sheets: 0, frontSides, backSides, totalUnits: frontSides + backSides };
}

export function calculatePrintProcessCost(rawProcess, usage = {}) {
  const process = normalizePrintProcess(rawProcess);
  if (!process.costEnabled) return { costConfigured: false, totalCost: null };
  const units = calculatePrintChargeUnits(process, usage);
  let totalCost = 0;
  if (process.billingMode === "per-sheet") totalCost = process.costPerSheet * units.sheets;
  else if (process.billingMode === "per-side") totalCost = process.costPerSide * units.totalUnits;
  else totalCost = process.frontSideCost * units.frontSides + process.backSideCost * units.backSides;
  return { costConfigured: true, totalCost };
}

export function normalizeCalculationFinish(candidate = {}) {
  const variants = Array.isArray(candidate?.variants)
    ? candidate.variants.filter((variant) => variant && typeof variant === "object").map((variant, index) => ({
        id: String(variant.id || `format-${index + 1}`).slice(0, 80),
        label: String(variant.label || "").trim().slice(0, 80),
        baseValue: Math.max(0, Number(variant.baseValue) || 0),
      })).filter((variant) => variant.label)
    : [];
  const reductions = Array.isArray(candidate?.reductionTiers)
    ? candidate.reductionTiers.filter((tier) => tier && typeof tier === "object").map((tier, index) => ({
        id: String(tier.id || `reduction-${index + 1}`).slice(0, 80),
        minQuantity: Math.max(2, Math.floor(positive(tier.minQuantity) || 2)),
        discountPercent: Math.min(100, Math.max(0, Number(tier.discountPercent) || 0)),
      })).sort((a, b) => a.minQuantity - b.minQuantity)
    : [];
  return {
    id: String(candidate?.id || "").trim().slice(0, 100),
    name: String(candidate?.name || "").trim().slice(0, 120),
    billingMode: FINISH_BILLING_MODES.includes(candidate?.billingMode) ? candidate.billingMode : "unit",
    unitLabel: String(candidate?.unitLabel || "").trim().slice(0, 40),
    baseValue: Math.max(0, Number(candidate?.baseValue) || 0),
    variants,
    reductionTiers: reductions,
  };
}

export function calculateFinishPrice(rawFinish, usage = {}) {
  const finish = normalizeCalculationFinish(rawFinish);
  const quantity = Math.max(0, Number(usage.quantity) || 0);
  const measure = finish.billingMode === "unit"
    ? quantity
    : Math.max(0, Number(usage.measure) || 0);
  const requestedFormat = String(usage.format || "").trim().toLocaleLowerCase();
  const variant = finish.variants.find((item) => item.label.toLocaleLowerCase() === requestedFormat);
  const tier = [...finish.reductionTiers].reverse().find((item) => quantity >= item.minQuantity);
  const discountPercent = tier?.discountPercent || 0;
  const baseTotal = (variant?.baseValue ?? finish.baseValue) * measure;
  return {
    baseTotal,
    discountPercent,
    discountAmount: baseTotal * discountPercent / 100,
    total: baseTotal * (1 - discountPercent / 100),
    billableMeasure: measure,
    selectedFormat: variant?.label || "",
  };
}

export function normalizeMaterialConfiguration(candidate = {}) {
  const acquisitionCandidate = candidate?.acquisition && typeof candidate.acquisition === "object" ? candidate.acquisition : {};
  const compatibility = candidate?.compatibility && typeof candidate.compatibility === "object" ? candidate.compatibility : {};
  const hasLegacyCost = Number(acquisitionCandidate.paidAmount) > 0;
  const trackCosts = typeof acquisitionCandidate.trackCosts === "boolean" ? acquisitionCandidate.trackCosts : hasLegacyCost;
  const priceTiers = Array.isArray(candidate?.priceTiers)
    ? candidate.priceTiers
        .filter((tier) => tier && typeof tier === "object")
        .map((tier, index) => ({
          id: String(tier.id || `tier-${index + 1}`).slice(0, 80),
          mode: MATERIAL_SALE_MODES.includes(tier.mode) ? tier.mode : "fixed-size",
          format: String(tier.format || "").trim().slice(0, 80),
          minQuantity: Math.max(1, Math.floor(positive(tier.minQuantity) || 1)),
          withoutPrint: Math.max(0, Number(tier.withoutPrint) || 0),
          withPrint: Math.max(0, Number(tier.withPrint) || 0),
        }))
    : [];

  return {
    acquisition: {
      mode: MATERIAL_ACQUISITION_MODES.includes(acquisitionCandidate.mode) ? acquisitionCandidate.mode : "unit",
      trackCosts,
      paidAmount: Math.max(0, Number(acquisitionCandidate.paidAmount) || 0),
      purchaseQuantity: positive(acquisitionCandidate.purchaseQuantity) || 1,
      unitsPerPurchase: positive(acquisitionCandidate.unitsPerPurchase) || 1,
      sheetWidthMm: positive(acquisitionCandidate.sheetWidthMm),
      sheetHeightMm: positive(acquisitionCandidate.sheetHeightMm),
      rollWidthMm: positive(acquisitionCandidate.rollWidthMm),
      rollLengthM: positive(acquisitionCandidate.rollLengthM),
    },
    saleModes: uniqueStrings(candidate?.saleModes).filter((mode) => MATERIAL_SALE_MODES.includes(mode)),
    priceTiers,
    compatibility: {
      processIds: uniqueStrings(compatibility.processIds),
      finishIds: uniqueStrings(compatibility.finishIds),
    },
  };
}

function rowPackingYield(stockWidthMm, stockHeightMm, itemWidthMm, itemHeightMm) {
  const scale = 10;
  const width = Math.round(stockWidthMm * scale);
  const height = Math.round(stockHeightMm * scale);
  const itemWidth = Math.round(itemWidthMm * scale);
  const itemHeight = Math.round(itemHeightMm * scale);
  if (![width, height, itemWidth, itemHeight].every((value) => value > 0) || height > 100_000) return 0;

  const rowOptions = [
    { height: itemHeight, count: Math.floor(width / itemWidth) },
    { height: itemWidth, count: Math.floor(width / itemHeight) },
  ].filter((row) => row.height > 0 && row.count > 0);
  if (!rowOptions.length) return 0;

  const bestAtHeight = new Int32Array(height + 1);
  bestAtHeight.fill(-1);
  bestAtHeight[0] = 0;
  let best = 0;
  for (let usedHeight = 0; usedHeight <= height; usedHeight += 1) {
    if (bestAtHeight[usedHeight] < 0) continue;
    best = Math.max(best, bestAtHeight[usedHeight]);
    for (const row of rowOptions) {
      const nextHeight = usedHeight + row.height;
      if (nextHeight <= height) {
        bestAtHeight[nextHeight] = Math.max(bestAtHeight[nextHeight], bestAtHeight[usedHeight] + row.count);
      }
    }
  }
  return best;
}

export function calculateSheetYield(stockWidthMm, stockHeightMm, itemWidthMm, itemHeightMm) {
  const values = [stockWidthMm, stockHeightMm, itemWidthMm, itemHeightMm].map(positive);
  if (values.some((value) => value <= 0)) return 0;
  return rowPackingYield(...values);
}

function calculateRollPieceLinearUsage(rollWidthMm, itemWidthMm, itemHeightMm) {
  const width = positive(rollWidthMm);
  const itemWidth = positive(itemWidthMm);
  const itemHeight = positive(itemHeightMm);
  if (!width || !itemWidth || !itemHeight) return 0;
  const orientationA = Math.floor(width / itemWidth);
  const orientationB = Math.floor(width / itemHeight);
  const usageA = orientationA ? itemHeight / 1000 / orientationA : Infinity;
  const usageB = orientationB ? itemWidth / 1000 / orientationB : Infinity;
  const result = Math.min(usageA, usageB);
  return Number.isFinite(result) ? result : 0;
}

export function calculateMaterialCosts(rawMaterial, cutSize = {}) {
  const material = normalizeMaterialConfiguration(rawMaterial);
  const acquisition = material.acquisition;
  const paid = acquisition.paidAmount;
  const purchaseQuantity = acquisition.purchaseQuantity;
  const cutWidthMm = positive(cutSize.widthMm);
  const cutHeightMm = positive(cutSize.heightMm);
  let costPerUnit = 0;
  let costPerSquareMeter = 0;
  let costPerLinearMeter = 0;
  let piecesPerStockSheet = 0;
  let estimatedCutUnitCost = 0;

  if (!acquisition.trackCosts) {
    return { costConfigured: false, costPerUnit, costPerSquareMeter, costPerLinearMeter, piecesPerStockSheet, estimatedCutUnitCost };
  }

  if (MODES_WITH_SHEET_STOCK.has(acquisition.mode)) {
    const hasStockSize = acquisition.sheetWidthMm > 0 && acquisition.sheetHeightMm > 0;
    if (hasStockSize) {
      const parentSheetCount = purchaseQuantity * acquisition.unitsPerPurchase;
      const parentArea = (acquisition.sheetWidthMm * acquisition.sheetHeightMm) / 1_000_000;
      costPerSquareMeter = parentArea && parentSheetCount ? paid / (parentArea * parentSheetCount) : 0;
      costPerUnit = parentSheetCount ? paid / parentSheetCount : 0;
      if (cutWidthMm && cutHeightMm) {
        piecesPerStockSheet = calculateSheetYield(acquisition.sheetWidthMm, acquisition.sheetHeightMm, cutWidthMm, cutHeightMm);
        estimatedCutUnitCost = piecesPerStockSheet && parentSheetCount ? paid / (piecesPerStockSheet * parentSheetCount) : 0;
      }
    } else {
      const purchasedUnits = purchaseQuantity * acquisition.unitsPerPurchase;
      costPerUnit = purchasedUnits ? paid / purchasedUnits : 0;
    }
  } else if (acquisition.mode === "square-meter") {
    costPerSquareMeter = purchaseQuantity ? paid / purchaseQuantity : 0;
  } else if (acquisition.mode === "linear-meter") {
    costPerLinearMeter = purchaseQuantity ? paid / purchaseQuantity : 0;
    costPerSquareMeter = acquisition.rollWidthMm ? costPerLinearMeter / (acquisition.rollWidthMm / 1000) : 0;
  } else if (acquisition.mode === "roll") {
    const rollWidthM = acquisition.rollWidthMm / 1000;
    const totalLinearMeters = purchaseQuantity * acquisition.rollLengthM;
    const totalArea = totalLinearMeters * rollWidthM;
    costPerLinearMeter = totalLinearMeters ? paid / totalLinearMeters : 0;
    costPerSquareMeter = totalArea ? paid / totalArea : 0;
  }

  if (cutWidthMm && cutHeightMm) {
    if (["roll", "linear-meter"].includes(acquisition.mode) && acquisition.rollWidthMm) {
      const linearUsage = calculateRollPieceLinearUsage(acquisition.rollWidthMm, cutWidthMm, cutHeightMm);
      estimatedCutUnitCost = linearUsage * costPerLinearMeter;
    } else if (["square-meter", "linear-meter"].includes(acquisition.mode)) {
      const area = (cutWidthMm * cutHeightMm) / 1_000_000;
      estimatedCutUnitCost = area * costPerSquareMeter;
    } else if (!piecesPerStockSheet) {
      estimatedCutUnitCost = costPerSquareMeter * ((cutWidthMm * cutHeightMm) / 1_000_000);
    }
  }

  return {
    costConfigured: true,
    costPerUnit,
    costPerSquareMeter,
    costPerLinearMeter,
    piecesPerStockSheet,
    estimatedCutUnitCost,
  };
}
