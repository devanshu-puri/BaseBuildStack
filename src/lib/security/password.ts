/**
 * OWASP & NIST compliant password hashing using standard Web Crypto API (PBKDF2 with SHA-256).
 * Compatible across Node.js runtime and Edge runtimes with zero external dependencies.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
  const enc = new TextEncoder();
  const keyMaterial = await globalThis.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const derived = await globalThis.crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 100_000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );

  const saltHex = Array.from(salt)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const hashHex = Array.from(new Uint8Array(derived))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return `${saltHex}:${hashHex}`;
}

/**
 * Constant-time password verification using Web Crypto API.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [saltHex, keyHex] = storedHash.split(":");
  if (!saltHex || !keyHex || saltHex.length !== 32) return false;

  try {
    const saltBytes = new Uint8Array(
      saltHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
    );
    const enc = new TextEncoder();
    const keyMaterial = await globalThis.crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );
    const derived = await globalThis.crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: saltBytes,
        iterations: 100_000,
        hash: "SHA-256",
      },
      keyMaterial,
      256
    );

    const derivedHex = Array.from(new Uint8Array(derived))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Constant-time length and character check
    if (derivedHex.length !== keyHex.length) return false;
    let diff = 0;
    for (let i = 0; i < derivedHex.length; i++) {
      diff |= derivedHex.charCodeAt(i) ^ keyHex.charCodeAt(i);
    }
    return diff === 0;
  } catch {
    return false;
  }
}
