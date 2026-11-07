# Reading Curator MVP — PRD

*Status: v3 — MVP built and in dogfood use; reconciled with the code at `aeb560c` (2026-08-31) on 2026-11-07. Derived from `docs/requirements-v0.7.md` (full-service requirements statement) plus a scoped-down founder MVP.*
*Author: Brian Mason (bjemason@gmail.com) · Created: 2026-08-17 · Updated: 2026-11-07 (reconciled with shipped code; post-MVP review §13 annotated with current issue status)*

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

This was a greenfield build when the PRD was written. The MVP described here is now implemented — see §10 for the stack as built, §11 for phase status, and §13 for a review of the shipped product.

## 4. Key Hypothesis

If a learner can specify a learning goal and attach reading material to it in one place, they will return to and actively maintain that plan (rather than abandoning it, as happens today with ad-hoc reading).

Falsifiable via the primary success metric (§6): frequency of visits and updates to the learning plan/reading list per learner over time. If usage is a one-time setup with no return visits, the hypothesis is disproved and the "durable, living plan" premise needs rethinking before further build-out.

## 5. What We're NOT Building

Explicitly out of scope for this MVP (deferred to later phases per the full requirements statement's phasing in §15 of `requirements-v0.7.md`, unless noted):

- **Multi-source corroboration for segment claims** (FR-94/FR-95 — requiring ≥2 independent signals before a subtractive "skip this" claim). Deferred per scope decision.
- **Segment identification as a curatorial act** (chapter/section-level "read this, not that" guidance, confidence scoring, dependency warnings) — the core differentiator of the full spec, but not needed to test the MVP hypothesis of "specify goal + attach material + maintain plan."
- **Retrieval practice / recall-as-note / spaced review** (§9.8 of the full spec) — the "spine" of the full product, deferred. The notes feature that shipped is passive capture (free-form notes against a location, with tags and question links); it has no recall prompt and no scheduling.
- **The knowledge artefact / concept mapping** (§9.9) — explicitly v2 in the full spec; also deferred here. A read-only, machine-derived Concept Graph (`/graph`) shipped later without a PRD decision (see §10 and §12). It is not the learner-constructed map FR-108/FR-109 describe, so it does not close this deferral.
- **Learner-led sequencing support** (suggested order, dependency warnings at ordering time) — deferred. The learner can reorder reading items manually (up/down, shipped); there is no suggested order, no dependency model and no warnings.
- **Diagnosis & adaptation** (struggle detection, re-scoping) — deferred.
- **Themes / concept surfacing across notes** — deferred.
- Social features and sharing, accreditation, non-science subjects, hosting or serving content — out of scope per the full spec's non-goals and not revisited here. (Per-user accounts, which are not social features, did ship — see §7 and §12. The code does not enforce the science-only scope.)
- No additional out-of-scope items were flagged beyond the above (scope answer 5: none).

## 6. Success Metrics

- **Primary**: frequency of visits to, and updates made to, the learning plan / reading list per active learner (a proxy for the plan being "alive" rather than abandoned). Specific target thresholds — TBD, needs a few weeks of usage data before setting a bar.
- **Secondary** (not yet instrumented, candidates for later): number of goals created vs. goals with ≥1 reading item attached; retention of the reading list across sessions (does the learner come back at all).
- Explicitly *not* a v1 metric: learning-outcome measurement (retention, test performance) — the full spec treats any claim of measured learning-outcome improvement as a non-goal until later evidence exists (§8 of `requirements-v0.7.md`), and this MVP has no retrieval-practice loop to measure against anyway.

## 7. Open Questions

**Resolved during MVP build** (see §13 for the review that closed them):

- ~~Single-user vs. multi-user from day one?~~ **Resolved, then reversed.** The MVP was built single-user with no auth. On 2026-08-27 (commit `8b73e2a`) email/password accounts were added and `Goal` and `Tag` were scoped to a `User`; ownership of `ReadingItem`, `Note` and `Question` is enforced through the `Goal` foreign-key chain. The app is therefore multi-user in its data model, though the repository contains no hosting or deployment configuration and it still runs locally via `next dev`.
- ~~Data model for "reading material": free text/links, or bibliographic verification?~~ **Resolved: free text/links.** `ReadingItem` carries title, optional author, optional URL, and a type enum (BOOK/PAPER/ARTICLE/OTHER). No verification (FR-8, FR-40) was implemented.
- ~~Platform: web, mobile, or both?~~ **Resolved: responsive web app**, server-rendered.
- ~~Should questions be first-class entities?~~ **Resolved: yes (issue #22, closed).** `Question` is its own model (`text`, `order`, `goalId`) with a many-to-many link to `Note`. A question counts as "answered" when it has at least one linked note, and the goal page shows "N of M questions still open". Questions can be added and deleted; there is no edit or reorder, and "answered" is derived, not something the learner declares.

**Still open:**

- What counts as a "visit" or "update" for the primary metric? Still undecided, and still blocking: events are written for every mutation plus `goal_viewed` and `graph_viewed` (about 22 `recordEvent` call sites), but the only code that touches the `Event` table is the create in `src/lib/events.ts`, so the primary metric is uncomputed. The proposed resolution is to treat *updates* as the metric and views as background context — see §13 (issue #21, open).
- What is the Concept Graph for? It shipped (commit `23039f1`, PR #37) with no PRD entry, design doc or success criterion; the only stated intent is a code comment calling it a "recurring-reference view (~every second session)". Decide whether it is kept as a navigation aid, evolved toward the learner-constructed map in the full spec (FR-108/FR-109), or retired. Open issue #39 (unreadable in dark mode) applies either way.
- How should multiple goals be treated? `requirements-v0.7.md` FR-5 says concurrent goals should be "actively discouraged"; the product allows unlimited goals with no status, priority or archive.
- Should the PRD's scope grow to cover curriculum definition (outcomes, milestones, a weekly time budget, completion condition)? Neither this PRD nor `requirements-v0.7.md` has a curriculum concept above `Goal`; `requirements-v0.7.md` covers parts of it (FR-3 time budget, FR-4 completion condition, FR-54 sub-goals, FR-29 chunking). Open; not decided by this refresh.
- No further scope items were requested (scope answer 5: no).

## 8. Users & Context

**Primary user / JTBD**: An adult learner pursuing self-directed improvement on a topic, with limited time, who needs to organize and track a learning goal and the reading material that serves it, so that scattered reading converges into progress toward that goal instead of dissipating.

**Not users for this MVP** (carried over from the full spec's non-target list, still applicable): full-time students, learners inside a formal curriculum, frontier researchers, browsers with no specific goal.

**Context of use**: fragmented personal time, self-directed (no tutor/cohort/deadline), initially validated through the founder's own use while learning a real subject.

## 9. Solution Detail

### MoSCoW

*Status column added 2026-11-07, checked against the code at `aeb560c`.*

| Priority | Item | Source | Status |
|---|---|---|---|
| Must | Learner can state/create a learning goal | Scope answer 2; FR-1 (requirements-v0.7.md) | Shipped. Form has no scaffolding (#23, open) |
| Must | Learner can attach reading material (own or entered) to a goal | Scope answer 2; FR-12 | Shipped |
| Must | Learner can view and maintain a reading list/plan tied to the goal across sessions | Scope answer 2; FR-17 | Shipped |
| Must | App is a working, usable end-to-end app (not a prototype/mock) | Scope answer 1 | Shipped, with accounts; runs locally, not hosted |
| Should | Basic progress marking per reading item (not started / in progress / done) | Adjacent to FR-18, low-cost addition that supports the "maintain plan" behaviour the success metric measures | Shipped. No goal-level rollup (#21, open) |
| Should | Ability to revise/edit a goal without losing attached material | FR-6 | Shipped |
| Could | Service-suggested reading material (research/recommend) | FR-7 — explicitly deferred-leaning; not required to test the core hypothesis, and pulls in verification complexity (FR-8, FR-40) | Not started; there is no LLM or bibliographic client in `package.json` |
| Could | Deferral/backlog distinction for material not yet admitted | FR-62 | Shipped (the `deferred` flag). Defer vs. Delete unexplained (#24, open) |
| Won't (this MVP) | Segment identification, corroboration, retrieval practice, concept map/artefact, sequencing suggestions, diagnosis/adaptation | See §5 | Not built, except that a machine-derived read-only Concept Graph and manual reordering shipped (see §5, §10) |

### MVP definition

A single learner can: create a learning goal → add one or more reading items to it (manually, by title/URL/free text) → see and update the list over multiple sessions → mark items' progress. That loop, kept alive across return visits, is the entire MVP surface. Everything else in `docs/requirements-v0.7.md` is explicitly future work.

## 10. Technical Approach

*This section was written when the repository was greenfield. It has been rewritten to describe what was actually built.*

**Stack as built** (re-verified 2026-11-07 against `package.json`, `prisma/schema.prisma` and `src/` at `aeb560c`):

- **Next.js 16.3.1 (App Router)** with React 19.2.8, TypeScript. Server components by default; mutations are server actions, not REST routes. Route protection lives in `src/proxy.ts` (Next.js 16's replacement for `middleware.ts`).
- **Prisma ^7.9.1 over SQLite** (`prisma/schema.prisma`, `better-sqlite3` adapter). Client generated to `src/generated/prisma`; `postinstall` runs `prisma generate`.
- **Authentication** — email and password, built on Node `crypto` with no auth library: scrypt password hashing and an HMAC-signed session cookie valid for 30 days (`src/lib/auth.ts`, `src/lib/session.ts`). `SESSION_SECRET` must be set in production; development uses a fallback value. `src/proxy.ts` redirects any unauthenticated request to `/login`, except the login and signup pages and static assets.
- **Hand-rolled CSS** in `src/app/globals.css` using custom properties (`--space-*`, `--accent`, `--surface`, `--border`) with a `prefers-color-scheme` dark variant. No CSS framework. The Concept Graph hard-codes its edge colours, which is the likely cause of #39.
- **Vitest + Testing Library** for unit and component tests.
- **No hosting configuration** in the repository — it runs locally via `next dev`.

**Entity model as built:**

- `User` — unique email, password hash; owns `Goal` and `Tag` rows.
- `Goal` — title, optional description, `userId`; has many `Question` and `ReadingItem` rows. No status, deadline, completion condition or time budget.
- `Question` — text, `order`, `goalId`; many-to-many with `Note`. "Answered" is derived (at least one linked note). Add and delete only; no edit or reorder.
- `ReadingItem` — title, optional author/url/note, `ItemType` enum, `Progress` enum (NOT_STARTED/IN_PROGRESS/DONE), `deferred` flag, `position` for manual ordering; cascades from `Goal`. The `note` field predates the notes feature and is now legacy (#9, open).
- `Note` — body, optional `location` (page/chapter/section), `order`; cascades from `ReadingItem`; many-to-many with `Tag` and with `Question`. Notes can be edited inline.
- `Tag` — name, unique per user (`@@unique([userId, name])`), shared across that user's notes.
- `Event` — type, optional `goalId`/`readingItemId`/`userId`, `createdAt`. **Written but never read** (§13).

**Route map:** `/` landing page · `/goals` dashboard · `/goals/new` · `/goals/[id]` detail · `/goals/[id]/print` · `/goals/[id]/items/[itemId]` notes · `/goals/[id]/items/[itemId]/edit` · `/tags` · `/tags/[name]` · `/graph` · `/login` · `/signup`. Logout is a server action under `src/app/logout`, not a page. The header navigation links to `/goals` and `/graph`; `/tags` is still reachable only from a tag chip (#19, open).

**Concept Graph (`/graph`)** — shipped in commit `23039f1` (PR #37, 2026-08-31) with no design doc. It is a read-only, dependency-free SVG diagram with goals on an inner ring and the user's tags on an outer ring. Tag-to-tag edges come from two tags sharing a note; goal-to-tag edges come from walking Note → ReadingItem → Goal. It is computed at read time from existing tables, so there are no graph entities. Only goals that have at least one tagged note appear; questions, reading items and notes are not nodes, and edges are unlabelled. The learner cannot add or edit anything on it. It records a `graph_viewed` event per visit.

## 11. Implementation Phases

| Phase | Status | Scope | Notes |
|---|---|---|---|
| 0. Stack & scaffold decision | **Done** | Next.js 16 + Prisma/SQLite scaffold | See §10 |
| 1. Goal + reading list core loop | **Done** | Create goal, attach reading material, view/maintain list across sessions | All §9 Must-haves shipped |
| 2. Progress tracking & goal editing | **Done** | Per-item progress state, goal revision without data loss | Both Should-haves shipped |
| 3. Usage instrumentation | **Partial** | `Event` rows written for all mutations plus `goal_viewed` and `graph_viewed` | **Write-only — nothing reads the table, so the primary metric (§6) is still uncomputed** (#21, open) |
| 4. (Optional, Could-have) Service-suggested material | Not started | FR-7-style recommendation | Still deferred pending usage data |

**Also shipped beyond the original phase plan** (dates are commit dates):

- Defer/restore for reading items — the §9 Could-have (2026-08-19).
- Manual reordering of reading items within a goal (2026-08-23).
- Print/PDF view of a goal (2026-08-23), extended to include structured notes for each reading item (2026-08-29).
- Per-location reading notes with tags and cross-goal tag browsing (2026-08-23), with inline note editing.
- A landing page at `/`, with the dashboard moved to `/goals` (2026-08-25).
- First-class questions with note links (#22, 2026-08-26).
- Email/password accounts, with data scoped per user (2026-08-27).
- Moving a reading item to another goal (2026-08-29).
- The read-only Concept Graph at `/graph` (2026-08-31); see §10 and §7 for its open status.

The MVP loop defined in §9 is built and in use. Phases 0–2 are complete; Phase 3 is half-built. Most of the list above was built outside the original phase plan; only defer/restore (the §9 Could-have) and first-class questions (the §13 review) trace back to this document.

## Validation Notes

*Original note (build not yet started) superseded.* Re-validated 2026-08-25 against the working tree at `ca90d50`: stack, entity model, and route map in §10 read directly from `package.json`, `prisma/schema.prisma`, and `src/app/`. The §13 findings below were produced by reading `src/app/page.tsx`, `src/app/goals/page.tsx`, `src/app/goals/[id]/page.tsx`, `src/app/goals/new/page.tsx`, `src/app/tags/page.tsx`, and `src/lib/events.ts`.

Re-validated again 2026-11-07 against `aeb560c`, by reading `package.json`, `prisma/schema.prisma`, `src/proxy.ts`, `src/lib/auth.ts`, `src/lib/graph.ts`, `src/lib/questions.ts`, `src/lib/readingItems.ts`, `src/lib/events.ts`, the route tree under `src/app/`, the git log, and the GitHub issue list. The app was not run and the test suite was not re-run for this refresh, so statements about behaviour come from reading source. The last recorded test run is the 182 tests passing noted in the auth commit message (`8b73e2a`).

## 12. Decisions Log

- **MVP scope narrowed to goal + reading-list core loop only**, deferring segment identification, retrieval practice, the knowledge artefact, and sequencing — even though these are central to the full `requirements-v0.7.md` vision — because the scope answers prioritized validating the simpler "specify goal + attach material" hypothesis first (scope answers 1–2).
- **Multi-source corroboration explicitly deferred** (scope answer 4), consistent with deferring segment identification generally — corroboration only matters once subtractive segment claims exist.
- **Primary success metric set to usage frequency (visits/updates to the plan)**, not learning-outcome measurement, both because the MVP has no retrieval-practice loop to measure against and because the full spec treats learning-outcome claims as an explicit non-goal until later evidence (scope answer 3).
- **No additional scope items added** — user confirmed no further scope needed (scope answer 5).
- **Technical Approach left largely unresolved (stack, entities, hosting)** rather than guessed, because the repository had no application code when the PRD was first written and the scope answers didn't specify a stack — per the first-principles rule, nothing was asserted that couldn't be verified by reading the codebase. *Superseded 2026-08-25: §10 now records the stack as built, and is re-verified in the 2026-11-07 refresh.*
- **Single-user dropped in favour of accounts (2026-08-27, commit `8b73e2a`).** The MVP was built single-user with no auth (§7). Email/password accounts were then added and data was scoped per user. The commit message records what was done; no rationale was written down.
- **Questions promoted from a text blob to a first-class entity (2026-08-26, #22).** This follows the §13 review's recommendation and resolves the §7 question.
- **Concept Graph shipped without a PRD decision (2026-08-31, commit `23039f1`).** It contradicts the letter of §5's concept-mapping deferral, while not being the learner-constructed map the full spec describes. Its purpose is recorded only in a code comment. Whether to keep, evolve or retire it is now an open question in §7.
- **2026-11-07 refresh: scope unchanged.** This update reconciles the document with shipped code and annotates §13 with current issue status. It adds no new scope. Whether to extend the PRD toward curriculum definition is left open in §7.

## 13. Post-MVP Product Review (2026-08-25)

*The review text below is preserved as written on 2026-08-25. Its current status is recorded in the tracking table and in "Status update, 2026-11-07" at the end of this section.*

A review of the shipped implementation against this PRD's hypothesis (§4). Summary: **the MVP loop works, but nothing in the app reflects the product's thesis back at the user.** The hypothesis is that a goal-scoped plan *kept alive and revisited* changes behaviour. The app stores the plan; it never signals whether the plan is alive. Findings below are tracked as GitHub issues.

### Defects

- **`/tags` "Back to goals" link points at `/`**, which became the landing page when the dashboard moved to `/goals`. The label now misdescribes where it goes. Regression from the landing-page change.
- **`/tags` is effectively unreachable.** The only entry point is a tag chip on an individual note. Cross-reading tag browsing — the most learning-oriented surface in the app — is not in the header nav or on any index page.

### Product gaps

- **The goal detail page is inverted.** The Edit-goal form sits permanently expanded above the reading list, with an unconfirmed Delete alongside it, so the rare act occupies prime position and the destructive act is one misclick. Each reading row carries eight controls. This reads as a CRUD admin screen rather than something a learner scans to decide what to read next.
- **Questions are inert.** "Questions you want to answer" is the sharpest expression of this PRD's convergence idea, but questions connect to nothing — no note references one, nothing shows which remain unanswered. Making questions first-class and linking notes to them would produce a real convergence signal ("three of your five questions are still open") without pulling in any deferred v2 machinery from §5. Requires promoting `Goal.questions` from a positional text blob to its own entity.
- **Telemetry is write-only.** ~15 `recordEvent` call sites, zero readers. The §6 primary metric is uncomputable as a result. Preferred resolution: surface activity as a *user-facing* signal ("last touched 12 days ago" on each goal, activity on goal detail) rather than a founder-only analytics page — this makes the app the thing that catches the drift §8 says has no tutor or deadline to catch it, and settles the §7 metric-definition question as a by-product.
- **`/goals` shows only a reading-item count**, which says nothing about state. A progress rollup and last-activity date are both derivable from existing data.
- **`/goals/new` offers no scaffolding.** The landing page promises to turn a vague ambition into a concrete goal; the form is three empty boxes, only one of which has a placeholder.
- **Defer vs. Delete is unexplained.** Both appear on every row with no indication that Defer means backlog (FR-62) rather than hide.

### Tracking

| Finding | Issue | Status 2026-11-07 |
|---|---|---|
| `/tags` back-link points at landing page | [#18](https://github.com/bjemason123/read2learn/issues/18) | Open; `src/app/tags/page.tsx:11` still links to `/` |
| Tags browsing unreachable from nav | [#19](https://github.com/bjemason123/read2learn/issues/19) | Open; the header links to `/goals` and `/graph` only |
| Goal detail page inverted | [#20](https://github.com/bjemason123/read2learn/issues/20) | Open; the Edit-goal form and Delete are still above the lists |
| Activity signal / write-only telemetry | [#21](https://github.com/bjemason123/read2learn/issues/21) | Open; `/goals` still shows only an item count |
| Questions first-class, notes linked to them | [#22](https://github.com/bjemason123/read2learn/issues/22) | **Closed** (2026-08-26) |
| New-goal form scaffolding | [#23](https://github.com/bjemason123/read2learn/issues/23) | Open; the form is still Title, Description and Questions |
| Defer vs. Delete unexplained | [#24](https://github.com/bjemason123/read2learn/issues/24) | Open |

Suggested order: #18 and #19 first (one is a live bug, both are minutes), then #20, then #21, then #22 after its own design pass.

### Status update, 2026-11-07

Of the seven findings, only #22 has been resolved. The other six are still open, and the code still shows each defect.

**Findings of the review that no longer apply as written:**

- "Questions are inert" — questions are now first-class and linked to notes (#22). The convergence signal ("N of M questions still open") is on the goal page. What remains thin is that "answered" is derived from any linked note and cannot be set by the learner, and questions cannot be edited or reordered.

**Defects found since the review, not tracked by a review finding:**

- `/graph` has the same wrong back-link as #18: `src/app/graph/page.tsx:17` renders "← Back to goals" pointing at `/`. No issue exists for it.
- Moving a reading item to another goal (`moveReadingItemToGoal` in `src/lib/readingItems.ts`) updates only `goalId` and `position`. It does not touch the item's notes' links to questions. A moved item's notes may stay linked to questions on the old goal. This is from reading the code; it has not been reproduced and no test was found that covers it. Verify before treating it as a bug. No issue exists for it.

**Other open issues in the tracker:** #7 (drag-and-drop reordering for notes), #9 (resolve the legacy `ReadingItem.note` field), #15 (author line wrapping), #30 (the login action's bare `catch` hides real errors behind "Invalid email or password"), #32 (the Next.js dev server blocks cross-origin access to static assets), #38 ("No available method of updating notes") and #39 (Concept Graph unreadable in dark mode). #38 may be stale: the code has an inline note editor (`note-item.tsx`). Confirm in the app and close it if so. Closed issues: #13, #22, #28 and #35.

**No tracked issue exists** for time budgets, milestones, learning outcomes, retrieval or spaced review, AI assistance, or open-format data export. Those appear only in `docs/requirements-v0.7.md`.

**Landing page.** The "Confirmed healthy" check below was made on 2026-08-25. The landing copy was re-read on 2026-11-07 and still describes only goals, attached reading, notes against a location with tags, per-item progress and the print view; it makes no claim about retrieval practice, concept mapping or corroboration. It does not mention the Concept Graph.

### Confirmed healthy

Landing page claims were checked against the implementation — every claim describes a feature that exists, and none promise the §5 deferred features (retrieval practice, concept mapping, corroboration).
