/**
 * Deterministic Cryptographic & Hashing Primitives for Dead Air V0.4.1
 *
 * Implements:
 * 1. FIPS 180-4 SHA-256 (synchronous, zero-dependency, browser + Node compatible)
 * 2. FoxIO JA4 TLS ClientHello Fingerprint calculation from raw handshake fields
 * 3. FIPS 186-4 ECDSA-P256 (secp256r1 / prime256v1) signature verification over BigInt
 */

const SHA256_K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
  0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
  0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
  0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
  0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
  0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

function rotr32(x: number, n: number): number {
  return (x >>> n) | (x << (32 - n));
}

/**
 * Pure FIPS 180-4 SHA-256 implementation returning lowercase hex digest.
 */
export function sha256Hex(input: string | Uint8Array): string {
  const bytes =
    typeof input === 'string' ? new TextEncoder().encode(input) : input;

  const bitLen = bytes.length * 8;
  const padLen = ((bytes.length + 9 + 63) & ~63);
  const padded = new Uint8Array(padLen);
  padded.set(bytes, 0);
  padded[bytes.length] = 0x80;

  const view = new DataView(padded.buffer);
  const highBits = Math.floor(bitLen / 0x100000000);
  const lowBits = bitLen >>> 0;
  view.setUint32(padLen - 8, highBits, false);
  view.setUint32(padLen - 4, lowBits, false);

  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;

  const w = new Uint32Array(64);

  for (let offset = 0; offset < padLen; offset += 64) {
    for (let i = 0; i < 16; i++) {
      w[i] = view.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 64; i++) {
      const s0 =
        rotr32(w[i - 15], 7) ^ rotr32(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 =
        rotr32(w[i - 2], 17) ^ rotr32(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;

    for (let i = 0; i < 64; i++) {
      const S1 = rotr32(e, 6) ^ rotr32(e, 11) ^ rotr32(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + SHA256_K[i] + w[i]) >>> 0;
      const S0 = rotr32(a, 2) ^ rotr32(a, 13) ^ rotr32(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  return [h0, h1, h2, h3, h4, h5, h6, h7]
    .map((word) => word.toString(16).padStart(8, '0'))
    .join('');
}

// ============================================================================
// JA4 TLS ClientHello Fingerprint Computation (FoxIO Specification)
// ============================================================================

const TLS_GREASE_SET = new Set([
  '0a0a',
  '1a1a',
  '2a2a',
  '3a3a',
  '4a4a',
  '5a5a',
  '6a6a',
  '7a7a',
  '8a8a',
  '9a9a',
  'aaaa',
  'baba',
  'caca',
  'dada',
  'eaea',
  'fafa',
]);

export function isGreaseHex(hexCode: string): boolean {
  const norm = hexCode.trim().toLowerCase().replace(/^0x/, '');
  return TLS_GREASE_SET.has(norm);
}

export interface Ja4ClientHelloInput {
  transport: 't' | 'q' | 'd';
  tlsVersion: '1.3' | '1.2' | '1.1' | '1.0';
  sniPresent: boolean;
  sniHostname?: string;
  cipherSuitesHex: string[];
  extensionsHex: string[];
  signatureAlgorithmsHex?: string[];
  alpn?: string;
}

export interface Ja4ComputationResult {
  ja4: string;
  ja4_a: string;
  ja4_b: string;
  ja4_c: string;
  nonGreaseCiphers: string[];
  sortedCiphersCsv: string;
  nonGreaseExtensionsCount: number;
  sortedExtensionsForHash: string[];
  nonGreaseSigAlgsInWireOrder: string[];
  ja4_c_rawInput: string;
}

function normalizeHex4(code: string): string {
  return code.trim().toLowerCase().replace(/^0x/, '').padStart(4, '0');
}

function deriveAlpnCode(alpn?: string): string {
  if (!alpn || !alpn.trim()) {
    return '00';
  }
  const clean = alpn.trim();
  const first = clean[0];
  const last = clean[clean.length - 1];
  const isAlnum = (ch: string) => /^[0-9a-zA-Z]$/.test(ch);
  if (isAlnum(first) && isAlnum(last)) {
    return `${first}${last}`.toLowerCase();
  }
  const hex = clean
    .split('')
    .map((c) => c.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('');
  return `${hex[0]}${hex[hex.length - 1]}`.toLowerCase();
}

/**
 * Computes canonical JA4 fingerprint strictly from ClientHello fields:
 * - Excludes GREASE values from cipher counts, extension counts, cipher lists, extension lists, and signature algorithms.
 * - Counts SNI ('0000') and ALPN ('0010') in JA4_a's 2-digit extension count, but excludes them from JA4_c's sorted extension hash list.
 * - Preserves wire order of signatureAlgorithmsHex (after GREASE removal) appended with '_' to the sorted extension list for JA4_c.
 */
export function computeCanonicalJa4(
  input: Ja4ClientHelloInput
): Ja4ComputationResult {
  const proto = input.transport || 't';
  const versionMap: Record<string, string> = {
    '1.3': '13',
    '1.2': '12',
    '1.1': '11',
    '1.0': '10',
  };
  const ver = versionMap[input.tlsVersion] || '00';
  const hasDomainSni =
    Boolean(input.sniPresent) &&
    typeof input.sniHostname === 'string' &&
    input.sniHostname.trim().length > 0;
  const sniChar = hasDomainSni ? 'd' : 'i';

  const nonGreaseCiphers = input.cipherSuitesHex
    .map(normalizeHex4)
    .filter((c) => !isGreaseHex(c));

  const nonGreaseExtensions = input.extensionsHex
    .map(normalizeHex4)
    .filter((e) => !isGreaseHex(e));

  const cipherCountStr = String(Math.min(99, nonGreaseCiphers.length)).padStart(
    2,
    '0'
  );
  const extCountStr = String(
    Math.min(99, nonGreaseExtensions.length)
  ).padStart(2, '0');
  const alpnChars = deriveAlpnCode(input.alpn);

  const ja4_a = `${proto}${ver}${sniChar}${cipherCountStr}${extCountStr}${alpnChars}`;

  const sortedCiphers = [...nonGreaseCiphers].sort();
  const sortedCiphersCsv = sortedCiphers.join(',');
  const ja4_b =
    sortedCiphers.length === 0
      ? '000000000000'
      : sha256Hex(sortedCiphersCsv).slice(0, 12);

  // JA4_c excludes SNI (0000) and ALPN (0010) from the hashed extension list and sorts the remaining extensions
  const sortedExtensionsForHash = nonGreaseExtensions
    .filter((ext) => ext !== '0000' && ext !== '0010')
    .sort();

  const nonGreaseSigAlgsInWireOrder = (input.signatureAlgorithmsHex || [])
    .map(normalizeHex4)
    .filter((sig) => !isGreaseHex(sig));

  let ja4_c_rawInput = sortedExtensionsForHash.join(',');
  if (
    sortedExtensionsForHash.length > 0 &&
    nonGreaseSigAlgsInWireOrder.length > 0
  ) {
    ja4_c_rawInput = `${ja4_c_rawInput}_${nonGreaseSigAlgsInWireOrder.join(',')}`;
  } else if (
    sortedExtensionsForHash.length === 0 &&
    nonGreaseSigAlgsInWireOrder.length > 0
  ) {
    ja4_c_rawInput = nonGreaseSigAlgsInWireOrder.join(',');
  }

  const ja4_c =
    ja4_c_rawInput.length === 0
      ? '000000000000'
      : sha256Hex(ja4_c_rawInput).slice(0, 12);

  const ja4 = `${ja4_a}_${ja4_b}_${ja4_c}`;

  return {
    ja4,
    ja4_a,
    ja4_b,
    ja4_c,
    nonGreaseCiphers,
    sortedCiphersCsv,
    nonGreaseExtensionsCount: nonGreaseExtensions.length,
    sortedExtensionsForHash,
    nonGreaseSigAlgsInWireOrder,
    ja4_c_rawInput,
  };
}

// ============================================================================
// FIPS 186-4 ECDSA-P256 (secp256r1 / prime256v1) Verification
// ============================================================================

const P256_P = BigInt(
  '0xffffffff00000001000000000000000000000000ffffffffffffffffffffffff'
);
const P256_A = P256_P - 3n;
const P256_B = BigInt(
  '0x5ac635d8aa3a93e7b3ebbd55769886bc651d06b0cc53b0f63bce3c3e27d2604b'
);
const P256_N = BigInt(
  '0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551'
);
const P256_GX = BigInt(
  '0x6b17d1f2e12c4247f8bce6e563a440f277037d812deb33a0f4a13945d898c296'
);
const P256_GY = BigInt(
  '0x4fe342e2fe1a7f9b8ee7eb4a7c0f9e162bce33576b315ececbb6406837bf51f5'
);

interface EcPoint {
  x: bigint;
  y: bigint;
  infinity: boolean;
}

const POINT_AT_INFINITY: EcPoint = { x: 0n, y: 0n, infinity: true };
const P256_G: EcPoint = { x: P256_GX, y: P256_GY, infinity: false };

function mod(a: bigint, m: bigint): bigint {
  const res = a % m;
  return res >= 0n ? res : res + m;
}

function modInv(a: bigint, m: bigint): bigint {
  let t = 0n;
  let newT = 1n;
  let r = m;
  let newR = mod(a, m);

  while (newR !== 0n) {
    const quotient = r / newR;
    [t, newT] = [newT, t - quotient * newT];
    [r, newR] = [newR, r - quotient * newR];
  }
  if (r > 1n) {
    throw new Error('Value is not invertible');
  }
  return t < 0n ? t + m : t;
}

function isPointOnP256(pt: EcPoint): boolean {
  if (pt.infinity) return false;
  if (pt.x <= 0n || pt.x >= P256_P || pt.y <= 0n || pt.y >= P256_P) {
    return false;
  }
  const lhs = mod(pt.y * pt.y, P256_P);
  const rhs = mod(pt.x * pt.x * pt.x + P256_A * pt.x + P256_B, P256_P);
  return lhs === rhs;
}

function pointAdd(p1: EcPoint, p2: EcPoint): EcPoint {
  if (p1.infinity) return p2;
  if (p2.infinity) return p1;

  if (p1.x === p2.x) {
    if (mod(p1.y + p2.y, P256_P) === 0n) {
      return POINT_AT_INFINITY;
    }
    // Point doubling
    const num = mod(3n * p1.x * p1.x + P256_A, P256_P);
    const den = modInv(mod(2n * p1.y, P256_P), P256_P);
    const lambda = mod(num * den, P256_P);
    const x3 = mod(lambda * lambda - 2n * p1.x, P256_P);
    const y3 = mod(lambda * (p1.x - x3) - p1.y, P256_P);
    return { x: x3, y: y3, infinity: false };
  }

  const num = mod(p2.y - p1.y, P256_P);
  const den = modInv(mod(p2.x - p1.x, P256_P), P256_P);
  const lambda = mod(num * den, P256_P);
  const x3 = mod(lambda * lambda - p1.x - p2.x, P256_P);
  const y3 = mod(lambda * (p1.x - x3) - p1.y, P256_P);
  return { x: x3, y: y3, infinity: false };
}

function pointMultiply(k: bigint, pt: EcPoint): EcPoint {
  let result: EcPoint = POINT_AT_INFINITY;
  let addend: EcPoint = pt;
  let scalar = k;

  while (scalar > 0n) {
    if ((scalar & 1n) === 1n) {
      result = pointAdd(result, addend);
    }
    addend = pointAdd(addend, addend);
    scalar >>= 1n;
  }
  return result;
}

function parseDerEcdsaSignature(sigHex: string): { r: bigint; s: bigint } | null {
  const clean = sigHex.trim().toLowerCase().replace(/^0x/, '');
  if (!/^[0-9a-f]+$/.test(clean) || clean.length % 2 !== 0) {
    return null;
  }
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }

  // ASN.1 SEQUENCE (0x30)
  if (bytes.length < 8 || bytes[0] !== 0x30) {
    return null;
  }
  const seqLen = bytes[1];
  if (seqLen + 2 !== bytes.length) {
    return null;
  }

  // First INTEGER: r (0x02)
  if (bytes[2] !== 0x02) return null;
  const rLen = bytes[3];
  if (rLen < 1 || rLen > 33 || 4 + rLen >= bytes.length) return null;
  const rHex = clean.slice(8, 8 + rLen * 2);

  // Second INTEGER: s (0x02)
  const sOffset = 4 + rLen;
  if (bytes[sOffset] !== 0x02) return null;
  const sLen = bytes[sOffset + 1];
  if (sLen < 1 || sLen > 33 || sOffset + 2 + sLen !== bytes.length) {
    return null;
  }
  const sHex = clean.slice((sOffset + 2) * 2, (sOffset + 2 + sLen) * 2);

  return {
    r: BigInt('0x' + rHex),
    s: BigInt('0x' + sHex),
  };
}

function parseUncompressedPublicKeyP256(pubKeyHex: string): EcPoint | null {
  const clean = pubKeyHex.trim().toLowerCase().replace(/^0x/, '');
  // Uncompressed P-256 point is 04 || 32-byte X || 32-byte Y = 130 hex chars
  if (!/^04[0-9a-f]{128}$/.test(clean)) {
    return null;
  }
  const x = BigInt('0x' + clean.slice(2, 66));
  const y = BigInt('0x' + clean.slice(66, 130));
  const pt: EcPoint = { x, y, infinity: false };
  return isPointOnP256(pt) ? pt : null;
}

/**
 * Verifies an ECDSA-P256 (secp256r1) SHA-256 signature against an uncompressed public key.
 */
export function verifyEcdsaP256Sha256(
  payloadUtf8: string,
  signatureDerHex: string,
  publicKeyUncompressedHex: string
): boolean {
  try {
    const pubPoint = parseUncompressedPublicKeyP256(publicKeyUncompressedHex);
    if (!pubPoint) return false;

    const parsedSig = parseDerEcdsaSignature(signatureDerHex);
    if (!parsedSig) return false;

    const { r, s } = parsedSig;
    if (r < 1n || r >= P256_N || s < 1n || s >= P256_N) {
      return false;
    }

    const digestHex = sha256Hex(payloadUtf8);
    const e = mod(BigInt('0x' + digestHex), P256_N);
    const w = modInv(s, P256_N);
    const u1 = mod(e * w, P256_N);
    const u2 = mod(r * w, P256_N);

    const p1 = pointMultiply(u1, P256_G);
    const p2 = pointMultiply(u2, pubPoint);
    const R = pointAdd(p1, p2);

    if (R.infinity) return false;
    return mod(R.x, P256_N) === r;
  } catch {
    return false;
  }
}
