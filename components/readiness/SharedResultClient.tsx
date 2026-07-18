"use client"

import { useMemo } from "react"
import { decodeAnswers } from "@/lib/readiness/share"
import { calcResults, type Answer } from "@/lib/readiness/model"
import styles from "./readiness.module.css"
import ResultsRecord from "./ResultsRecord"
import LeadCapture from "./LeadCapture"

interface Props {
  encoded: string
}

export default function SharedResultClient({ encoded }: Props) {
  const answers: Answer = useMemo(() => decodeAnswers(encoded), [encoded])
  const isValid = Object.keys(answers).length === 20
  const results = useMemo(
    () => (isValid ? calcResults(answers) : null),
    [answers, isValid]
  )

  return (
    <div className={styles.root}>
      <div className={styles.shell}>
        {!isValid || !results ? (
          <div className={styles.fallback}>
            <p>
              This link does not look right. The results may have been truncated
              or the URL may be incomplete.
            </p>
            <p style={{ marginTop: 16 }}>
              <a className={styles.fallbackLink} href="/">
                Take the assessment yourself →
              </a>
            </p>
          </div>
        ) : (
          <>
            <div className={styles.sharedBadge}>Shared result</div>

            <ResultsRecord results={results} answers={answers} />

            <LeadCapture results={results} answers={answers} />

            <div className={styles.foot}>
              <a className={styles.btn} href="/" style={{ textDecoration: "none" }}>
                Take the assessment yourself →
              </a>
            </div>

            <p className={styles.footnote}>
              You are viewing someone else's Agent Readiness Index results.
              Their answers are encoded in the link — nothing is stored on this
              server.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
