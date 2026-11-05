function isValidGroupedInteger(value, separator) {
  const groups = value.split(separator);
  return groups.length > 1
    && groups[0].length >= 1
    && groups[0].length <= 3
    && /^\d+$/.test(groups[0])
    && groups.slice(1).every((group) => /^\d{3}$/.test(group));
}

function isValidInteger(value) {
  return value === "" || /^\d+$/.test(value);
}

export function normalizeNumberInput(value) {
  let raw = String(value ?? "").trim().replace(/\s/g, "");
  if (!raw) return "";

  let sign = "";
  if (raw[0] === "-" || raw[0] === "+") {
    sign = raw[0] === "-" ? "-" : "";
    raw = raw.slice(1);
  }
  if (!raw || /[^\d.,eE+-]/.test(raw)) return "";

  if (/[eE]/.test(raw)) {
    if (!/^\d+(?:[.,]\d*)?[eE][+-]?\d+$/.test(raw)) return "";
    const exponentValue = Number(raw.replace(",", "."));
    return Number.isFinite(exponentValue) ? String(exponentValue) : "";
  }

  const commaIndex = raw.lastIndexOf(",");
  const dotIndex = raw.lastIndexOf(".");
  if (commaIndex >= 0 && dotIndex >= 0) {
    const decimalSeparator = commaIndex > dotIndex ? "," : ".";
    const groupingSeparator = decimalSeparator === "," ? "." : ",";
    if (raw.split(decimalSeparator).length !== 2) return "";
    const [integerPart, fractionPart] = raw.split(decimalSeparator);
    if (!/^\d*$/.test(fractionPart)) return "";
    if (integerPart.includes(groupingSeparator)) {
      if (!isValidGroupedInteger(integerPart, groupingSeparator)) return "";
    } else if (!isValidInteger(integerPart)) {
      return "";
    }
    const integerDigits = integerPart.split(groupingSeparator).join("") || "0";
    return `${sign}${integerDigits}${fractionPart ? `.${fractionPart}` : "."}`;
  }

  const separator = commaIndex >= 0 ? "," : dotIndex >= 0 ? "." : "";
  if (!separator) return /^\d+$/.test(raw) ? `${sign}${raw}` : "";

  const count = raw.split(separator).length - 1;
  if (count > 1) {
    return isValidGroupedInteger(raw, separator) ? `${sign}${raw.split(separator).join("")}` : "";
  }

  const [integerPart, fractionPart] = raw.split(separator);
  if (!isValidInteger(integerPart) || !/^\d*$/.test(fractionPart)) return "";
  return `${sign}${integerPart || "0"}${fractionPart ? `.${fractionPart}` : "."}`;
}

export function parseLocalizedNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const normalized = normalizeNumberInput(value);
  if (!normalized || normalized === "." || normalized === "-.") return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}
