function onlyDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

export function formatClientDocument(value, personType = "individual") {
  const digits = onlyDigits(value).slice(0, personType === "legal" ? 14 : 11);
  if (personType === "legal") {
    return digits
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2}\.\d{3})(\d)/, "$1.$2")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3}\.\d{3})(\d)/, "$1.$2")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

export function formatBrazilianPhone(value) {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function countDigitsBefore(value, position) {
  return onlyDigits(String(value).slice(0, position)).length;
}

function positionAfterDigits(value, digitCount) {
  if (digitCount <= 0) return 0;
  let seen = 0;
  for (let index = 0; index < value.length; index += 1) {
    if (/\d/.test(value[index])) seen += 1;
    if (seen >= digitCount) return index + 1;
  }
  return value.length;
}

export function formatValuePreservingSelection(value, selectionStart, selectionEnd, formatter, selectionDirection = "none") {
  const original = String(value ?? "");
  const formatted = String(formatter(original));
  if (!Number.isInteger(selectionStart) || !Number.isInteger(selectionEnd)) {
    return { value: formatted, selectionStart: null, selectionEnd: null, selectionDirection: "none" };
  }
  return {
    value: formatted,
    selectionStart: positionAfterDigits(formatted, countDigitsBefore(original, selectionStart)),
    selectionEnd: positionAfterDigits(formatted, countDigitsBefore(original, selectionEnd)),
    selectionDirection: ["forward", "backward", "none"].includes(selectionDirection) ? selectionDirection : "none",
  };
}

export function applyInputFormatterPreservingSelection(input, formatter) {
  if (!input) return;
  const result = formatValuePreservingSelection(input.value, input.selectionStart, input.selectionEnd, formatter, input.selectionDirection);
  if (result.value === input.value) return;
  input.value = result.value;
  if (result.selectionStart !== null && typeof input.setSelectionRange === "function") {
    input.setSelectionRange(result.selectionStart, result.selectionEnd, result.selectionDirection);
  }
}
