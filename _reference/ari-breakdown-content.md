# Agent Readiness Index: Breakdown Content Kit

Everything needed to assemble the "full breakdown" email. Written to be merged
programmatically: pull the blocks for every question the respondent scored
below 2, plus the level description matching their score.

Voice notes: plain and direct, no em dashes, no corporate phrasing. Every risk
is a scenario, not an adjective. Build estimates assume a competent backend
team; adjust if you disagree with any of them.

---

## Level descriptions (Section 2 of the email)

### Level 1: Experimental

Your agents run on borrowed credentials and informal access. That is fine for
prototypes on synthetic data. It is not fine for anything touching real
customer records, because right now you cannot answer the two questions that
matter after an incident: what did the agent see, and how do we make it stop.
What you can safely do today: sandboxed experiments, agents on non-production
replicas with scrubbed data. What you should not do yet: any agent with a path
to production data, even read-only.

### Level 2: Controlled

You have controls, but they live in scattered places and depend on people
remembering them. Read-only agents on non-sensitive data with a human in the
loop are reasonable at this level. The problem is scale: each new agent adds
manual review work, and governance debt compounds quietly. Most teams feel this
between agent three and agent ten. What you can safely do today: a small number
of read-only agents with manual oversight. What you should not do yet:
autonomous actions, agents touching PII, or growing the agent fleet without
first centralizing policy.

### Level 3: Governed

Policy decides what each agent sees, enforcement happens before queries run,
and access leaves a trail you can query. This is the level where agents on
sensitive data stop being an accepted risk and start being a managed one. What
you can safely do today: agents reading production data including classified
fields, with masking and audit doing the work humans used to do. The remaining
gap is action: writes and production operations still need the approval and
revocation machinery of Level 4.

### Level 4: Autonomous-ready

Agents can act in production because the controls are deterministic: scoped
grants that expire, approvals that carry context, revocation that takes effect
immediately, and an audit trail nobody can edit. Autonomy at this level is not
a leap of faith. It is the same posture mature teams take with human access,
applied to agents at machine speed. The work from here is refinement:
tightening policies as usage data comes in, and extending coverage as new
agents and data sources arrive.

---

## Content blocks (Section 3 of the email)

Merge rule: include a block if the answer was No or Partially. For Partially,
the "closing it" paragraph still applies; consider prefixing the block with
"You are partway here."

---

### GOV-1: Distinct agent identity

**The capability.** Every agent authenticates as itself. Not a shared service
account, not a developer's personal credentials, not one API key passed around
the team.

**The risk.** When three agents share one credential, an incident report can
only say "something with this key read the customers table." You cannot tell
which agent, which task, or which team owns the problem. Revocation is worse:
killing the shared key takes down all three agents, so in practice nobody kills
it, and the compromised credential stays live while people debate.

**Closing it.** Per-agent identity means issuing and rotating credentials for
each agent, mapping them to an owner, and threading that identity through every
data access. Building it on top of an existing IAM setup is a few weeks of
work. The hard part is not issuance, it is making sure the identity survives
all the way to the query, because an agent that authenticates as itself but
queries through a shared database role has only solved half the problem.

---

### GOV-2: Centralized permissions

**The capability.** One place defines what every agent can access. Not a
Postgres role here, a warehouse grant there, and an API scope somewhere else.

**The risk.** Scattered permissions drift. Six months in, nobody can answer
"what can the support agent actually reach" without auditing four systems by
hand. Every new data source multiplies the surface, and the honest answer to
"are we sure the analytics agent cannot read payment data" becomes "probably."
Probably is not an answer you can give a customer or an auditor.

**Closing it.** Centralizing means a policy store that is the source of truth,
plus enforcement points that consult it in every data path. The store is easy.
The enforcement points are the project: every path an agent uses to reach data
has to check the same policy, or the central store is just documentation.
Teams that build this themselves usually spend a quarter on it and maintain it
forever. This is also the capability everything else in this report depends
on, which is why it appears first in most roadmaps.

---

### GOV-3: Immediate revocation

**The capability.** One action cuts an agent off everywhere, and it takes
effect in seconds, not at the next deploy or key rotation.

**The risk.** The realistic incident is not a movie villain. It is your own
agent, misconfigured after a prompt change, reading ten times the data it
should at 2 a.m. If shutting it off means finding the right connection string,
rotating a key, and redeploying, you are measuring the blast radius in hours.
Agents fail at machine speed. A revocation path that runs at human speed
guarantees the incident is over before your response starts.

**The fix.** Revocation this fast requires that access flows through something
you control at runtime, either short-lived credentials that simply stop being
issued, or an enforcement point that starts saying no. If agents hold
long-lived credentials that connect directly to databases, immediate
revocation is structurally impossible no matter what you build around it.
That is usually the architectural decision this whole assessment turns on.

---

### GOV-4: Time-limited access by default

**The capability.** Access expires on its own unless renewed. Permanent
credentials are the exception and require justification, not the default
nobody questions.

**The risk.** Standing credentials accumulate silently. The agent from last
quarter's experiment still has its key. The demo agent someone built for a
sales call can still reach staging, which has a copy of production data.
Nobody decided to accept these risks. They just never expired. Every one of
them is an entry in the breach report you have not had yet.

**Closing it.** Expiring credentials are a solved problem technically: issue
short-lived tokens, require renewal, alert on renewal failures instead of
silently breaking. The real work is cultural and operational, because teams
resist expiry until renewal is automatic and invisible. Make renewal free and
expiry stops being a fight.

---

### DATA-1: Sensitive field classification

**The capability.** PII, financial, and health fields are tagged in a way
policy can reference. The knowledge of which columns are dangerous lives in
metadata, not in the heads of two senior engineers.

**The risk.** Unclassified data makes every downstream control approximate.
You cannot mask what nothing has named. The failure mode is quiet: someone
adds a `notes` column, support staff start pasting phone numbers into it, and
no policy anywhere knows that column is now PII. Your masking works perfectly
on the columns you tagged two years ago and does nothing for the ones that
matter now.

**Closing it.** Start narrow: classify the tables agents actually touch, not
the whole warehouse. A tagging pass over a few dozen tables is days, not
months. The ongoing discipline is process, meaning new columns get classified
at creation, ideally enforced in schema review. Automated scanners help find
what you missed but do not replace ownership.

---

### DATA-2: Automatic masking

**The capability.** Sensitive fields are masked by policy at query time. The
support agent sees `a***@gmail.com` because the system decided that, not
because the agent's prompt asked it to be careful.

**The risk.** Masking by convention is not masking. An agent instructed to
"never reveal emails" will comply until a clever prompt, a model update, or an
ordinary bug changes its behavior, and you will find out from a screenshot.
The difference between "the model was told not to" and "the data never reached
the model" is the entire difference between a guideline and a control.

**Closing it.** Masking has to happen in the data path, between the store and
the agent. Database-native masking features cover single databases but not the
cross-store consistency agents need. Building a masking proxy is real
engineering, on the order of months if you want per-principal rules and format
preservation. This is one of the two or three capabilities where the
build-versus-buy math most clearly favors not building.

---

### DATA-3: Enforcement before execution

**The capability.** A disallowed query never runs. Policy is checked before
execution, not reconstructed from logs afterward.

**The risk.** Post-hoc review means every violation is a leak that already
happened. The log line that says the agent read 40,000 customer rows at 3 a.m.
is not a control, it is a confession with a timestamp. Detection after the
fact turns a preventable non-event into an incident with notification
obligations.

**Closing it.** Pre-execution enforcement means intercepting the query,
evaluating it against policy, and only then letting it run. The naive version,
regex on SQL strings, fails quickly because SQL has too many ways to say the
same thing. Doing this properly requires parsing queries and reasoning about
what they touch, which is compiler-adjacent work. Very few teams should build
this in-house, but every team running agents on sensitive data needs it to
exist somewhere in their stack.

---

### DATA-4: Per-agent views of the same data

**The capability.** The support agent and the analytics agent query the same
table and receive different things: different columns, different rows,
different masking, each according to its own policy.

**The risk.** Without per-agent views, access decisions collapse to
one-size-fits-all, and the size that fits all is the most permissive one any
agent needs. Your least trusted agent inherits the access your most trusted
agent required. Least privilege becomes impossible by construction, not
because anyone chose that.

**Closing it.** This requires that the enforcement layer knows who is asking,
which is why it depends on GOV-1 (identity) and DATA-3 (enforcement in the
query path). Once those exist, per-agent views are policy configuration rather
than new infrastructure. If you are sequencing a roadmap, this lands
naturally after those two.

---

### AUD-1: Queryable access history

**The capability.** "Which agents accessed this customer's data, and when" is
a query against a system of record, answerable in minutes.

**The risk.** The question arrives in exactly three forms, all urgent: a
customer exercising a GDPR or deletion request, a security incident, or an
auditor. If the answer requires grepping application logs across services and
correlating timestamps by hand, you are doing forensic archaeology under
deadline, and the honest answer to "are we sure that is everything" is no.

**Closing it.** The record has to be produced by the access path itself, not
assembled from whatever each service happened to log. If every agent query
already flows through an enforcement point, capturing structured records there
is nearly free. If access is scattered, building this means building the
central path first, which is the recurring theme of this report.

---

### AUD-2: Access tied to a reason

**The capability.** Every access record carries the originating task or
justification, not just an identity, a timestamp, and a query.

**The risk.** "The support agent read this customer's record" is not by itself
suspicious, agents do that all day. What you need to distinguish is the read
attached to ticket 4521 from the read attached to nothing. Without intent on
the record, your audit trail can prove what happened but never whether it
should have, so every investigation stalls at the same place.

**Closing it.** This is mostly a matter of threading context: the task ID or
request justification travels with the agent's query and lands in the access
record. Cheap if designed in from the start, annoying to retrofit because
every agent integration has to pass one more field. Worth mandating early for
exactly that reason.

---

### AUD-3: Decisions traceable to policy

**The capability.** Every allow and every deny points at the specific policy
version that produced it. The "why" is on the record.

**The risk.** An access that cannot be traced to a policy is indistinguishable
from a bug. When something surprising turns up in the audit trail, the first
question is "did we intend this," and without policy attribution the answer
requires reconstructing what the rules were at that moment from memory and git
archaeology. Auditors specifically probe this, because untraceable allows are
where real problems hide.

**Closing it.** Two requirements: policies are versioned (policy-as-code in
git gives you this for free), and the enforcement point stamps each decision
with the version it evaluated. Neither is difficult if enforcement is
centralized. Both are impossible if it is not.

---

### AUD-4: Immutable audit logs

**The capability.** Access records cannot be edited or deleted after the fact,
including by administrators.

**The risk.** A mutable log proves nothing. The moment anyone with admin
access could have altered the record, its value in a dispute, an
investigation, or a compliance review drops to roughly zero, and opposing
counsel knows it. Worse, the person most motivated to edit a log is precisely
the insider whose access you most need the log to describe.

**Closing it.** Standard patterns exist: append-only storage, hash chaining so
tampering is detectable, retention enforced by the platform rather than by
policy documents. A few weeks to build properly, and it is the kind of
infrastructure that must be right the first time, because an audit trail whose
integrity is questioned once is questioned forever.

---

### OPS-1: Instant kill switch

**The capability.** A tested control disables a misbehaving agent immediately,
without a deploy, and everyone on call knows where it is.

**The risk.** You will need this at the worst possible moment: an agent
looping on a destructive action, or hammering production with expensive
queries during peak traffic. If the runbook says "revert the config and
redeploy," your time to stop the bleeding is your deploy time plus however
long it takes to wake the person who knows which config. Agents multiply
faster than runbooks get written.

**Closing it.** The switch itself is simple once GOV-3 (immediate revocation)
exists, since disabling an agent is revoking everything it holds. The part
teams skip is testing it. An untested kill switch is a hypothesis. Put it in
the game-day rotation the same way you test backups.

---

### OPS-2: Policy rollback

**The capability.** Policies are versioned, and reverting to a known-good
state is one action.

**The risk.** A bad policy change is a production incident in disguise.
Too permissive, and you have an exposure window measured by however long it
takes someone to notice. Too restrictive, and every agent starts failing at
once, which looks exactly like an outage. If rolling back means remembering
what the policy said before and editing it back by hand under pressure, both
failure modes get longer.

**Closing it.** Policy-as-code solves this almost as a side effect: policies
live in git, changes are commits, rollback is a revert. If your policies
currently live in database rows or a web console, moving them to versioned
files is a modest migration that also unlocks review workflows and AUD-3.
Few changes buy this much for this little.

---

### OPS-3: Safe policy testing

**The capability.** A proposed policy change can be evaluated against real
traffic patterns before it is enforced.

**The risk.** Untested policy changes are untested code in your data path,
except the blast radius is every agent at once. The specific failure is not
the change you were worried about, it is the interaction you did not see: the
new deny rule that also matches the billing agent's nightly job, discovered at
2 a.m. when invoices stop going out.

**Closing it.** The pattern is shadow evaluation: run the proposed policy
alongside the active one, log where the decisions differ, enforce nothing.
Requires centralized enforcement (the theme again) and a diff report. Teams
that have this ship policy changes with the same confidence as code behind a
feature flag. Teams that do not, ship them the way we all shipped code in
2009, which is to say bravely.

---

### OPS-4: Anomaly alerting

**The capability.** Unusual agent access patterns page a human: volume spikes,
new tables, odd hours, scope creep.

**The risk.** Agents fail differently from humans. A confused employee
misreads one record. A confused agent reads a hundred thousand, in minutes,
with perfect confidence. Every control in this report bounds what an agent can
do, but within those bounds, anomaly detection is how you find out that
something has gone wrong before the numbers show up somewhere worse.

**Closing it.** Start embarrassingly simple: baseline rows-per-hour per agent,
alert at 10x. That single threshold catches most real incidents and costs an
afternoon if structured access records (AUD-1) already exist. Resist the
temptation to build a machine learning project here before the simple version
has run for a quarter. The simple version will teach you what the fancy one
should look for.

---

### AUTO-1: Governed read path

**The capability.** Agents reach production data through a path that enforces
policy, not through copied credentials or an ungoverned replica.

**The risk.** Ungoverned reads are how exfiltration starts, and the common
version is not malicious. It is the well-meaning shortcut: production
credentials pasted into an agent config to unblock a demo, or a replica spun
up "temporarily" without the production controls. Every such path is invisible
to all the other capabilities in this report. You cannot mask, audit, or
revoke traffic you never see.

**Closing it.** This is less a feature than a rule with teeth: agents get data
through the governed path, and the governed path is easier to use than the
workaround. That last clause is the whole game. If the sanctioned path is
slower or more annoying than pasting credentials, engineers will paste
credentials, and no policy document will stop them.

---

### AUTO-2: Human approval workflows

**The capability.** Agents can request elevated access, and a human grants it
with full context: what is being asked, on which data, for what task.

**The risk.** Without an approval mechanism there are only two settings:
blanket access, which means the agent's worst day is unbounded, or blanket
denial, which means humans do manually whatever agents are forbidden to do,
and the pressure to quietly widen access builds until someone gives in.
Approvals are the release valve that lets you keep the default tight.

**Closing it.** The workflow is request, notify, decide, grant, expire. The
design decision that matters is what the approver sees. An approval request
that says "agent needs database access, approve?" trains people to click yes.
One that says "support agent requests unmasked email for customer 8231 to
process a deletion request, expires in one hour" lets a human actually judge.
Context is the feature; the buttons are trivial.

---

### AUTO-3: Production actions under policy

**The capability.** Agents can write and act in production because policy
makes each action safe, not because someone senior accepted the risk.

**The risk.** Reads leak data. Writes change reality: records updated,
refunds issued, emails sent. The teams that get burned are the ones that
graduated agents from reads to writes because the reads went well, without
noticing that their controls were read-shaped. An audit trail tells you which
refunds the agent issued. Only pre-execution policy determines which refunds
it can issue.

**Closing it.** Everything earlier in this report is a prerequisite: identity,
central policy, pre-execution enforcement, approvals, revocation, immutable
audit. Writes are where those investments pay out, because this is the level
where agents stop being a research expense and start doing work that shows up
in headcount math. Sequence accordingly, and do not let a promising pilot
rush the order.

---

### AUTO-4: Scoped, expiring approvals

**The capability.** An approval grants specific access for a bounded time,
then expires on its own. Not permanent elevation with a yes attached.

**The risk.** "Approved once, elevated forever" defeats the point of asking.
Six months of blanket approvals leaves the agent fleet holding a pile of
standing elevated access that no one remembers granting and no review will
ever fully reconstruct. Each approval was reasonable. The accumulation is the
exposure.

**Closing it.** Structurally this is GOV-4 applied to approvals: the grant
carries its scope and its expiry, and enforcement honors both. Where it is
signed and enforced at runtime, an approval becomes something closer to a
warrant than a permission bit, which is also what makes the audit story
coherent: every elevated access traces to a specific human decision with a
specific boundary.

---

## Provenance footer (Section 5)

The Agent Readiness Index is maintained by VaultKit, a runtime governance
layer for AI agents. If any of these gaps are on your roadmap, reply to this
email. It comes to a person, not a queue.
