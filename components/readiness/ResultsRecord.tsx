import { type AssessmentResult } from "@/lib/readiness/model"
import styles from "./readiness.module.css"

interface Props {
  results: AssessmentResult
  recordId: string
  today: string
}

export default function ResultsRecord({ results, recordId, today }: Props) {
  return (
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
        <div className={styles.recordMeta}>
          {recordId}
          <br />
          {today}
        </div>
      </div>

      <div className={styles.scoreRow}>
        <div>
          <span className={styles.scoreNum}>{results.overall}</span>
          <span className={styles.scoreDenom}> / 100</span>
        </div>
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
              <div
                className={styles.barFill}
                style={{ width: `${d.pct}%` }}
              />
            </div>
            <div className={styles.barPct}>{d.pct}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
