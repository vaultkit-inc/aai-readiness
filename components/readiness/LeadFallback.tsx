"use client"

import { useState } from "react"
import { type Answer, type AssessmentResult } from "@/lib/readiness/model"
import styles from "./readiness.module.css"

interface Props {
  results: AssessmentResult
  answers: Answer
}

export default function LeadFallback({ results, answers }: Props) {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")

  const isValid = (raw: string) => {
    const v = raw.trim().toLowerCase()
    return v.includes("@") && v.includes(".")
  }

  const submit = async () => {
    const cleanEmail = email.trim().toLowerCase()
    if (!isValid(cleanEmail)) return
    setStatus("sending")
    try {
      const res = await fetch("/api/readiness/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          company: null,
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
    return (
      <div className={styles.leadFallback}>
        <p className={styles.leadFallbackSent}>
          ✓ Breakdown sent to {email.trim().toLowerCase()}
        </p>
      </div>
    )
  }

  return (
    <div className={styles.leadFallback}>
      <p className={styles.leadFallbackLabel}>
        Want the full breakdown emailed to you?
      </p>
      <form
        className={styles.leadFallbackForm}
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
        <button
          type="submit"
          className={`${styles.btn} ${styles.btnGhost}`}
          disabled={!isValid(email) || status === "sending"}
        >
          {status === "sending" ? "Sending…" : "Send it"}
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
