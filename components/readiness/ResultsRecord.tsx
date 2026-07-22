"use client"

import { useState } from "react"
import { type AssessmentResult, type Answer } from "@/lib/readiness/model"
import { CONTENT, VERIFY_CHALLENGES, LEVEL_GATES } from "@/lib/readiness/content"
import styles from "./readiness.module.css"

interface Props {
  results: AssessmentResult
  answers: Answer
  recordId?: string
  today?: string
}

function firstSentence(text: string): string {
  const end = text.search(/\.\s/)
  return end >= 0 ? text.slice(0, end + 1) : text
}

export default function ResultsRecord({ results, answers, recordId, today }: Props) {
  const [expanded, setExpanded] = useState<boolean[]>([false, false, false])

  const toggle = (i: number) =>
    setExpanded((prev) => prev.map((v, idx) => (idx === i ? !v : v)))

  // ——— Verify-it nudges: Yes answers with a challenge, weakest dimensions first ———
  const verifyItems = Object.entries(VERIFY_CHALLENGES)
    .filter(([key]) => answers[key] === 2)
    .map(([key, challenge]) => {
      const dimId = key.split("-")[0]
      const dim = results.dims.find((d) => d.id === dimId)
      return { key, challenge, dimPct: dim?.pct ?? 100 }
    })
    .sort((a, b) => a.dimPct - b.dimPct)
    .slice(0, 3)

  // ——— Level gate ———
  const levelN = results.level.n
  const gates = LEVEL_GATES[levelN] ?? []
  const gatesMissing = gates.filter((key) => answers[key] !== 2)
  const gatesAllClear = levelN < 4 && gatesMissing.length === 0
  const lowestDim = [...results.dims].sort((a, b) => a.pct - b.pct)[0]

  return (
    <>
      {/* ——— Record card ——— */}
      <div className={styles.record} style={{ marginTop: 20 }}>
        <div className={styles.recordHead}>
          <div>
            <div className={styles.recordTitle}>
              Agent Readiness Index · Record
            </div>
            <div
              style={{
                fontFamily: "var(--display)",
                fontWeight: 800,
                fontSize: 22,
                marginTop: 6,
              }}
            >
              Readiness assessment
            </div>
          </div>
          {(recordId || today) && (
            <div className={styles.recordMeta}>
              {recordId}
              {recordId && today && <br />}
              {today}
            </div>
          )}
        </div>

        <div className={styles.scoreRow}>
          <span className={styles.scoreNum}>{results.letter}</span>
          <div className={styles.stamp}>
            Level {results.level.n} · {results.level.name}
          </div>
        </div>

        <div className={styles.levelDesc}>{results.level.blurb}</div>

        <div className={styles.bars}>
          {results.dims.map((d) => (
            <div className={styles.barRow} key={d.id}>
              <div className={styles.barLabel}>{d.label}</div>
              <div className={styles.barTrack}>
                <div className={styles.barFill} style={{ width: `${d.pct}%` }} />
              </div>
              <div className={styles.barPct}>{d.pct}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ——— Priorities (expandable) ——— */}
      {results.priorities.length > 0 && (
        <div className={styles.prior}>
          <h3 className={styles.priorHeading}>Close these gaps first</h3>
          {results.priorities.map((p, i) => {
            const content = CONTENT[p.key]
            const isOpen = expanded[i]
            return (
              <div className={styles.priorItem} key={p.key}>
                <div className={styles.priorNum}>0{i + 1}</div>
                <div>
                  <button
                    className={styles.expandToggle}
                    aria-expanded={isOpen}
                    onClick={() => toggle(i)}
                  >
                    <span className={styles.priorCapName}>
                      {content?.capabilityName ?? p.dim}
                    </span>
                    <span
                      className={
                        isOpen
                          ? `${styles.expandChevron} ${styles.expandChevronOpen}`
                          : styles.expandChevron
                      }
                    >
                      ›
                    </span>
                  </button>
                  <div className={styles.priorDim}>{p.dim}</div>
                  {content && (
                    <div className={styles.expandBody}>
                      {isOpen
                        ? content.risk
                        : firstSentence(content.risk)}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          <p className={styles.breakdownNote}>
            What closing each gap involves is in the full breakdown.
          </p>
        </div>
      )}

      {results.priorities.length === 0 && (
        <p className={styles.lede} style={{ marginTop: 24 }}>
          No gaps identified. Your organization already runs agents with the
          controls most teams are still designing.
        </p>
      )}

      {/* ——— Verify-it nudges ——— */}
      {verifyItems.length > 0 && (
        <div className={styles.verifySection}>
          <h3 className={styles.verifyHeading}>You said yes. Verify it.</h3>
          {verifyItems.map(({ key, challenge }) => (
            <div className={styles.verifyItem} key={key}>
              <div className={styles.verifyLabel}>
                {CONTENT[key]?.capabilityName}
              </div>
              <div className={styles.verifyChallenge}>{challenge}</div>
            </div>
          ))}
        </div>
      )}

      {/* ——— Getting to Level N+1 ——— */}
      {levelN < 4 && (
        <div className={styles.levelGateSection}>
          <h3 className={styles.levelGateHeading}>
            Getting to Level {levelN + 1}
          </h3>
          {gatesAllClear ? (
            <p className={styles.levelGateAllClear}>
              You are clearing the gates for Level {levelN + 1}. Your lowest
              dimension is {lowestDim.label} at {lowestDim.pct}/100 — that is
              where the remaining distance is.
            </p>
          ) : (
            gatesMissing.map((key) => (
              <div className={styles.levelGateItem} key={key}>
                <div className={styles.levelGateDot}>○</div>
                <div className={styles.levelGateName}>
                  {CONTENT[key]?.capabilityName}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </>
  )
}
