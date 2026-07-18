import { DIMENSIONS } from "./model"
import type { Answer } from "./model"

// Fixed encoding order: dimension order × question order, matching DIMENSIONS in model.ts.
// Changing DIMENSIONS order would break existing share links — don't reorder.
const QUESTION_ORDER = DIMENSIONS.flatMap((dim) =>
  dim.questions.map((_, i) => `${dim.id}-${i}`)
)

// Encodes 20 answer values (0|1|2) as a 20-byte base64url string (~28 chars).
export function encodeAnswers(answers: Answer): string {
  const bytes = new Uint8Array(QUESTION_ORDER.map((key) => answers[key] ?? 0))
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "")
}

// Decodes a base64url string back to an Answer map.
// Returns {} on any parse error — callers must treat an empty map as invalid.
export function decodeAnswers(encoded: string): Answer {
  try {
    const padded = encoded.replace(/-/g, "+").replace(/_/g, "/")
    const binary = atob(padded)
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
    if (bytes.length < QUESTION_ORDER.length) return {}
    const result: Answer = {}
    QUESTION_ORDER.forEach((key, i) => {
      const v = bytes[i]
      if (v === 0 || v === 1 || v === 2) result[key] = v
    })
    return result
  } catch {
    return {}
  }
}
