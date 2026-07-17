"use client"

import { useState } from "react"
import { type Answer, type AssessmentResult } from "@/lib/readiness/model"
import styles from "./readiness.module.css"

type LeadStatus = "idle" | "sending" | "sent" | "error"

interface Props {
  results: AssessmentResult
  answers: Answer
}

export default function LeadCapture({ results, answers }: Props) {
  const [email, setEmail] = useState("")
  const [company, setCompany] = useState("")
  const [status, setStatus] = useState<LeadStatus>("idle")

  const isValid = (raw: string) => {
    const v = raw.trim().toLowerCase()
    return v.includes("@") && v.includes(".")
  }

  const submit = async () => {
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail.includes("@") || !cleanEmail.includes(".")) return
    setStatus("sending")
    try {
      const res = await fetch("/api/readiness/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          company: company.trim() || null,
          score: results.overall,
          level: results.level.n,
          dims: Object.fromEntries(results.dims.map((d) => [d.id, d.pct])),
          answers,
        }),
      })
      if (!res.ok) throw new Error("server error")
      setStatus("sent")
    } catch {
      setStatus("error")
    }
  }

  if (status === "sent") {
    const sentEmail = email.trim().toLowerCase()
    return (
      <div className={styles.lead}>
        <div className={styles.leadTitle} style={{ color: "var(--grant)" }}>
          ✓ Got it
        </div>
        <p className={styles.leadSub}>
          Your breakdown will land at {sentEmail} within a day, written by a
          person, not a template.
        </p>
      </div>
    )
  }

  return (
    <div className={styles.lead}>
      <div className={styles.leadTitle}>Want the full breakdown?</div>
      <p className={styles.leadSub}>
        Get a dimension-by-dimension report: the capability behind each
        question, why it matters, and what closing each gap typically involves.
        Your results above are yours either way.
      </p>
      <form
        className={styles.leadFields}
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <input
          className={styles.input}
          type="email"
          name="email"
          autoComplete="email"
          placeholder="Work email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-label="Work email"
        />
        <input
          className={styles.input}
          type="text"
          name="organization"
          autoComplete="organization"
          placeholder="Company (optional)"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          aria-label="Company, optional"
        />
        <button
          type="submit"
          className={styles.btn}
          disabled={!isValid(email) || status === "sending"}
        >
          {status === "sending" ? "Sending…" : "Email my breakdown"}
        </button>
      </form>
      {status === "error" && (
        <p className={styles.leadError}>
          Something went wrong.{" "}
          <button type="button" className={styles.leadRetry} onClick={submit}>
            Try again
          </button>
        </p>
      )}
    </div>
  )
}
