// Standalone round-trip assertions for the share encoding in lib/readiness/share.ts.
// Run with: node scripts/test-share-encoding.mjs
// Duplicates the encoding logic — does not import TypeScript source.

const QUESTION_ORDER = [
  "gov-0","gov-1","gov-2","gov-3",
  "data-0","data-1","data-2","data-3",
  "audit-0","audit-1","audit-2","audit-3",
  "ops-0","ops-1","ops-2","ops-3",
  "auto-0","auto-1","auto-2","auto-3",
]

function encode(answers) {
  const bytes = new Uint8Array(QUESTION_ORDER.map((k) => answers[k] ?? 0))
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")
}

function decode(s) {
  try {
    const padded = s.replace(/-/g, "+").replace(/_/g, "/")
    const binary = atob(padded)
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
    if (bytes.length < QUESTION_ORDER.length) return {}
    const result = {}
    QUESTION_ORDER.forEach((key, i) => {
      const v = bytes[i]
      if (v === 0 || v === 1 || v === 2) result[key] = v
    })
    return result
  } catch { return {} }
}

let pass = 0, fail = 0
const assert = (ok, msg) => {
  if (ok) { console.log(`  ✓ ${msg}`); pass++ }
  else     { console.error(`  ✗ ${msg}`); fail++ }
}

// 1. All-zeros survive round-trip (zeros are the tricky case — btoa must not truncate)
const zeros = Object.fromEntries(QUESTION_ORDER.map((k) => [k, 0]))
const zDecoded = decode(encode(zeros))
assert(QUESTION_ORDER.every((k) => zDecoded[k] === 0), "all-zeros round-trip")

// 2. All-twos round-trip
const twos = Object.fromEntries(QUESTION_ORDER.map((k) => [k, 2]))
const tDecoded = decode(encode(twos))
assert(QUESTION_ORDER.every((k) => tDecoded[k] === 2), "all-twos round-trip")

// 3. Mixed values, spot-check several keys
const mixed = {
  ...Object.fromEntries(QUESTION_ORDER.map((k) => [k, 1])),
  "gov-0": 0, "gov-2": 2, "audit-0": 0, "auto-3": 2,
}
const mDecoded = decode(encode(mixed))
assert(mDecoded["gov-0"] === 0,    "mixed: gov-0 = 0")
assert(mDecoded["gov-1"] === 1,    "mixed: gov-1 = 1")
assert(mDecoded["gov-2"] === 2,    "mixed: gov-2 = 2")
assert(mDecoded["audit-0"] === 0,  "mixed: audit-0 = 0")
assert(mDecoded["auto-3"] === 2,   "mixed: auto-3 = 2")

// 4. Invalid input returns empty object, not a crash
const inv = decode("!!!this-is-not-base64!!!")
assert(Object.keys(inv).length === 0, "invalid input returns empty object")

// 5. Encoding is compact
const enc = encode(twos)
assert(enc.length <= 28, `compact encoding (${enc.length} chars, expected ≤ 28)`)

// 6. Encode is URL-safe (no +, /, or =)
assert(!/[+/=]/.test(enc), "encoded string is URL-safe")

console.log(`\n${pass} passed, ${fail} failed`)
if (fail > 0) process.exit(1)
