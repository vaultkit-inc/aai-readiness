import { LEVELS } from "@/lib/readiness/model"
import styles from "./readiness.module.css"

interface Props {
  onStart: () => void
}

export default function IntroScreen({ onStart }: Props) {
  return (
    <div>
      <div className={styles.eyebrow}>Agent Readiness Index · v1.0</div>
      <h1 className={styles.title}>
        Can your AI agents safely touch production?
      </h1>
      <p className={styles.lede}>
        Twenty questions across five dimensions of agent governance: identity,
        data protection, auditability, operations, and autonomy. Ten minutes.
        You get a score, a maturity level, and the three gaps to close first.
      </p>

      <div className={styles.levels}>
        {LEVELS.map((l) => (
          <div className={styles.levelRow} key={l.n}>
            <div className={styles.levelNum}>LEVEL {l.n}</div>
            <div>
              <div className={styles.levelName}>{l.name}</div>
              <div className={styles.levelBlurb}>{l.blurb}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 32 }}>
        <button className={styles.btn} onClick={onStart}>
          Start assessment →
        </button>
      </div>

      <p className={styles.footnote}>
        Vendor-neutral. Nothing is collected or stored — the assessment runs
        entirely in your browser. Answer for your organization as it operates
        today, not as the roadmap says it will.
      </p>
    </div>
  )
}
