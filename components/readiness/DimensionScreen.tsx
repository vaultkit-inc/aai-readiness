import { DIMENSIONS, CHOICES, type Answer, type AnswerValue } from "@/lib/readiness/model"
import styles from "./readiness.module.css"

interface Props {
  dimIndex: number
  answers: Answer
  answeredCount: number
  totalQuestions: number
  onAnswer: (key: string, value: AnswerValue) => void
  onBack: () => void
  onNext: () => void
  onPause: () => void
}

export default function DimensionScreen({
  dimIndex,
  answers,
  answeredCount,
  totalQuestions,
  onAnswer,
  onBack,
  onNext,
  onPause,
}: Props) {
  const dim = DIMENSIONS[dimIndex]
  const isLast = dimIndex === DIMENSIONS.length - 1

  const dimComplete = dim.questions.every(
    (_, i) => answers[`${dim.id}-${i}`] !== undefined
  )

  const completedDimCount = DIMENSIONS.filter((d) =>
    d.questions.every((_, qi) => answers[`${d.id}-${qi}`] !== undefined)
  ).length

  // Show pause link when at least one prior dim is complete and this isn't the last
  const showPause = completedDimCount > 0 && !isLast

  const selClass = (v: AnswerValue) => {
    if (v === 0) return styles.choiceSel0
    if (v === 1) return styles.choiceSel1
    return styles.choiceSel2
  }

  return (
    <div>
      <div className={styles.progress} aria-hidden="true">
        {DIMENSIONS.map((_, i) => {
          let segClass = styles.progressSegment
          if (i < dimIndex) segClass += " " + styles.progressDone
          else if (i === dimIndex) segClass += " " + styles.progressCurrent
          return <span key={i} className={segClass} />
        })}
      </div>

      <div className={styles.dimHead}>
        <div>
          <div className={styles.dimSub}>
            Dimension {dimIndex + 1} of {DIMENSIONS.length} · {dim.sub}
          </div>
          <div className={styles.dimTitle}>{dim.label}</div>
        </div>
      </div>

      {dim.questions.map((q, i) => {
        const key = `${dim.id}-${i}`
        return (
          <div className={styles.q} key={key}>
            <div className={styles.qText}>{q.q}</div>
            <div className={styles.qDetail}>{q.d}</div>
            <div
              className={styles.choices}
              role="radiogroup"
              aria-label={q.q}
            >
              {CHOICES.map((c) => {
                const isSelected = answers[key] === c.value
                return (
                  <button
                    key={c.value}
                    role="radio"
                    aria-checked={isSelected}
                    className={
                      isSelected
                        ? `${styles.choice} ${selClass(c.value)}`
                        : styles.choice
                    }
                    onClick={() => onAnswer(key, c.value)}
                  >
                    {c.label}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      <div className={styles.nav}>
        <button
          className={`${styles.btn} ${styles.btnGhost}`}
          onClick={onBack}
        >
          ← Back
        </button>
        <span className={styles.count}>
          {answeredCount}/{totalQuestions} answered
        </span>
        <button
          className={styles.btn}
          disabled={!dimComplete}
          onClick={onNext}
        >
          {isLast ? "See results →" : "Next →"}
        </button>
      </div>

      {showPause && (
        <div style={{ textAlign: "center", marginTop: 22 }}>
          <button className={styles.pauseLink} onClick={onPause}>
            Pause here and see results so far
          </button>
        </div>
      )}
    </div>
  )
}
