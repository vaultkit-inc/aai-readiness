"use client"

import { useState, useMemo } from "react"
import {
  DIMENSIONS,
  calcResults,
  isDimComplete,
  type Answer,
  type AnswerValue,
  TOTAL_QUESTIONS,
} from "@/lib/readiness/model"
import { encodeAnswers } from "@/lib/readiness/share"
import styles from "./readiness.module.css"
import IntroScreen from "./IntroScreen"
import DimensionScreen from "./DimensionScreen"
import PartialResults from "./PartialResults"
import ResultsRecord from "./ResultsRecord"
import LeadFallback from "./LeadFallback"

type Screen = "intro" | number | "partial" | "lead-gate" | "results"
type LeadStatus = "idle" | "sent" | "skipped"

export default function AssessmentClient() {
  const [screen, setScreen] = useState<Screen>("intro")
  const [answers, setAnswers] = useState<Answer>({})
  const [copied, setCopied] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [resumeAt, setResumeAt] = useState(0)

  // Lead gate state
  const [leadStatus, setLeadStatus] = useState<LeadStatus>("idle")
  const [gateEmail, setGateEmail] = useState("")
  const [gateCompany, setGateCompany] = useState("")
  const [gateSending, setGateSending] = useState(false)
  const [gateError, setGateError] = useState(false)

  const [recordId] = useState(() => {
    const t = Date.now().toString(36).toUpperCase().slice(-6)
    return `ARI-${t}`
  })

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })

  const answeredCount = Object.keys(answers).length
  const results = useMemo(() => calcResults(answers), [answers])

  const setAnswer = (key: string, value: AnswerValue) =>
    setAnswers((prev) => ({ ...prev, [key]: value }))

  const handleBack = () => {
    if (typeof screen === "number") {
      setScreen(screen === 0 ? "intro" : screen - 1)
    }
  }

  const handleNext = () => {
    if (typeof screen !== "number") return
    setScreen(screen === DIMENSIONS.length - 1 ? "lead-gate" : screen + 1)
  }

  const handlePause = () => {
    if (typeof screen !== "number") return
    setResumeAt(isDimComplete(screen, answers) ? screen + 1 : screen)
    setScreen("partial")
  }

  const submitGate = async () => {
    const cleanEmail = gateEmail.trim().toLowerCase()
    if (!cleanEmail.includes("@") || !cleanEmail.includes(".")) return
    setGateSending(true)
    setGateError(false)
    try {
      const res = await fetch("/api/readiness/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          company: gateCompany.trim() || null,
          score: results.overall,
          level: results.level.n,
          dims: Object.fromEntries(results.dims.map((d) => [d.id, d.pct])),
          answers,
        }),
      })
      if (!res.ok) throw new Error("server error")
      setLeadStatus("sent")
      setScreen("results")
    } catch {
      setGateError(true)
      setGateSending(false)
    }
  }

  const skipGate = () => {
    setLeadStatus("skipped")
    setScreen("results")
  }

  const shareUrl = () =>
    `${window.location.origin}/readiness/r?a=${encodeAnswers(answers)}`

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl())
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } catch {
      // clipboard unavailable — fail silently
    }
  }

  const copySummary = async () => {
    const lines = [
      `Agent Readiness Index — Grade: ${results.letter} (Level ${results.level.n}: ${results.level.name})`,
      ``,
      ...results.dims.map((d) => `${d.label}: ${d.pct} / 100`),
      ``,
      `Top priorities:`,
      ...results.priorities.map((p, i) => `${i + 1}. ${p.rec}`),
      ``,
      shareUrl(),
    ]
    try {
      await navigator.clipboard.writeText(lines.join("\n"))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard unavailable — fail silently
    }
  }

  const reset = () => {
    setAnswers({})
    setScreen("intro")
    setLeadStatus("idle")
    setGateEmail("")
    setGateCompany("")
    setGateSending(false)
    setGateError(false)
  }

  const gateIsValid = gateEmail.trim().toLowerCase().includes("@") &&
    gateEmail.trim().toLowerCase().includes(".")

  return (
    <div className={styles.root}>
      <div className={styles.shell}>
        {screen === "intro" && <IntroScreen onStart={() => setScreen(0)} />}

        {typeof screen === "number" && (
          <DimensionScreen
            dimIndex={screen}
            answers={answers}
            answeredCount={answeredCount}
            totalQuestions={TOTAL_QUESTIONS}
            onAnswer={setAnswer}
            onBack={handleBack}
            onNext={handleNext}
            onPause={handlePause}
          />
        )}

        {screen === "partial" && (
          <PartialResults
            results={results}
            answers={answers}
            resumeAt={resumeAt}
            onContinue={(s) => setScreen(s)}
          />
        )}

        {screen === "lead-gate" && (
          <div>
            <div className={styles.eyebrow}>Assessment complete</div>
            <h2 className={styles.title} style={{ fontSize: "clamp(28px, 5vw, 42px)" }}>
              Your assessment is ready
            </h2>
            <p className={styles.lede}>
              Enter your email to see your grade, maturity level, and the three
              gaps to close first. We'll also send you the full
              dimension-by-dimension breakdown.
            </p>
            <form
              className={styles.leadFields}
              style={{ marginTop: 28 }}
              onSubmit={(e) => {
                e.preventDefault()
                submitGate()
              }}
            >
              <input
                className={styles.input}
                type="email"
                name="email"
                autoComplete="email"
                placeholder="Work email"
                value={gateEmail}
                onChange={(e) => setGateEmail(e.target.value)}
                aria-label="Work email"
              />
              <input
                className={styles.input}
                type="text"
                name="organization"
                autoComplete="organization"
                placeholder="Company (optional)"
                value={gateCompany}
                onChange={(e) => setGateCompany(e.target.value)}
                aria-label="Company, optional"
              />
              <button
                type="submit"
                className={styles.btn}
                disabled={!gateIsValid || gateSending}
              >
                {gateSending ? "Sending…" : "See my results →"}
              </button>
            </form>
            {gateError && (
              <p className={styles.leadError} style={{ marginTop: 10 }}>
                Something went wrong.{" "}
                <button
                  type="button"
                  className={styles.leadRetry}
                  onClick={submitGate}
                >
                  Try again
                </button>
              </p>
            )}
            <button className={styles.skipLink} onClick={skipGate}>
              Skip and see results
            </button>
          </div>
        )}

        {screen === "results" && (
          <div>
            <div className={styles.eyebrow}>Assessment complete</div>

            <ResultsRecord
              results={results}
              answers={answers}
              recordId={recordId}
              today={today}
            />

            {leadStatus === "sent" ? (
              <div className={styles.leadConfirm}>
                <div className={styles.leadConfirmTitle}>✓ Got it</div>
                <p className={styles.leadConfirmSub}>
                  Your breakdown will land at {gateEmail.trim().toLowerCase()}{" "}
                  within a day, written by a person, not a template.
                </p>
              </div>
            ) : (
              <LeadFallback results={results} answers={answers} />
            )}

            <div className={styles.foot}>
              <div className={styles.copyLinkWrap}>
                <button className={styles.btn} onClick={copyLink}>
                  {copiedLink ? "Link copied ✓" : "Copy link to my results"}
                </button>
                <span className={styles.copyLinkNote}>
                  This link contains your answers.
                </span>
              </div>
              <button className={styles.btn} onClick={copySummary}>
                {copied ? "Copied ✓" : "Copy summary"}
              </button>
              <button
                className={`${styles.btn} ${styles.btnGhost}`}
                onClick={reset}
              >
                Start over
              </button>
            </div>

            <p className={styles.footnote}>
              Organizations that reach Levels 3 and 4 share a pattern:
              centralized policy, enforcement before query execution, field-level
              protection, scoped time-boxed approvals, and an immutable audit
              trail. The gap between where you are and where autonomous agents
              become safe is a capabilities gap, not a culture gap.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
