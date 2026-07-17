import React, { useState, useMemo } from "react";

// ————————————————————————————————————————————————
// AGENT READINESS INDEX
// Vendor-neutral maturity assessment for AI agent
// access to production systems.
// ————————————————————————————————————————————————

const LEVELS = [
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
];

const DIMENSIONS = [
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
];

const CHOICES = [
  { label: "No", value: 0 },
  { label: "Partially", value: 1 },
  { label: "Yes", value: 2 },
];

function levelFor(pct) {
  return LEVELS.find((l) => pct >= l.range[0] && pct <= l.range[1]) || LEVELS[0];
}

export default function AgentReadinessIndex() {
  const [screen, setScreen] = useState("intro"); // intro | 0..4 | partial | results
  const [answers, setAnswers] = useState({}); // "dim-idx" -> 0|1|2
  const [copied, setCopied] = useState(false);
  const [resumeAt, setResumeAt] = useState(0); // dimension to return to from partial view
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [leadStatus, setLeadStatus] = useState("idle"); // idle | sending | sent

  const totalQuestions = DIMENSIONS.reduce((a, d) => a + d.questions.length, 0);
  const answeredCount = Object.keys(answers).length;

  const results = useMemo(() => {
    const dims = DIMENSIONS.map((dim) => {
      let got = 0;
      let max = dim.questions.length * 2;
      dim.questions.forEach((_, i) => {
        got += answers[`${dim.id}-${i}`] ?? 0;
      });
      return { ...dim, pct: Math.round((got / max) * 100) };
    });
    const overall = Math.round(dims.reduce((a, d) => a + d.pct, 0) / dims.length);
    const level = levelFor(overall);
    // Priorities: lowest-scored questions (No first, then Partially), max 3
    const gaps = [];
    DIMENSIONS.forEach((dim) => {
      dim.questions.forEach((q, i) => {
        const v = answers[`${dim.id}-${i}`] ?? 0;
        if (v < 2) gaps.push({ dim: dim.label, rec: q.rec, v });
      });
    });
    gaps.sort((a, b) => a.v - b.v);
    return { dims, overall, level, priorities: gaps.slice(0, 3) };
  }, [answers]);

  const setAnswer = (key, value) => setAnswers((p) => ({ ...p, [key]: value }));

  const dimComplete = (dimIdx) =>
    DIMENSIONS[dimIdx].questions.every(
      (_, i) => answers[`${DIMENSIONS[dimIdx].id}-${i}`] !== undefined
    );

  const completedDims = useMemo(
    () => results.dims.filter((_, i) => dimComplete(i)),
    [answers, results]
  );

  const submitLead = async () => {
    if (!email.includes("@")) return;
    setLeadStatus("sending");
    // PRODUCTION WIRING (vaultkit.io):
    // Replace the timeout below with a POST to your Supabase table,
    // same pattern as the Naija2Canada waitlist:
    //
    // await fetch(`${SUPABASE_URL}/rest/v1/ari_leads`, {
    //   method: "POST",
    //   headers: {
    //     apikey: SUPABASE_ANON_KEY,
    //     "Content-Type": "application/json",
    //     Prefer: "return=minimal",
    //   },
    //   body: JSON.stringify({
    //     email,
    //     company: company || null,
    //     score: results.overall,
    //     level: results.level.n,
    //     dims: Object.fromEntries(results.dims.map((d) => [d.id, d.pct])),
    //     answers, // raw answers = your benchmark dataset seed
    //   }),
    // });
    //
    // Then a scheduled job (or Supabase edge function) emails the breakdown.
    await new Promise((r) => setTimeout(r, 700)); // demo mode
    setLeadStatus("sent");
  };

  const recordId = useMemo(() => {
    const t = Date.now().toString(36).toUpperCase().slice(-6);
    return `ARI-${t}`;
  }, []);

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const copySummary = async () => {
    const lines = [
      `Agent Readiness Index — ${results.overall}/100`,
      `Level ${results.level.n}: ${results.level.name}`,
      ``,
      ...results.dims.map((d) => `${d.label}: ${d.pct}/100`),
      ``,
      `Top priorities:`,
      ...results.priorities.map((p, i) => `${i + 1}. ${p.rec}`),
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="ari-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap');

        .ari-root {
          --paper: #F6F5F1;
          --card: #FFFFFF;
          --ink: #1C2421;
          --ink-soft: #4A5450;
          --ink-faint: #8B948F;
          --line: #DDDCD4;
          --line-strong: #1C2421;
          --grant: #1F6E4A;
          --grant-soft: #E4EFE8;
          --deny: #B04A3E;
          --pend: #B07C24;
          --mono: 'IBM Plex Mono', ui-monospace, monospace;
          --sans: 'IBM Plex Sans', system-ui, sans-serif;
          --display: 'Archivo', system-ui, sans-serif;
          background: var(--paper);
          min-height: 100vh;
          font-family: var(--sans);
          color: var(--ink);
          -webkit-font-smoothing: antialiased;
        }
        .ari-shell { max-width: 760px; margin: 0 auto; padding: 40px 20px 80px; }

        .ari-eyebrow {
          font-family: var(--mono); font-size: 11px; letter-spacing: 0.14em;
          text-transform: uppercase; color: var(--ink-faint);
          display: flex; align-items: center; gap: 10px;
        }
        .ari-eyebrow::after { content: ''; flex: 1; height: 1px; background: var(--line); }

        h1.ari-title {
          font-family: var(--display); font-weight: 800; letter-spacing: -0.02em;
          font-size: clamp(34px, 6vw, 52px); line-height: 1.02; margin: 18px 0 0;
        }
        .ari-lede { font-size: 16px; line-height: 1.65; color: var(--ink-soft); margin: 20px 0 0; max-width: 56ch; }

        .ari-levels { margin-top: 36px; border-top: 2px solid var(--line-strong); }
        .ari-level-row {
          display: grid; grid-template-columns: 70px 1fr; gap: 16px;
          padding: 16px 0; border-bottom: 1px solid var(--line); align-items: baseline;
        }
        .ari-level-num { font-family: var(--mono); font-size: 12px; color: var(--ink-faint); letter-spacing: 0.08em; }
        .ari-level-name { font-family: var(--display); font-weight: 700; font-size: 17px; }
        .ari-level-blurb { font-size: 14px; line-height: 1.6; color: var(--ink-soft); margin-top: 4px; }

        .ari-btn {
          font-family: var(--mono); font-size: 13px; font-weight: 600; letter-spacing: 0.06em;
          text-transform: uppercase; cursor: pointer; border: 1.5px solid var(--line-strong);
          background: var(--ink); color: var(--paper); padding: 14px 26px; border-radius: 3px;
          transition: transform 0.12s ease, box-shadow 0.12s ease;
        }
        .ari-btn:hover { transform: translateY(-1px); box-shadow: 3px 3px 0 var(--line-strong); }
        .ari-btn:focus-visible { outline: 2px solid var(--grant); outline-offset: 3px; }
        .ari-btn:disabled { opacity: 0.35; cursor: not-allowed; transform: none; box-shadow: none; }
        .ari-btn.ghost { background: transparent; color: var(--ink); }

        .ari-progress {
          display: flex; gap: 6px; margin: 0 0 28px;
        }
        .ari-progress span {
          flex: 1; height: 3px; background: var(--line); border-radius: 2px; position: relative; overflow: hidden;
        }
        .ari-progress span.done::after {
          content: ''; position: absolute; inset: 0; background: var(--grant);
        }
        .ari-progress span.current::after {
          content: ''; position: absolute; inset: 0; background: var(--ink);
        }

        .ari-dim-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
        .ari-dim-title { font-family: var(--display); font-weight: 800; font-size: 28px; letter-spacing: -0.01em; }
        .ari-dim-sub { font-family: var(--mono); font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-faint); }

        .ari-q {
          background: var(--card); border: 1px solid var(--line); border-radius: 6px;
          padding: 20px; margin-top: 14px;
        }
        .ari-q-text { font-weight: 600; font-size: 15.5px; line-height: 1.45; }
        .ari-q-detail { font-size: 13.5px; line-height: 1.6; color: var(--ink-soft); margin-top: 6px; }
        .ari-choices { display: flex; gap: 8px; margin-top: 14px; }
        .ari-choice {
          flex: 1; font-family: var(--mono); font-size: 12.5px; font-weight: 500;
          padding: 10px 8px; border: 1.5px solid var(--line); border-radius: 4px;
          background: transparent; color: var(--ink-soft); cursor: pointer;
          transition: all 0.1s ease; text-align: center;
        }
        .ari-choice:hover { border-color: var(--ink-faint); color: var(--ink); }
        .ari-choice:focus-visible { outline: 2px solid var(--grant); outline-offset: 2px; }
        .ari-choice.sel-0 { background: #F7EAE8; border-color: var(--deny); color: var(--deny); font-weight: 600; }
        .ari-choice.sel-1 { background: #F7F0E2; border-color: var(--pend); color: var(--pend); font-weight: 600; }
        .ari-choice.sel-2 { background: var(--grant-soft); border-color: var(--grant); color: var(--grant); font-weight: 600; }

        .ari-nav { display: flex; justify-content: space-between; align-items: center; margin-top: 28px; gap: 12px; }
        .ari-count { font-family: var(--mono); font-size: 12px; color: var(--ink-faint); }

        /* ——— The record (results) ——— */
        .ari-record {
          background: var(--card); border: 1.5px solid var(--line-strong); border-radius: 4px;
          position: relative; overflow: hidden;
        }
        .ari-record-head {
          padding: 22px 26px; border-bottom: 1.5px solid var(--line-strong);
          display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap;
        }
        .ari-record-meta { font-family: var(--mono); font-size: 11px; color: var(--ink-faint); letter-spacing: 0.06em; line-height: 1.9; text-align: right; }
        .ari-record-title { font-family: var(--mono); font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--ink-faint); }
        .ari-score-row { display: flex; align-items: center; gap: 26px; padding: 30px 26px; flex-wrap: wrap; }
        .ari-score-num { font-family: var(--display); font-weight: 800; font-size: 76px; line-height: 0.9; letter-spacing: -0.03em; }
        .ari-score-denom { font-family: var(--mono); font-size: 13px; color: var(--ink-faint); }

        .ari-stamp {
          font-family: var(--mono); font-weight: 600; font-size: 14px; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--grant); border: 2px solid var(--grant);
          padding: 10px 16px; border-radius: 3px; transform: rotate(-3deg);
          box-shadow: inset 0 0 0 1.5px var(--card), inset 0 0 0 3px var(--grant);
          animation: stamp 0.35s cubic-bezier(0.2, 1.6, 0.4, 1) both;
        }
        @keyframes stamp {
          from { transform: rotate(-3deg) scale(1.7); opacity: 0; }
          to { transform: rotate(-3deg) scale(1); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ari-stamp { animation: none; }
          .ari-btn, .ari-btn:hover { transition: none; transform: none; }
        }

        .ari-level-desc { padding: 0 26px 24px; font-size: 14.5px; line-height: 1.65; color: var(--ink-soft); max-width: 60ch; }

        .ari-bars { border-top: 1px solid var(--line); padding: 20px 26px 26px; }
        .ari-bar-row { display: grid; grid-template-columns: 130px 1fr 44px; gap: 14px; align-items: center; padding: 8px 0; }
        .ari-bar-label { font-family: var(--mono); font-size: 12px; color: var(--ink-soft); }
        .ari-bar-track { height: 8px; background: var(--paper); border: 1px solid var(--line); border-radius: 4px; overflow: hidden; }
        .ari-bar-fill { height: 100%; background: var(--ink); border-radius: 3px; transition: width 0.6s ease; }
        .ari-bar-pct { font-family: var(--mono); font-size: 12px; text-align: right; }

        .ari-prior { margin-top: 28px; }
        .ari-prior h3 { font-family: var(--display); font-weight: 700; font-size: 18px; margin: 0 0 4px; }
        .ari-prior-item {
          display: grid; grid-template-columns: 26px 1fr; gap: 12px;
          padding: 14px 0; border-bottom: 1px solid var(--line); align-items: baseline;
        }
        .ari-prior-num { font-family: var(--mono); font-size: 12px; color: var(--deny); font-weight: 600; }
        .ari-prior-text { font-size: 14.5px; line-height: 1.55; }
        .ari-prior-dim { font-family: var(--mono); font-size: 11px; color: var(--ink-faint); letter-spacing: 0.08em; text-transform: uppercase; margin-top: 3px; }

        .ari-pauselink {
          font-family: var(--mono); font-size: 12px; color: var(--ink-faint);
          background: none; border: none; cursor: pointer;
          text-decoration: underline; text-underline-offset: 3px;
        }
        .ari-pauselink:hover { color: var(--ink); }
        .ari-pauselink:focus-visible { outline: 2px solid var(--grant); outline-offset: 2px; }

        .ari-warn {
          margin-top: 18px; padding: 14px 18px; border: 1.5px solid var(--pend);
          border-radius: 4px; background: #FBF4E3; font-size: 14px; line-height: 1.6;
          color: #6B4E13;
        }
        .ari-warn strong { color: #4F3A0C; }

        .ari-lead {
          margin-top: 28px; background: var(--card); border: 1px solid var(--line);
          border-radius: 6px; padding: 22px;
        }
        .ari-lead-title { font-family: var(--display); font-weight: 700; font-size: 17px; }
        .ari-lead-sub { font-size: 13.5px; line-height: 1.6; color: var(--ink-soft); margin: 6px 0 0; max-width: 58ch; }
        .ari-lead-fields { display: flex; gap: 8px; margin-top: 14px; flex-wrap: wrap; }
        .ari-input {
          flex: 1; min-width: 180px; font-family: var(--sans); font-size: 14px;
          padding: 12px 14px; border: 1.5px solid var(--line); border-radius: 4px;
          background: var(--paper); color: var(--ink);
        }
        .ari-input:focus-visible { outline: 2px solid var(--grant); outline-offset: 1px; border-color: var(--grant); }
        .ari-input::placeholder { color: var(--ink-faint); }

        .ari-foot { margin-top: 30px; display: flex; gap: 10px; flex-wrap: wrap; }
        .ari-footnote { margin-top: 34px; font-size: 12.5px; line-height: 1.7; color: var(--ink-faint); border-top: 1px solid var(--line); padding-top: 16px; max-width: 62ch; }

        @media (max-width: 560px) {
          .ari-bar-row { grid-template-columns: 96px 1fr 40px; }
          .ari-score-num { font-size: 58px; }
        }
      `}</style>

      <div className="ari-shell">
        {/* ————— INTRO ————— */}
        {screen === "intro" && (
          <div>
            <div className="ari-eyebrow">Agent Readiness Index · v1.0</div>
            <h1 className="ari-title">
              Can your AI agents safely touch production?
            </h1>
            <p className="ari-lede">
              Twenty questions across five dimensions of agent governance:
              identity, data protection, auditability, operations, and
              autonomy. Ten minutes. You get a score, a maturity level, and the
              three gaps to close first.
            </p>

            <div className="ari-levels">
              {LEVELS.map((l) => (
                <div className="ari-level-row" key={l.n}>
                  <div className="ari-level-num">LEVEL {l.n}</div>
                  <div>
                    <div className="ari-level-name">{l.name}</div>
                    <div className="ari-level-blurb">{l.blurb}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 32 }}>
              <button className="ari-btn" onClick={() => setScreen(0)}>
                Start assessment →
              </button>
            </div>

            <p className="ari-footnote">
              Vendor-neutral. Nothing is collected or stored — the assessment
              runs entirely in your browser. Answer for your organization as it
              operates today, not as the roadmap says it will.
            </p>
          </div>
        )}

        {/* ————— QUESTION SCREENS ————— */}
        {typeof screen === "number" && (
          <div>
            <div className="ari-progress" aria-hidden="true">
              {DIMENSIONS.map((_, i) => (
                <span
                  key={i}
                  className={i < screen ? "done" : i === screen ? "current" : ""}
                />
              ))}
            </div>

            <div className="ari-dim-head">
              <div>
                <div className="ari-dim-sub">
                  Dimension {screen + 1} of {DIMENSIONS.length} ·{" "}
                  {DIMENSIONS[screen].sub}
                </div>
                <div className="ari-dim-title">{DIMENSIONS[screen].label}</div>
              </div>
            </div>

            {DIMENSIONS[screen].questions.map((q, i) => {
              const key = `${DIMENSIONS[screen].id}-${i}`;
              return (
                <div className="ari-q" key={key}>
                  <div className="ari-q-text">{q.q}</div>
                  <div className="ari-q-detail">{q.d}</div>
                  <div className="ari-choices" role="radiogroup" aria-label={q.q}>
                    {CHOICES.map((c) => (
                      <button
                        key={c.value}
                        role="radio"
                        aria-checked={answers[key] === c.value}
                        className={`ari-choice ${
                          answers[key] === c.value ? `sel-${c.value}` : ""
                        }`}
                        onClick={() => setAnswer(key, c.value)}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}

            <div className="ari-nav">
              <button
                className="ari-btn ghost"
                onClick={() =>
                  setScreen(screen === 0 ? "intro" : screen - 1)
                }
              >
                ← Back
              </button>
              <span className="ari-count">
                {answeredCount}/{totalQuestions} answered
              </span>
              <button
                className="ari-btn"
                disabled={!dimComplete(screen)}
                onClick={() =>
                  setScreen(screen === DIMENSIONS.length - 1 ? "results" : screen + 1)
                }
              >
                {screen === DIMENSIONS.length - 1 ? "See results →" : "Next →"}
              </button>
            </div>

            {completedDims.length > 0 && screen < DIMENSIONS.length - 1 && (
              <div style={{ textAlign: "center", marginTop: 22 }}>
                <button
                  className="ari-pauselink"
                  onClick={() => {
                    setResumeAt(dimComplete(screen) ? screen + 1 : screen);
                    setScreen("partial");
                  }}
                >
                  Pause here and see results so far
                </button>
              </div>
            )}
          </div>
        )}

        {/* ————— PARTIAL RESULTS ————— */}
        {screen === "partial" && (
          <div>
            <div className="ari-eyebrow">Partial results</div>

            <div className="ari-warn">
              <strong>
                {completedDims.length} of {DIMENSIONS.length} dimensions
                assessed.
              </strong>{" "}
              This is not your overall readiness score. No maturity level is
              assigned until all five dimensions are complete — a strong score
              in one area can hide a critical gap in another.
            </div>

            <div className="ari-record" style={{ marginTop: 18 }}>
              <div className="ari-bars" style={{ borderTop: "none" }}>
                {results.dims.map((d, i) => {
                  const done = dimComplete(i);
                  return (
                    <div className="ari-bar-row" key={d.id}>
                      <div
                        className="ari-bar-label"
                        style={done ? {} : { color: "var(--ink-faint)" }}
                      >
                        {d.label}
                      </div>
                      <div className="ari-bar-track">
                        {done && (
                          <div
                            className="ari-bar-fill"
                            style={{ width: `${d.pct}%` }}
                          />
                        )}
                      </div>
                      <div
                        className="ari-bar-pct"
                        style={done ? {} : { color: "var(--ink-faint)" }}
                      >
                        {done ? d.pct : "—"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="ari-foot">
              <button
                className="ari-btn"
                onClick={() => setScreen(Math.min(resumeAt, DIMENSIONS.length - 1))}
              >
                Continue assessment →
              </button>
            </div>

            <p className="ari-footnote">
              Your answers live only in this tab — closing it clears them.
              Finishing takes about {(DIMENSIONS.length - completedDims.length) * 2}{" "}
              more minutes.
            </p>
          </div>
        )}

        {/* ————— RESULTS ————— */}
        {screen === "results" && (
          <div>
            <div className="ari-eyebrow">Assessment complete</div>

            <div className="ari-record" style={{ marginTop: 20 }}>
              <div className="ari-record-head">
                <div>
                  <div className="ari-record-title">
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
                <div className="ari-record-meta">
                  {recordId}
                  <br />
                  {today}
                </div>
              </div>

              <div className="ari-score-row">
                <div>
                  <span className="ari-score-num">{results.overall}</span>
                  <span className="ari-score-denom"> / 100</span>
                </div>
                <div className="ari-stamp">
                  Level {results.level.n} · {results.level.name}
                </div>
              </div>

              <div className="ari-level-desc">{results.level.blurb}</div>

              <div className="ari-bars">
                {results.dims.map((d) => (
                  <div className="ari-bar-row" key={d.id}>
                    <div className="ari-bar-label">{d.label}</div>
                    <div className="ari-bar-track">
                      <div
                        className="ari-bar-fill"
                        style={{ width: `${d.pct}%` }}
                      />
                    </div>
                    <div className="ari-bar-pct">{d.pct}</div>
                  </div>
                ))}
              </div>
            </div>

            {results.priorities.length > 0 && (
              <div className="ari-prior">
                <h3>Close these gaps first</h3>
                {results.priorities.map((p, i) => (
                  <div className="ari-prior-item" key={i}>
                    <div className="ari-prior-num">0{i + 1}</div>
                    <div>
                      <div className="ari-prior-text">{p.rec}</div>
                      <div className="ari-prior-dim">{p.dim}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {results.priorities.length === 0 && (
              <p className="ari-lede" style={{ marginTop: 24 }}>
                No gaps identified. Your organization already runs agents with
                the controls most teams are still designing.
              </p>
            )}

            <div className="ari-lead">
              {leadStatus !== "sent" ? (
                <>
                  <div className="ari-lead-title">Want the full breakdown?</div>
                  <p className="ari-lead-sub">
                    Get a dimension-by-dimension report: the capability behind
                    each question, why it matters, and what closing each gap
                    typically involves. Your results above are yours either way.
                  </p>
                  <div className="ari-lead-fields">
                    <input
                      className="ari-input"
                      type="email"
                      placeholder="Work email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      aria-label="Work email"
                    />
                    <input
                      className="ari-input"
                      type="text"
                      placeholder="Company (optional)"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      aria-label="Company, optional"
                    />
                    <button
                      className="ari-btn"
                      disabled={!email.includes("@") || leadStatus === "sending"}
                      onClick={submitLead}
                    >
                      {leadStatus === "sending" ? "Sending…" : "Email my breakdown"}
                    </button>
                  </div>
                </>
              ) : (
                <div className="ari-lead-title" style={{ color: "var(--grant)" }}>
                  ✓ On its way to {email}
                </div>
              )}
            </div>

            <div className="ari-foot">
              <button className="ari-btn" onClick={copySummary}>
                {copied ? "Copied ✓" : "Copy summary"}
              </button>
              <button
                className="ari-btn ghost"
                onClick={() => {
                  setAnswers({});
                  setScreen("intro");
                }}
              >
                Start over
              </button>
            </div>

            <p className="ari-footnote">
              Organizations that reach Levels 3 and 4 share a pattern:
              centralized policy, enforcement before query execution,
              field-level protection, scoped time-boxed approvals, and an
              immutable audit trail. The gap between where you are and where
              autonomous agents become safe is a capabilities gap, not a
              culture gap.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
