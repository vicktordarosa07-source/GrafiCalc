function isStrongSecret(value) {
  if (typeof value !== "string" || !/^[\x21-\x7e]{32,255}$/.test(value)
    || new Set(value).size < 12 || /(.)\1{7}/.test(value)) return false;
  const normalized = value.toLowerCase();
  const sequences = ["0123456789abcdefghijklmnopqrstuvwxyz", "qwertyuiopasdfghjklzxcvbnm"];
  return sequences.every((sequence) => {
    const candidates = [sequence, [...sequence].reverse().join("")];
    return candidates.every((candidate) => {
      for (let index = 0; index <= candidate.length - 8; index += 1) {
        if (normalized.includes(candidate.slice(index, index + 8))) return false;
      }
      return true;
    });
  });
}

module.exports = { isStrongSecret };
