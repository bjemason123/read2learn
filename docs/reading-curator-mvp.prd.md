# Reading Curator MVP — PRD

*Status: draft v1 — derived from `docs/requirements-v0.7.md` (full-service requirements statement) plus a scoped-down founder MVP.*
*Author: Brian Mason (bjemason@gmail.com) · Date: 2026-08-17*

---

## 1. Problem Statement

Adult self-improvers who want to learn a subject in their own time read a lot but frequently fail to meet their own learning objectives. They have no service that helps them:

- turn a vague ambition ("learn X") into a concrete learning goal, and
- organise and maintain a reading list/plan against that goal over time.

The result: reading happens, but it doesn't add up to learning. There's no tutor, cohort or deadline to catch the drift, and no existing tool treats "organise and maintain a learning + reading plan" as its core job — general reading-list and note apps are either passive (bookmarks) or generic (PKM tools with no goal orientation).

**Who**: adult learner, self-improvement motivated, time-poor (not motivation-poor).
**What**: they read widely around a topic but don't converge on their stated learning goal.
**Why now**: no existing service organizes and maintains a learner's goal-linked reading plan — the market gap is real, and the founder (Brian) is personally living this problem while trying to learn a subject, making this a dogfoodable v1.

## 2. Evidence

- Founder's own lived experience: currently trying to learn a topic and hitting exactly this failure mode (reads material, doesn't converge on the goal).
- `docs/requirements-v0.7.md` (this repo) is a consolidated, evidence-referenced requirements statement (citing Karpicke & Blunt 2011, concept-mapping meta-analyses, etc.) built from a prior research pass — it establishes that retrieval practice and self-directed sequencing are real, well-evidenced problem areas for adult learners, and that free/ad-hoc tools don't address them.
- No direct user interviews or market data have been gathered yet beyond the founder's own experience.
- **Gap**: TBD — needs research. No competitive teardown or user validation beyond n=1 (the founder) has been performed for this PRD.

## 3. Proposed Solution

Build a **working app** that lets a learner:

1. State and refine a learning goal.
2. Attach reading material (recommended and/or self-supplied) to that goal.
3. Maintain a living reading list/plan tied to the goal, that the learner returns to and updates.

This is a deliberately thin slice of the much larger service described in `docs/requirements-v0.7.md` (segment identification, retrieval practice, spaced review, the knowledge artefact, adaptive diagnosis). Those remain the long-term vision and are explicitly deferred past this MVP — see §5 and §9. The MVP tests the foundational hypothesis that a goal-scoped reading plan, kept alive and revisited, is something people will actually use — before investing in the harder, evidence-heavy curatorial machinery (segment claims, corroboration, retrieval loop) that the fuller spec calls for.

There is no existing codebase to extend — this repository currently contains only the requirements document and devcontainer scaffolding (see §10). The MVP is greenfield.

## 4. Key Hypothesis

If a learner can specify a learning goal and attach reading material to it in one place, they will return to and actively maintain that plan (rather than abandoning it, as happens today with ad-hoc reading).

Falsifiable via the primary success metric (§6): frequency of visits and updates to the learning plan/reading list per learner over time. If usage is a one-time setup with no return visits, the hypothesis is disproved and the "durable, living plan" premise needs rethinking before further build-out.

## 5. What We're NOT Building

Explicitly out of scope for this MVP (deferred to later phases per the full requirements statement's phasing in §15 of `requirements-v0.7.md`, unless noted):

- **Multi-source corroboration for segment claims** (FR-94/FR-95 — requiring ≥2 independent signals before a subtractive "skip this" claim). Deferred per scope decision.
- **Segment identification as a curatorial act** (chapter/section-level "read this, not that" guidance, confidence scoring, dependency warnings) — the core differentiator of the full spec, but not needed to test the MVP hypothesis of "specify goal + attach material + maintain plan."
- **Retrieval practice / recall-as-note / spaced review** (§9.8 of the full spec) — the "spine" of the full product, deferred.
- **The knowledge artefact / concept mapping** (§9.9) — explicitly v2 in the full spec; also deferred here.
- **Learner-led sequencing support** (suggested order, dependency warnings at ordering time) — deferred; MVP reading list is unordered/learner-free-form.
- **Diagnosis & adaptation** (struggle detection, re-scoping) — deferred.
- **Themes / concept surfacing across notes** — deferred.
- Multi-user/social features, accreditation, non-science subjects, hosting or serving content — out of scope per the full spec's non-goals and not revisited here.
- No additional out-of-scope items were flagged beyond the above (scope answer 5: none).

## 6. Success Metrics

- **Primary**: frequency of visits to, and updates made to, the learning plan / reading list per active learner (a proxy for the plan being "alive" rather than abandoned). Specific target thresholds — TBD, needs a few weeks of usage data before setting a bar.
- **Secondary** (not yet instrumented, candidates for later): number of goals created vs. goals with ≥1 reading item attached; retention of the reading list across sessions (does the learner come back at all).
- Explicitly *not* a v1 metric: learning-outcome measurement (retention, test performance) — the full spec treats any claim of measured learning-outcome improvement as a non-goal until later evidence exists (§8 of `requirements-v0.7.md`), and this MVP has no retrieval-practice loop to measure against anyway.

## 7. Open Questions

- What counts as a "visit" or "update" for the primary metric — is any list view a visit, or only edits? TBD — needs product decision before instrumentation is built.
- Single-user (founder dogfood) vs. multi-user from day one? Scope answers imply a working app to test the concept personally — TBD whether auth/multi-tenancy is needed for v1 or can be deferred.
- Data model for "reading material" — is it free text/links only, or does it need bibliographic verification (FR-8, FR-40 in the full spec) from day one? Leaning toward free text/links for MVP simplicity, but not yet decided.
- Platform: web app, mobile, or both? Not specified in scope answers — TBD.
- No further scope items were requested (scope answer 5: no).

## 8. Users & Context

**Primary user / JTBD**: An adult learner pursuing self-directed improvement on a topic, with limited time, who needs to organize and track a learning goal and the reading material that serves it, so that scattered reading converges into progress toward that goal instead of dissipating.

**Not users for this MVP** (carried over from the full spec's non-target list, still applicable): full-time students, learners inside a formal curriculum, frontier researchers, browsers with no specific goal.

**Context of use**: fragmented personal time, self-directed (no tutor/cohort/deadline), initially validated through the founder's own use while learning a real subject.

## 9. Solution Detail

### MoSCoW

| Priority | Item | Source |
|---|---|---|
| Must | Learner can state/create a learning goal | Scope answer 2; FR-1 (requirements-v0.7.md) |
| Must | Learner can attach reading material (own or entered) to a goal | Scope answer 2; FR-12 |
| Must | Learner can view and maintain a reading list/plan tied to the goal across sessions | Scope answer 2; FR-17 |
| Must | App is a working, usable end-to-end app (not a prototype/mock) | Scope answer 1 |
| Should | Basic progress marking per reading item (not started / in progress / done) | Adjacent to FR-18, low-cost addition that supports the "maintain plan" behaviour the success metric measures |
| Should | Ability to revise/edit a goal without losing attached material | FR-6 |
| Could | Service-suggested reading material (research/recommend) | FR-7 — explicitly deferred-leaning; not required to test the core hypothesis, and pulls in verification complexity (FR-8, FR-40) |
| Could | Deferral/backlog distinction for material not yet admitted | FR-62 |
| Won't (this MVP) | Segment identification, corroboration, retrieval practice, concept map/artefact, sequencing suggestions, diagnosis/adaptation | See §5 |

### MVP definition

A single learner can: create a learning goal → add one or more reading items to it (manually, by title/URL/free text) → see and update the list over multiple sessions → mark items' progress. That loop, kept alive across return visits, is the entire MVP surface. Everything else in `docs/requirements-v0.7.md` is explicitly future work.

## 10. Technical Approach

**Current repository state (verified by reading the working tree):**
- `docs/requirements-v0.7.md` — the full requirements statement this PRD is derived from. Verified present.
- `.devcontainer/devcontainer.json` and `.devcontainer/devcontainer-lock.json` — devcontainer scaffolding only. Verified present; contents not yet inspected for stack implications.
- `.archon/config.yaml` — Archon workspace config, not application code.
- **No application source code exists in this repository yet** — no `src/`, no package manifest (`package.json`, `pyproject.toml`, etc.), no database schema, no API routes. This is a greenfield build.

Because there is no existing application code, no file paths, function names, API endpoints, or DB schema can be verified or referenced — all of the following are **needs verification / to be decided during implementation planning**, not confirmed facts:

- Application stack (frontend framework, backend language/framework, hosting) — TBD, not present in repo, no decision recorded in scope answers.
- Data storage (learner, goal, reading item entities per §10 of `requirements-v0.7.md` — a reasonable starting entity model to reuse, but not yet implemented anywhere).
- Auth/multi-tenancy approach — depends on open question in §7 (single-user dogfood vs. multi-user).

**Recommendation for next step**: before writing implementation phases with real file/module references, a stack decision and initial scaffold are needed. This PRD intentionally stops short of prescribing a stack since none was specified in the scope answers and none exists in the codebase to extend.

## 11. Implementation Phases

| Phase | Status | Scope | Parallelizable? |
|---|---|---|---|
| 0. Stack & scaffold decision | Not started | Choose stack, scaffold a minimal working app skeleton (frontend + backend + persistence) | No — blocks everything else |
| 1. Goal + reading list core loop | Not started | Implement Must-haves from §9: create goal, attach reading material, view/maintain list across sessions | No — depends on Phase 0 |
| 2. Progress tracking & goal editing | Not started | Should-haves: per-item progress state, goal revision without data loss | Can start once Phase 1's data model exists; UI and backend work can proceed in parallel once schema is fixed |
| 3. Usage instrumentation | Not started | Track visits/updates to plan for the primary success metric (§6) | Can be built alongside Phase 1–2 once the core entities exist |
| 4. (Optional, Could-have) Service-suggested material | Not started | FR-7-style recommendation, only if Phase 1–3 validate the hypothesis | Deferred until after MVP usage data is in |

No implementation has started; this is a fresh PRD for a greenfield build.

## Validation Notes

All technical references verified against codebase. No corrections needed.

Checked: repository was confirmed to contain no application source code (no `packages/server`, no routes, no migrations, no UI components, no package manifest) — only `docs/requirements-v0.7.md`, `.devcontainer/` scaffolding, and `.archon/config.yaml`. The PRD's Technical Approach section already correctly states this greenfield status and marks stack, schema, and API decisions as TBD rather than asserting specifics, so it required no edits.

## 12. Decisions Log

- **MVP scope narrowed to goal + reading-list core loop only**, deferring segment identification, retrieval practice, the knowledge artefact, and sequencing — even though these are central to the full `requirements-v0.7.md` vision — because the scope answers prioritized validating the simpler "specify goal + attach material" hypothesis first (scope answers 1–2).
- **Multi-source corroboration explicitly deferred** (scope answer 4), consistent with deferring segment identification generally — corroboration only matters once subtractive segment claims exist.
- **Primary success metric set to usage frequency (visits/updates to the plan)**, not learning-outcome measurement, both because the MVP has no retrieval-practice loop to measure against and because the full spec treats learning-outcome claims as an explicit non-goal until later evidence (scope answer 3).
- **No additional scope items added** — user confirmed no further scope needed (scope answer 5).
- **Technical Approach left largely unresolved (stack, entities, hosting)** rather than guessed, because the repository has no application code and the scope answers didn't specify a stack — per the first-principles rule, nothing was asserted that couldn't be verified by reading the codebase.
