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
import LeadCapture from "./LeadCapture"

type Screen = "intro" | number | "partial" | "results"

export default function AssessmentClient() {
  const [screen, setScreen] = useState<Screen>("intro")
  const [answers, setAnswers] = useState<Answer>({})
  const [copied, setCopied] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [resumeAt, setResumeAt] = useState(0)

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
    setScreen(screen === DIMENSIONS.length - 1 ? "results" : screen + 1)
  }

  const handlePause = () => {
    if (typeof screen !== "number") return
    setResumeAt(isDimComplete(screen, answers) ? screen + 1 : screen)
    setScreen("partial")
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
      `Agent Readiness Index — ${results.overall}/100`,
      `Level ${results.level.n}: ${results.level.name}`,
      ``,
      ...results.dims.map((d) => `${d.label}: ${d.pct}/100`),
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
  }

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

        {screen === "results" && (
          <div>
            <div className={styles.eyebrow}>Assessment complete</div>

            <ResultsRecord
              results={results}
              answers={answers}
              recordId={recordId}
              today={today}
            />

            <LeadCapture results={results} answers={answers} />

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
