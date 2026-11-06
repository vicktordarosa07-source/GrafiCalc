import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function hashEmployeePin(pin: string, salt = randomBytes(16).toString("hex")) {
  return { salt, hash: scryptSync(pin, salt, 64).toString("hex") };
}

export function verifyEmployeePin(pin: string, salt: string, hash: string) {
  try {
    const actual = scryptSync(pin, salt, 64);
    const expected = Buffer.from(hash, "hex");
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch { return false; }
}
