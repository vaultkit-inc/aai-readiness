import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// TODO: add per-IP rate limiting when a shared middleware pattern exists in this repo.
// For now the server-side validation and RLS guard against the most obvious abuse.

function isValidEmail(email: unknown): email is string {
  return typeof email === "string" && email.includes("@") && email.length <= 320
}

function isValidScore(score: unknown): score is number {
  return typeof score === "number" && Number.isInteger(score) && score >= 0 && score <= 100
}

function isValidLevel(level: unknown): level is number {
  return typeof level === "number" && [1, 2, 3, 4].includes(level)
}

function isValidDims(dims: unknown): dims is Record<string, number> {
  if (typeof dims !== "object" || dims === null || Array.isArray(dims)) return false
  return Object.values(dims).every((v) => typeof v === "number")
}

function isValidAnswers(answers: unknown): answers is Record<string, number> {
  if (typeof answers !== "object" || answers === null || Array.isArray(answers)) return false
  return Object.values(answers).every((v) => v === 0 || v === 1 || v === 2)
}

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const { email, company, score, level, dims, answers } = body as Record<string, unknown>

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 })
  }
  const normalizedEmail = email.trim().toLowerCase()
  if (!isValidScore(score)) {
    return NextResponse.json({ error: "Invalid score" }, { status: 400 })
  }
  if (!isValidLevel(level)) {
    return NextResponse.json({ error: "Invalid level" }, { status: 400 })
  }
  if (!isValidDims(dims)) {
    return NextResponse.json({ error: "Invalid dims" }, { status: 400 })
  }
  if (!isValidAnswers(answers)) {
    return NextResponse.json({ error: "Invalid answers" }, { status: 400 })
  }

  const supabase = createClient()

  const { error } = await supabase.from("ari_leads").insert({
    email: normalizedEmail,
    company: typeof company === "string" && company.trim().length > 0 ? company.trim() : null,
    score,
    level,
    dims,
    answers,
  })

  if (error) {
    console.error("[ari/lead] Supabase insert error:", error.message)
    return NextResponse.json({ error: "Failed to save" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
