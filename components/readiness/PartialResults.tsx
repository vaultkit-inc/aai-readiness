import { DIMENSIONS, type Answer, type AssessmentResult } from "@/lib/readiness/model"
import styles from "./readiness.module.css"

interface Props {
  results: AssessmentResult
  answers: Answer
  resumeAt: number
  onContinue: (screen: number) => void
}

export default function PartialResults({ results, answers, resumeAt, onContinue }: Props) {
  const completedDimCount = DIMENSIONS.filter((dim, i) =>
    dim.questions.every((_, qi) => answers[`${dim.id}-${qi}`] !== undefined)
  ).length

  const minutesLeft = (DIMENSIONS.length - completedDimCount) * 2

  return (
    <div>
      <div className={styles.eyebrow}>Partial results</div>

      <div className={styles.warn}>
        <span className={styles.warnStrong}>
          {completedDimCount} of {DIMENSIONS.length} dimensions assessed.
        </span>{" "}
        This is not your overall readiness score. No maturity level is assigned
        until all five dimensions are complete — a strong score in one area can
        hide a critical gap in another.
      </div>

      <div className={styles.record} style={{ marginTop: 18 }}>
        <div className={styles.bars} style={{ borderTop: "none" }}>
          {results.dims.map((d, i) => {
            const done = DIMENSIONS[i].questions.every(
              (_, qi) => answers[`${d.id}-${qi}`] !== undefined
            )
            return (
              <div className={styles.barRow} key={d.id}>
                <div
                  className={styles.barLabel}
                  style={done ? {} : { color: "var(--ink-faint)" }}
                >
                  {d.label}
                </div>
                <div className={styles.barTrack}>
                  {done && (
                    <div
                      className={styles.barFill}
                      style={{ width: `${d.pct}%` }}
                    />
                  )}
                </div>
                <div
                  className={styles.barPct}
                  style={done ? {} : { color: "var(--ink-faint)" }}
                >
                  {done ? d.pct : "—"}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className={styles.foot}>
        <button
          className={styles.btn}
          onClick={() => onContinue(Math.min(resumeAt, DIMENSIONS.length - 1))}
        >
          Continue assessment →
        </button>
      </div>

      <p className={styles.footnote}>
        Your answers live only in this tab — closing it clears them. Finishing
        takes about {minutesLeft} more minutes.
      </p>
    </div>
  )
}
