// ————————————————————————————————————————————————
// AGENT READINESS INDEX — data model & scoring
// ————————————————————————————————————————————————

export type AnswerValue = 0 | 1 | 2

export type Answer = Record<string, AnswerValue>

export interface Question {
  q: string
  d: string
  rec: string
}

export interface Dimension {
  id: string
  label: string
  sub: string
  questions: Question[]
}

export interface Level {
  n: number
  name: string
  range: [number, number]
  blurb: string
}

export interface Choice {
  label: string
  value: AnswerValue
}

export interface DimensionResult extends Dimension {
  pct: number
}

export interface Priority {
  dim: string
  rec: string
  v: AnswerValue
}

export interface AssessmentResult {
  dims: DimensionResult[]
  overall: number
  level: Level
  priorities: Priority[]
}

// ————— Data —————

export const LEVELS: Level[] = [
  {
    n: 1,
    name: "Experimental",
    range: [0, 25],
    blurb:
      "Agents run in isolation or with ad-hoc credentials. Production access is informal, hard to see, and harder to revoke.",
  },
  {
    n: 2,
    name: "Controlled",
    range: [26, 50],
    blurb:
      "Agents touch production through limited, manually approved paths. Controls exist but live in scattered places and rely on people remembering them.",
  },
  {
    n: 3,
    name: "Governed",
    range: [51, 75],
    blurb:
      "Central policies decide what each agent can see. Enforcement happens before queries execute, sensitive fields are protected, and access leaves a trail.",
  },
  {
    n: 4,
    name: "Autonomous-ready",
    range: [76, 100],
    blurb:
      "Agents can act in production under runtime policy: scoped grants, dynamic approvals, instant revocation, and immutable audit. Autonomy is safe because control is deterministic.",
  },
]

export const DIMENSIONS: Dimension[] = [
  {
    id: "gov",
    label: "Governance",
    sub: "Identity & access",
    questions: [
      {
        q: "Every AI agent has its own distinct identity",
        d: "Agents authenticate as themselves — not through shared service accounts or a developer's credentials.",
        rec: "Give each agent a first-class identity. Shared credentials make attribution and revocation impossible.",
      },
      {
        q: "Agent permissions are managed in one place",
        d: "A central control point defines what agents can access, rather than per-database roles and scattered config.",
        rec: "Centralize agent permissions. Scattered per-system roles drift and can't be reasoned about.",
      },
      {
        q: "Access can be revoked immediately",
        d: "One action cuts off an agent everywhere — no hunting through connection strings or rotating keys by hand.",
        rec: "Build a single revocation path. If cutting off an agent takes hours, it isn't a control.",
      },
      {
        q: "Agent access is time-limited by default",
        d: "Access expires on its own unless renewed. Standing, permanent credentials are the exception, not the norm.",
        rec: "Make access expire by default. Standing credentials accumulate risk silently.",
      },
    ],
  },
  {
    id: "data",
    label: "Data protection",
    sub: "What agents can see",
    questions: [
      {
        q: "Sensitive fields are classified",
        d: "PII, financial, and health fields are tagged so policy can reference them — not tribal knowledge.",
        rec: "Classify sensitive fields. Policy can't protect what nothing has named.",
      },
      {
        q: "Sensitive fields can be masked automatically",
        d: "Masking is applied by policy at query time, not by asking agent builders to be careful.",
        rec: "Enforce masking in the data path. Guidelines are not enforcement.",
      },
      {
        q: "Policies are enforced before queries execute",
        d: "A disallowed query never runs. Enforcement is preventive, not a post-hoc log review.",
        rec: "Move enforcement ahead of execution. Detecting a leak after the fact is incident response, not governance.",
      },
      {
        q: "Different agents can see different views of the same data",
        d: "A support agent and an analytics agent querying the same table receive different fields and rows, per policy.",
        rec: "Support per-agent views. One-size-fits-all access means every agent gets the most dangerous version.",
      },
    ],
  },
  {
    id: "audit",
    label: "Auditability",
    sub: "Answering 'what happened'",
    questions: [
      {
        q: "You can answer 'which agent accessed this customer's data, and when'",
        d: "In minutes, from a system of record — not by grepping application logs across services.",
        rec: "Make agent access queryable. The first serious incident will ask this exact question.",
      },
      {
        q: "Every agent access is tied to a reason",
        d: "Access records carry the originating task or justification, not just a timestamp and a query.",
        rec: "Capture intent with access. 'It ran a query' is not an answer auditors accept.",
      },
      {
        q: "You can identify which policy allowed or denied any access",
        d: "Every decision traces to a specific policy version — the 'why' is on the record.",
        rec: "Link decisions to policy versions. Untraceable allows are indistinguishable from bugs.",
      },
      {
        q: "Audit logs are immutable",
        d: "Access records can't be edited or deleted, including by administrators.",
        rec: "Make the audit trail tamper-evident. A mutable log proves nothing.",
      },
    ],
  },
  {
    id: "ops",
    label: "Operations",
    sub: "Control under pressure",
    questions: [
      {
        q: "You can disable a misbehaving agent instantly",
        d: "A kill switch exists, is tested, and doesn't require a deploy.",
        rec: "Build and test a kill switch. You will need it at the worst possible time.",
      },
      {
        q: "Policy changes can be rolled back",
        d: "Policies are versioned; reverting to a known-good state is one action.",
        rec: "Version your policies. A bad policy change should be a rollback, not an outage.",
      },
      {
        q: "Policy changes can be tested before production",
        d: "You can evaluate a proposed policy against real traffic patterns without enforcing it.",
        rec: "Add a dry-run path for policy. Untested policy changes are untested code in your data path.",
      },
      {
        q: "Anomalous agent behavior triggers an alert",
        d: "Unusual access patterns — volume, scope, timing — page a human.",
        rec: "Alert on anomalous access. Agents fail fast and at scale; humans need to hear about it.",
      },
    ],
  },
  {
    id: "auto",
    label: "Autonomy",
    sub: "How far agents can go",
    questions: [
      {
        q: "Agents read production data through a governed path",
        d: "Read access flows through policy — not copied credentials or a replica with no controls.",
        rec: "Route agent reads through a governed path. Ungoverned reads are how exfiltration starts.",
      },
      {
        q: "Human approval workflows exist for sensitive actions",
        d: "Agents can request elevated access; a human grants it with scope and context.",
        rec: "Add approval workflows. The alternative is either blanket access or blanket denial.",
      },
      {
        q: "Agents can act in production under policy",
        d: "Writes and actions are possible — because policy makes them safe, not because someone accepted the risk.",
        rec: "Gate writes behind runtime policy. Autonomy without enforcement is just risk with better marketing.",
      },
      {
        q: "Approvals are scoped and expire",
        d: "An approval grants specific access for a bounded time — not permanent elevation.",
        rec: "Time-box approvals. 'Approved once, elevated forever' defeats the point of asking.",
      },
    ],
  },
]

export const CHOICES: Choice[] = [
  { label: "No", value: 0 },
  { label: "Partially", value: 1 },
  { label: "Yes", value: 2 },
]

// ————— Scoring functions —————

export function levelFor(pct: number): Level {
  return LEVELS.find((l) => pct >= l.range[0] && pct <= l.range[1]) ?? LEVELS[0]
}

export function isDimComplete(dimIndex: number, answers: Answer): boolean {
  const dim = DIMENSIONS[dimIndex]
  return dim.questions.every((_, i) => answers[`${dim.id}-${i}`] !== undefined)
}

export function calcResults(answers: Answer): AssessmentResult {
  const dims: DimensionResult[] = DIMENSIONS.map((dim) => {
    let got = 0
    const max = dim.questions.length * 2
    dim.questions.forEach((_, i) => {
      got += answers[`${dim.id}-${i}`] ?? 0
    })
    return { ...dim, pct: Math.round((got / max) * 100) }
  })

  const overall = Math.round(dims.reduce((a, d) => a + d.pct, 0) / dims.length)
  const level = levelFor(overall)

  const gaps: Priority[] = []
  DIMENSIONS.forEach((dim) => {
    dim.questions.forEach((q, i) => {
      const v = (answers[`${dim.id}-${i}`] ?? 0) as AnswerValue
      if (v < 2) gaps.push({ dim: dim.label, rec: q.rec, v })
    })
  })
  gaps.sort((a, b) => a.v - b.v)

  return { dims, overall, level, priorities: gaps.slice(0, 3) }
}

export const TOTAL_QUESTIONS = DIMENSIONS.reduce((a, d) => a + d.questions.length, 0)
