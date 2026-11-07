# Read to Learn (Reading Curator): inventory of what the product specifies and provides toward personal curriculum definition

Scope and method. All findings come from local files in `/Users/brianmason/Documents/src/ijump.co.uk/read2learn` (repo head `aeb560c`, dated 2026-08-31), plus `git log` and `gh issue list --state all`. No web research. Citation convention: `[label](repo-relative path)` followed by `:line` or section id. Every claim is tagged **[DOC]** (stated in a document) or **[CODE]** (verified by reading source at the cited lines) or **[GH]** (GitHub issue state at time of reading). Product naming: the code and PRD call it "Reading Curator" (`src/app/layout.tsx:19`, PRD title); the repo is `read2learn`.

Key shorthand: PRD = [docs/reading-curator-mvp.prd.md](docs/reading-curator-mvp.prd.md); REQ = [docs/requirements-v0.7.md](docs/requirements-v0.7.md); SPEC = [docs/superpowers/specs/2026-08-23-reading-notes-design.md](docs/superpowers/specs/2026-08-23-reading-notes-design.md); SCHEMA = [prisma/schema.prisma](prisma/schema.prisma).

---

## 0. Orientation: what the product is, and is "Goal" the closest analogue of a curriculum?

### Takeaway
There is no "curriculum", "programme" or any entity above `Goal` in either the docs or the code; the word "curriculum" appears only twice, both in a "not the target user" list. `Goal` (a title, optional description, and a list of questions, with reading items hung off it) is the closest analogue, and it is a flat container, not a structured plan.

### Cited Findings
- **[DOC]** "curriculum" appears only in the non-target-user lists: "full-time students, learners inside a formal curriculum, frontier researchers, browsers with no specific goal" — [PRD §8](docs/reading-curator-mvp.prd.md):84 and [REQ §3](docs/requirements-v0.7.md):49. A repo-wide grep for curriculum/syllabus/programme in .md/.ts/.tsx/.yaml/.json (excluding node_modules) matches only those two files, and the only hits are these lines (REQ also uses "syllabus" for external data signals at REQ:16, :244, :384-385, which is about third-party course-assignment evidence, not a learner-defined syllabus).
- **[DOC]** The PRD's own definition of the MVP: "A single learner can: create a learning goal → add one or more reading items to it (manually, by title/URL/free text) → see and update the list over multiple sessions → mark items' progress." — [PRD §9 MVP definition](docs/reading-curator-mvp.prd.md):106.
- **[DOC]** PRD §3 describes the product as letting a learner "1. State and refine a learning goal. 2. Attach reading material ... 3. Maintain a living reading list/plan tied to the goal" — [PRD §3](docs/reading-curator-mvp.prd.md):30-34. The unit of planning is "a goal-scoped reading plan".
- **[DOC]** REQ's entity list has `Learner`, `Learning Goal` ("Desired achievement with an explicit completion condition"), `Reading Item`, `Segment`, `Segment Claim`, `Backlog`, `Recall`, `Retrieval Item`, `Concept Map`, `Knowledge Artefact`, `Sub-theme`, `Grounding Reference`, `Signal` — [REQ §10](docs/requirements-v0.7.md):342-356. No entity is a collection of goals; nothing named Curriculum, Programme, Path-of-goals, Milestone, Outcome, or Schedule.
- **[DOC]** REQ's title is "Learning Path & Reading Curation Service" ([REQ](docs/requirements-v0.7.md):1), and "learning path" is implicitly the reading plan for one goal; it is described as "a sequence of reading" in the original requirement R1 ("curate a sequence of reading"), which REQ re-interprets as curation *within* sources, not across them — [REQ §16](docs/requirements-v0.7.md):449.
- **[CODE]** Data model, all models in [SCHEMA](prisma/schema.prisma): `User` (15-23), `Goal` (25-37: id, title, description?, createdAt, updatedAt, userId, readingItems[], questions[]), `Question` (39-50: text, order, goalId, notes[]), `ReadingItem` (65-82: title, author?, url?, note?, type, progress, deferred, position, goalId, notes[]), `Note` (84-97: body, location?, order, readingItemId, tags[], questions[]), `Tag` (99-108: name, userId, unique per user), `Event` (110-117). There are no models for outcome, milestone, module, schedule, resource-estimate, review, or a parent of Goal.
- **[CODE]** Goal has no status/lifecycle field (no active/completed/archived), no completion condition, no deadline, no time budget, no priority — SCHEMA:25-37.
- **[CODE]** Route map as built (from file tree under `src/app`): `/` landing (`src/app/page.tsx`), `/goals` dashboard, `/goals/new`, `/goals/[id]`, `/goals/[id]/print`, `/goals/[id]/items/[itemId]`, `/goals/[id]/items/[itemId]/edit`, `/tags`, `/tags/[name]`, `/graph`, `/login`, `/signup`, logout action. No API routes (`find src -name route.ts` returns nothing).

### Inferences
- Treat `Goal` as "single-goal reading plan with questions"; every curriculum dimension that needs structure above or inside Goal (modules, outcomes, milestones, sequencing between goals) has no home in either the spec or the schema.
- The two docs frame the learner's plan as a per-goal reading plan, never as a multi-goal programme; "curriculum" is conceptually adjacent to "formal curriculum" which the product explicitly says it is not for.

### Gaps
- No user research beyond the founder: "No direct user interviews or market data" and "Gap: TBD" — [PRD §2](docs/reading-curator-mvp.prd.md):25-26. So there is no documented evidence of whether learners want a curriculum-level construct.

---

## 1. Goal framing and completion condition

### Takeaway
The long-term spec (REQ) requires interrogated, testable goals with a recorded completion condition, time budget and deadline (FR-1 to FR-6, FR-38, FR-39). The built product has only a free-text title and description, no interrogation, no completion condition, and an unscaffolded form (issue #23 open).

### Cited Findings
- **[DOC]** PRD problem: learners fail to "turn a vague ambition ('learn X') into a concrete learning goal" — [PRD §1](docs/reading-curator-mvp.prd.md):10-12. PRD must-have: "Learner can state/create a learning goal" (FR-1) — [PRD §9 MoSCoW](docs/reading-curator-mvp.prd.md):94; should-have "Ability to revise/edit a goal without losing attached material" (FR-6) — :99.
- **[DOC]** REQ FR-1: "A learner can state a learning goal in their own words, however vague." FR-2: "The service interrogates the goal until it is specific enough to plan against." FR-3: "Goal framing captures subject scope, **time budget per week and total**, any deadline, and purpose." FR-4: "The service records what 'achieved' looks like in terms the learner recognises." FR-6: "A goal can be revised at any point; the service reconciles existing work rather than discarding progress." FR-38: prior knowledge assessed at intake. FR-39: "Goal framing favours mastery framing and specific sub-goals." — [REQ §9.1](docs/requirements-v0.7.md):187-197.
- **[DOC]** REQ G1: "Convert a loose ambition into a specific, testable goal calibrated to prior knowledge and time" — [REQ §8](docs/requirements-v0.7.md):159. REQ core loop stage 1 "Frame": "Goal interrogated into something specific and testable; prior knowledge and time budget established" — :75. FR-112 says a completed artefact must contain "the interrogated goal and its completion condition" — :309.
- **[DOC]** PRD §5 does not list goal interrogation/completion condition as deferred explicitly; FR-2, FR-3, FR-4, FR-38, FR-39 are neither in the MoSCoW table nor in §5 (only FR-1 and FR-6 are mapped). They are implicitly outside the MVP (PRD §9: "Everything else in requirements-v0.7.md is explicitly future work" — :106).
- **[CODE]** Goal creation form has three fields: Title (required), Description, "Questions you want to answer" (placeholder "One question per line") — [src/app/goals/new/page.tsx](src/app/goals/new/page.tsx):9-25. Title and Description have no placeholders or helper text.
- **[CODE]** `createGoal` validates only that the title is non-empty — [src/lib/goals.ts](src/lib/goals.ts):43-45. `updateGoal` edits only title and description (`goals.ts:63-78`, `src/app/goals/actions.ts:29-43`).
- **[CODE]** Goal detail page has a permanently expanded "Edit goal" form (title, description) plus an unconfirmed "Delete goal" button above the question and reading lists — [src/app/goals/[id]/page.tsx](src/app/goals/[id]/page.tsx):62-91.
- **[CODE]** Landing page copy promises "Reading Curator turns a vague ambition into a concrete learning goal" — [src/app/page.tsx](src/app/page.tsx):9-11, and "Set a learning goal: Write down what you want to learn, why it matters, and the questions you want answered." :36-40. The only mechanism that delivers this is the blank form.
- **[GH]** #23 "Add scaffolding to the new-goal form" is **OPEN**: "the landing page promises to turn 'a vague ambition into a concrete learning goal', but `/goals/new` is three empty boxes ... Suggested fix: worked-example placeholders on Title and Description, and short helper text framing what a good goal looks like. Low cost, no schema change." Source PRD §13.
- **[DOC]** PRD §13 matches: "`/goals/new` offers no scaffolding. The landing page promises to turn a vague ambition into a concrete goal; the form is three empty boxes, only one of which has a placeholder." — [PRD §13](docs/reading-curator-mvp.prd.md):171.

### Inferences
- The gap between REQ FR-2/3/4 and the product is total: no deadline, no purpose, no "what achieved looks like" field, no prior-knowledge capture. The nearest free-text vessel is `Goal.description`; whether a learner writes a completion condition there is unguided.
- Goal edit (FR-6) is implemented in the narrow sense (title/description editable; reading items and questions survive edits, since they are separate relations).

### Gaps
- There is no spec text about what form the "interrogation" should take in the MVP (e.g. a fixed set of prompts vs. AI dialogue). Not found in PRD or REQ.

---

## 2. Learning outcomes / objectives

### Takeaway
Neither the PRD nor the code has a notion of learning outcomes or objectives as a separate construct. REQ has the nearest ideas: the goal's "completion condition" (FR-4), "mastery framing and specific sub-goals" (FR-39) and sub-goals/sub-themes (FR-54). None are built.

### Cited Findings
- **[DOC]** A grep of PRD/REQ/SPEC for "outcome" yields only: PRD §6 "Explicitly *not* a v1 metric: learning-outcome measurement" ([PRD](docs/reading-curator-mvp.prd.md):64) and "any claim of measured learning-outcome improvement" as a REQ non-goal ([REQ §8](docs/requirements-v0.7.md):178). Those concern measuring outcomes of the product, not learner-defined outcomes.
- **[DOC]** FR-4 ("what 'achieved' looks like"), FR-39 ("mastery framing and specific sub-goals"), FR-46 ("Where the goal cannot be met within the time budget, the service says so and offers a narrowed goal") — [REQ](docs/requirements-v0.7.md):193, :196, :265. G4 "Give the learner evidence of progress, not a feeling of it" — :162.
- **[DOC]** REQ explicitly says assessment would "test understanding against the goal" (FR-31) and "distinguishes recall from comprehension and application" (FR-34) — [REQ](docs/requirements-v0.7.md):285, :291; these imply levels of objective, but no taxonomy of objectives is specified.
- **[CODE]** No field in SCHEMA:25-117 represents an outcome or objective. The closest slot is free-text `Goal.description` (SCHEMA:28), and `Question.text` (SCHEMA:41).

### Inferences
- A learner today can only express outcomes as prose in `description` or as questions. Nothing distinguishes an outcome from a description in the UI or data.

### Gaps
- Neither document defines "learning outcome" or links goals to testable outcome statements beyond FR-4's one-line completion condition.

---

## 3. Questions

### Takeaway
Questions are the most developed "scoping" device in the shipped app: a first-class `Question` entity per goal, with notes linked to questions and a derived "answered/unanswered" state and "N of M still open" summary. This closed the post-MVP gap (#22). The PRD text still describes questions as a text blob.

### Cited Findings
- **[CODE]** `Question` model: id, text, order, goalId (cascade), `notes Note[]` — [SCHEMA](prisma/schema.prisma):39-50; `Note.questions Question[]` — :94. Migration `20260825193422_add_questions_table` and git commits `d20c485` "wip: promote questions to first-class model and link notes (#22)" and `307b48e` "test: cover first-class questions and note links".
- **[CODE]** Create at goal creation via newline-delimited textarea (`parseQuestions`, [src/lib/goals.ts](src/lib/goals.ts):102-110; `createGoal` creates `Question` rows with `order`, :56-58). Add later via `createQuestion` ([src/lib/questions.ts](src/lib/questions.ts):19-42) and the "Add a question" form ([src/app/goals/[id]/page.tsx](src/app/goals/[id]/page.tsx):137-143). Delete via `deleteQuestion` (questions.ts:51-55). There is **no edit/rename question** function in `src/lib/questions.ts` or `src/app/goals/actions.ts`, and no reorder.
- **[CODE]** Goal page shows a summary: `${unansweredCount} of ${questions.length} question(s) still open.` or `All N question(s) answered.` ([page.tsx](src/app/goals/[id]/page.tsx):51-53, :100-104), each question with an "Unanswered" badge or links "note in <item title>" to the item's notes page (:107-123).
- **[CODE]** "Answered" is purely derived: `question.notes.length === 0` (page.tsx:51-53). The learner cannot mark a question answered/resolved on its own terms, and a linked note of any quality counts.
- **[CODE]** Notes link to questions with checkboxes "Answers which question(s)?" in the add form ([add-note-form.tsx](src/app/goals/[id]/items/[itemId]/add-note-form.tsx):69-79) and edit form ([note-item.tsx](src/app/goals/[id]/items/[itemId]/note-item.tsx):97-114); `syncNoteQuestions` ignores question ids not owned by the user ([questions.ts](src/lib/questions.ts):57-84).
- **[CODE]** Print view lists the goal's questions as a plain list without answered state, and under each note lists the questions it answers — [src/app/goals/[id]/print/page.tsx](src/app/goals/[id]/print/page.tsx):31-40, :74-80.
- **[CODE]** Concept graph does **not** include questions as nodes — [src/lib/graph.ts](src/lib/graph.ts):6-8 (node kinds are only `tag` and `goal`).
- **[DOC]** PRD §13 diagnosis (pre-fix): "Questions are inert. 'Questions you want to answer' is the sharpest expression of this PRD's convergence idea ... Making questions first-class and linking notes to them would produce a real convergence signal ('three of your five questions are still open') without pulling in any deferred v2 machinery from §5." — [PRD](docs/reading-curator-mvp.prd.md):168.
- **[GH]** #22 "Make questions first-class and link notes to them" — **CLOSED** (updated 2026-08-26). The issue body's own wording: "you have read six items and three of your five questions are still open".
- **[DOC, stale]** PRD §10 still says `Goal` has "optional `questions` (newline-delimited text, not a relation)" — [PRD](docs/reading-curator-mvp.prd.md):122; and §7 still lists questions-as-entities as "Still open" — :77.
- **[DOC]** REQ has no "questions the learner wants answered" concept as a goal-framing element; REQ's "questions" are assessment/retrieval questions (FR-31, FR-74-84, FR-104). Learner-authored research questions are an MVP addition. (REQ FR-58 "capture emergent sub-themes and notes against a segment, item, sub-goal or goal" is the nearest.)

### Inferences
- The question set functions in the product as a de facto "learning objectives list", the only structured goal-definition artefact beyond title/description. It is flat (no ordering semantics beyond `order`, no grouping, no sub-questions, no link to reading items directly; linkage is via notes only).
- A question can only become "answered" after the learner has attached at least one reading item and written a note linked to it; there is no way to link a reading item (as a planned resource) to a question before reading.

### Gaps
- No edit/reorder of questions; no per-question state independent of notes. (Verified by absence in `questions.ts`, `goals/actions.ts`.)

---

## 4. Sub-goals, modules, milestones

### Takeaway
Not present in code or MVP PRD. REQ includes sub-goals (FR-54), chunking with "intermediate milestones" (FR-29) and sub-themes (FR-58, Sub-theme entity), all outside MVP. The only grouping inside a goal is the reading-item list state (active/deferred/progress) and per-item note "locations".

### Cited Findings
- **[DOC]** FR-54: "A learner can define sub-goals or sub-themes beneath a goal. `[R7]`" — [REQ](docs/requirements-v0.7.md):197. FR-29: "The service can decompose a goal into smaller chunks with intermediate milestones. `[R9]`" — :325 (in §9.10 Diagnosis & Adaptation, v1 only as "manual stuck-request and chunking (FR-28, FR-29)" at :433). FR-44: "Each segment is sized to a single realistic session; the plan shows elapsed-time-to-goal against the budget." — :264. Entity "Sub-theme: A strand beneath a goal, learner-captured or service-suggested" — :354. FR-24 "Adjacent themes can be surfaced as candidate future goals" — :336.
- **[DOC]** PRD §5: "Themes / concept surfacing across notes — deferred" ([PRD](docs/reading-curator-mvp.prd.md):56). FR-54 is not in the PRD's MoSCoW table; FR-29 is not mentioned in the PRD.
- **[CODE]** No `SubGoal`, `Module`, `Milestone`, `Phase` model in [SCHEMA](prisma/schema.prisma). Goals cannot nest (Goal has no `parentId`). Reading items belong to exactly one goal (`goalId`, SCHEMA:77).
- **[CODE]** The only sub-structure: `Note.location` is free text within one reading item ("Chapter 3", "§2.1 Methods"); placeholder driven by item type via `locationLabelFor` ([src/lib/locationLabel.ts](src/lib/locationLabel.ts):6-18). SPEC: "`location` is free text and nullable. Rigid chapter numbering breaks on prefaces, appendices, and a paper's abstract." — [SPEC](docs/superpowers/specs/2026-08-23-reading-notes-design.md):82-83. There is no segment entity for planning which chapters to read (REQ Segment, FR-91 to FR-100, deferred).

### Inferences
- A learner wanting modules (e.g. "Week 1: foundations") can only simulate them by creating separate goals or by using tags/notes; there is no ordering or grouping above a goal and nothing connects goals to each other (except sharing tags in the graph).

### Gaps
- Not found: any PRD discussion of how multiple goals should relate.

---

## 5. Resources / reading items and discovery

### Takeaway
Manual entry of reading items (title/author/URL/type/free note) is built; verification, discovery, recommendation, time and cost estimates, prior-knowledge assumptions, access routes, and segment-level selection are all specified in REQ but not built, and the PRD marks service-suggested reading as a deferred "Could".

### Cited Findings
- **[CODE]** Reading item fields: title, author?, url?, note? (legacy), type (BOOK/PAPER/ARTICLE/OTHER), progress, deferred, position — [SCHEMA](prisma/schema.prisma):65-82. Create form: title, author, URL, type, note — [src/app/goals/[id]/page.tsx](src/app/goals/[id]/page.tsx):279-310. Edit page (title, author, URL, type; no legacy note field) — [edit/page.tsx](src/app/goals/[id]/items/[itemId]/edit/page.tsx):27-64.
- **[CODE]** URL links guarded to safe schemes (commit `a738591` "guard reading item links to safe schemes"; component [item-title.tsx](src/app/goals/[id]/item-title.tsx)).
- **[CODE]** No estimated reading time, cost, access route, edition, identifier (ISBN/DOI), relevance rationale or "assumed prior knowledge" fields exist (compare REQ FR-10, FR-68, FR-93) — SCHEMA:65-82.
- **[CODE]** Move item between goals: `moveReadingItemToGoal` appends to the destination goal's list — [src/lib/readingItems.ts](src/lib/readingItems.ts):130-156; UI dropdown "Move to…" [goal-select.tsx](src/app/goals/[id]/goal-select.tsx):39-45 shown only if the user has other goals (:17-19). Commit `25ce255` "Add ability to move reading items between goals".
- **[CODE, inferred risk]** `moveReadingItemToGoal` updates only `goalId`/`position` (readingItems.ts:152-155); it does not touch note-to-question links. A note on the moved item can stay linked to a question that belongs to the *old* goal. The old goal's page builds the link `/goals/${goal.id}/items/${note.readingItem.id}` (page.tsx:115-117) while the item page 404s when `item.goalId !== id` (items/[itemId]/page.tsx:16-18). This is a reading of the code, not a run test; no test found covering it.
- **[DOC]** PRD MoSCoW: "Could — Service-suggested reading material (research/recommend) — FR-7 — explicitly deferred-leaning; ... pulls in verification complexity (FR-8, FR-40)" — [PRD](docs/reading-curator-mvp.prd.md):100. Phase 4 "(Optional, Could-have) Service-suggested material — Not started — Still deferred pending usage data" — :138.
- **[DOC]** PRD §7: "Data model for reading material: ... Resolved: free text/links. ... No verification (FR-8, FR-40) was implemented." — :71.
- **[DOC]** REQ discovery requirements: FR-7 (research and propose science reading), FR-8 ("Critical. Every recommended item must be resolved and verified ... Unverifiable items are discarded, not caveated."), FR-9 rationale, FR-10 ("estimated reading time, assumed prior knowledge, and access route and cost"), FR-11 (accept/reject/replace), FR-41/42 accessibility and open-access surfacing, FR-43 decline to recommend — [REQ §9.2](docs/requirements-v0.7.md):203-211. Capture: FR-12, FR-55 (add by identifier, citation, title, URL or free text), FR-56/57 forward-reference capture into a backlog — :217-221. Triage: FR-45 "minimum sufficient set", FR-59, FR-60, FR-90 "collector's fallacy" guard — :230-233.
- **[DOC]** REQ stage 4 "Locate" and §9.5 Segment Identification (FR-91 to FR-100) describe which chapters/sections of each source serve the goal: "Stage 4 is the differentiator." — [REQ](docs/requirements-v0.7.md):78, :84, :239-250. PRD §5: segment identification "the core differentiator of the full spec, but not needed to test the MVP hypothesis" — [PRD](docs/reading-curator-mvp.prd.md):51.
- **[DOC]** REQ §4 and §8 non-goals: subject scope is science only; "Subjects outside science"; courses/video/podcasts not first-class types; no hosting content — [REQ](docs/requirements-v0.7.md):53-55, :173-176. PRD §5: "non-science subjects, hosting or serving content — out of scope" — [PRD](docs/reading-curator-mvp.prd.md):57. Note the code does **not** enforce science scope (FR-35/36 not built); any subject can be entered.
- **[CODE]** Defer/restore: `deferReadingItem`/`restoreReadingItem` ([readingItems.ts](src/lib/readingItems.ts):67-83); deferred items are separated into a "Deferred" section on goal page ([page.tsx](src/app/goals/[id]/page.tsx):210-277) and a "Deferred" group in print (goals.ts:112-117). PRD calls this the FR-62 Could-have, shipped ([PRD](docs/reading-curator-mvp.prd.md):101, :140). It is the closest analogue of REQ's backlog/triage but has no time-cost view (FR-60).
- **[GH]** #24 "Explain the difference between Defer and Delete on reading items" — **OPEN**. PRD §13: "Defer vs. Delete is unexplained. Both appear on every row with no indication that Defer means backlog (FR-62) rather than hide." — [PRD](docs/reading-curator-mvp.prd.md):172.
- **[CODE/GH]** Legacy `ReadingItem.note` free-text field remains in schema (SCHEMA:70), create form (page.tsx:303-306) and display (page.tsx:204, :272); issue #9 "Resolve legacy ReadingItem.note field" is **OPEN**; SPEC:248-250 says "two note-shaped places exist".

### Inferences
- Resource curation by the learner (adding and ordering items, deferring some) is built; resource curation *for* the learner (discovery, verification, sufficiency) is wholly unbuilt, and per PRD §5/§9 deliberately deferred until usage data exists.
- The code does not distinguish "planned reading" from "read": the same ReadingItem accumulates notes; the progress enum is the only state.

### Gaps
- No documented plan for how learners find resources in the MVP beyond their own knowledge; no in-app search/import.

---

## 6. Sequencing and prerequisites

### Takeaway
Manual ordering of reading items within a goal (up/down buttons) is built and is the only sequencing mechanism. The PRD says the MVP list is "unordered/learner-free-form" (stale: ordering shipped). Suggested order, dependency/prerequisite warnings, and any prerequisite modelling are deferred in the PRD and absent from the code. REQ makes sequencing explicitly learner-owned: it forbids the service from imposing a sequence.

### Cited Findings
- **[CODE]** `ReadingItem.position Int` with index `@@index([goalId, position])` — [SCHEMA](prisma/schema.prisma):74, 81. New items append at max+1 ([readingItems.ts](src/lib/readingItems.ts):35-39). Up/down swap with the neighbour in the same deferred partition ([readingItems.ts](src/lib/readingItems.ts):85-128); buttons `↑`/`↓` disabled at list ends ([page.tsx](src/app/goals/[id]/page.tsx):171-189). Commit `e4b2188` "feat: add manual reordering of reading items within a goal". No drag-and-drop for items (the open #7 concerns drag-and-drop for *notes*).
- **[CODE]** No prerequisite/dependency field or relation between reading items, goals, questions, or tags in SCHEMA. No "next action" computation: goal page lists active items in `position` order and does not highlight a next item ([page.tsx](src/app/goals/[id]/page.tsx):146-208).
- **[DOC]** PRD §5: "Learner-led sequencing support (suggested order, dependency warnings at ordering time) — deferred; MVP reading list is unordered/learner-free-form." — [PRD](docs/reading-curator-mvp.prd.md):54. PRD §9 MoSCoW "Won't (this MVP): ... sequencing suggestions" — :102. PRD's "Also shipped beyond the original phase plan" lists "manual reordering" — :140 (so :54 is stale relative to :140).
- **[DOC]** REQ Non-goal: "Imposing a reading sequence. The learner orders their own reading." — [REQ §8](docs/requirements-v0.7.md):171. FR-13 (Amended): "The learner determines the order of their own reading. The service does not impose or auto-apply a sequence." FR-101: "must offer a suggested default order on request, with its reasoning and confidence shown." FR-102: dependency warnings "must surface at the point of ordering". FR-15: "The learner reorders freely; the service flags — never blocks — apparent dependency breaks." — [REQ §9.6](docs/requirements-v0.7.md):254-265. FR-96: "dependency warnings where a recommended segment appears to assume earlier material. Omitting a prerequisite is the most damaging failure this feature can produce." — :246. FR-52: identify "the upstream cause — the missing prerequisite" on struggle — :321.
- **[DOC]** REQ rationale: "the evidence says self-directed learners plan and sequence *poorly*, so this is a hand-off of **control, not of cognitive load**" — [REQ §1](docs/requirements-v0.7.md):14. Risk 6: "That learner-led sequencing works with light scaffolding" — :423. Measurement: "Outcomes for learners who take the suggested order versus those who don't" — :412.
- **[DOC]** FR-101/102 are in REQ's v1 phase ([REQ §15](docs/requirements-v0.7.md):433), but the PRD defers them.

### Inferences
- The product's design stance is "learner decides order; service supports with warnings", the opposite of an auto-generated curriculum sequence. Any curriculum tool that sequences automatically would conflict with REQ's FR-13 and non-goal at :171 (an amended v0.3-v0.6 position; REQ §1 explains the change).
- Ordering exists only inside one goal; there is no ordering of goals.

### Gaps
- No spec text on how prerequisites would be represented (item-to-item vs segment-to-segment vs concept-to-concept).

---

## 7. Time budgeting and scheduling

### Takeaway
Time is a first-class concern in REQ (budget per week and total, deadline, reading-time estimates, elapsed-time-to-goal, backlog time cost, session sizing) but there is zero time modelling in the code or MVP PRD: no deadline, no weekly budget, no estimates, no calendar or reminder.

### Cited Findings
- **[DOC]** REQ persona: "An adult improver with five or six hours a week"; sessions "20–40 minutes, often days apart" — [REQ §2](docs/requirements-v0.7.md):25, [§3](docs/requirements-v0.7.md):43. Principle 9 "Respect the hour." — :96. G8 "Fit fragmented, unpredictable adult time" — :166.
- **[DOC]** FR-3 "time budget per week and total, any deadline"; FR-10 "estimated reading time"; FR-44 "Each segment is sized to a single realistic session; the plan shows elapsed-time-to-goal against the budget."; FR-46 "Where the goal cannot be met within the time budget, the service says so and offers a narrowed goal."; FR-60 "shows the time cost of the backlog against the declared budget"; FR-47 "Short sessions are the design default"; FR-19 "single next action is unambiguous and reachable in under a minute after days away"; NFR "Time-to-resume" — [REQ](docs/requirements-v0.7.md):193, :209, :264-265, :230, :274-275, :365. Learner entity: "Prior knowledge, time budget, access rights, preferences" — :344.
- **[DOC]** PRD mentions time-poor users ([PRD §1, §8](docs/reading-curator-mvp.prd.md):17, :82) but no time-budget feature; none of FR-3 (time part), FR-10, FR-44, FR-46, FR-60, FR-19 appears in the MoSCoW table (PRD:92-102).
- **[CODE]** No time-related field other than `createdAt`/`updatedAt` timestamps in [SCHEMA](prisma/schema.prisma). No reminder, notification or schedule code (grep for deadline/due/schedul/budget/minutes in `src` yields only unrelated matches). No "next action" view.
- **[CODE]** `/goals` shows only the reading-item count per goal ([src/app/goals/page.tsx](src/app/goals/page.tsx):26-30), no last-touched date, no progress rollup.
- **[GH]** #21 "Surface goal activity: last-touched date and progress rollup" — **OPEN**: "'Last touched N days ago' on each goal card in `/goals`, derived from `Event`. Progress rollup ('2 of 5 done') ... Optionally a small activity strip on goal detail." This is time-adjacent (recency), not time-budget.

### Inferences
- Time budgeting is an unbuilt dimension both in code and in the PRD scope. In REQ it is tightly coupled to reading-time estimates for resources (which require metadata/verification that are not built).

### Gaps
- No spec on timezone, calendar integration, reminders or notification channel in either doc.

---

## 8. Progress tracking

### Takeaway
Per-item progress (NOT_STARTED/IN_PROGRESS/DONE) plus deferral is built; there is no per-goal rollup yet (#21 open), no segment-level progress, no "abandoned" state, and no outcome-based or retrieval-based evidence of progress. The only convergence signal built is "N of M questions still open" from linking notes to questions.

### Cited Findings
- **[CODE]** `enum Progress { NOT_STARTED IN_PROGRESS DONE }` — [SCHEMA](prisma/schema.prisma):52-56; changed via a select ([progress-select.tsx](src/app/goals/[id]/progress-select.tsx)) and `updateReadingItemProgress` ([readingItems.ts](src/lib/readingItems.ts):54-65). Deferral is a separate boolean (SCHEMA:73).
- **[CODE]** Goal list shows only count of reading items — [goals/page.tsx](src/app/goals/page.tsx):26-30. Goal detail shows item list with progress control, no rollup — [page.tsx](src/app/goals/[id]/page.tsx):161-165. Question rollup exists (page.tsx:100-104).
- **[CODE]** Print view groups items by NOT_STARTED / IN_PROGRESS / DONE / DEFERRED with labels ([goals.ts](src/lib/goals.ts):112-160).
- **[CODE]** `Event` model (SCHEMA:110-117: type, goalId?, readingItemId?, userId?, createdAt) is written by `recordEvent` ([events.ts](src/lib/events.ts):3-17) at every mutation plus `goal_viewed` ([page.tsx](src/app/goals/[id]/page.tsx):35) and `graph_viewed` ([graph/page.tsx](src/app/graph/page.tsx):13). A grep for `prisma.event.(find|count|aggregate|groupBy)` outside tests returns only `events.ts:9` (a create). Telemetry remains **write-only** as of head.
- **[DOC]** PRD Should: "Basic progress marking per reading item (not started / in progress / done) — Adjacent to FR-18" — [PRD](docs/reading-curator-mvp.prd.md):98; shipped (Phase 2 Done, :136). REQ FR-18 specifies "not started, in progress, completed, abandoned" per **segment** — [REQ](docs/requirements-v0.7.md):272 (no "abandoned" in code).
- **[DOC]** PRD primary metric: "frequency of visits to, and updates made to, the learning plan / reading list per active learner" — [PRD §6](docs/reading-curator-mvp.prd.md):62; Phase 3 "Partial ... Write-only — nothing reads the table, so the primary metric (§6) is still uncomputed" — :137. §13: "Telemetry is write-only. ~15 `recordEvent` call sites, zero readers." and the preferred fix is a user-facing activity signal "(last touched 12 days ago)" — :169. [GH] #21 OPEN.
- **[DOC]** REQ G4 "Give the learner evidence of progress, not a feeling of it" — [REQ](docs/requirements-v0.7.md):162; principle 8 "Trust performance over feeling" — :95; FR-50/51 on confidence vs retrieval gap — :294-295; FR-26 signals in order of reliability (retrieval performance, decay, stalling, repeated revisits, abandonment, self-report) — :319. FR-90 collector's-fallacy guard: "Capture volume without corresponding retrieval activity should be surfaced to the learner, not rewarded." — :233.

### Inferences
- Current "progress" is self-reported reading status, which REQ explicitly treats as the least reliable evidence ("Trust performance over feeling"); the PRD §6 explicitly excludes learning-outcome measurement from v1.
- Question coverage ("answered") is the closest thing to goal-level progress, but it measures note-linking, not understanding.

### Gaps
- No spec for what "done" means for a goal (goal completion) in either document beyond FR-4/FR-106 ("reaches a finished state").

---

## 9. Retrieval practice and spaced review

### Takeaway
REQ calls retrieval and spacing "the spine" of the long-term product; the PRD and code deliberately omit them. There is no recall prompt, no scheduling and no review mode; the notes spec explicitly excludes spaced repetition. Notes are free-form capture, not learner-authored retrieval items.

### Cited Findings
- **[DOC]** REQ: "Stage 6 is the spine" ([REQ](docs/requirements-v0.7.md):84); FR-20 "After a segment, the learner is prompted to recall and explain it from memory before reviewing the source."; FR-103 "The recall is the note ... There must be no separate note-capture workflow competing for the learner's hours."; FR-49 "Previously covered material resurfaces on a spaced schedule."; FR-104 retrieval items "authored by the learner"; FR-105 "Passive resurfacing of saved highlights ... must not be presented as review." — [REQ §9.8](docs/requirements-v0.7.md):278-295. Evidence base: Karpicke & Blunt 2011 — [REQ](docs/requirements-v0.7.md):19.
- **[DOC]** PRD §5: "Retrieval practice / recall-as-note / spaced review (§9.8 of the full spec) — the 'spine' of the full product, deferred." — [PRD](docs/reading-curator-mvp.prd.md):53. MoSCoW "Won't ... retrieval practice" — :102.
- **[DOC]** SPEC non-goals: "Full-text note search. Tags are the only recall mechanism in this version. Any spaced-repetition or flashcard-style review mode." — [SPEC](docs/superpowers/specs/2026-08-23-reading-notes-design.md):32-33.
- **[DOC]** Tension between REQ FR-103 ("no separate note-capture workflow") and the built per-location notes with tags: SPEC Problem: "Notes are also currently unreviewable — there is no way to look back over what was captured" — [SPEC](docs/superpowers/specs/2026-08-23-reading-notes-design.md):13-14. The built notes are free-form capture by design; they are not recall prompts. REQ's evidence section says "summarising, highlighting and rereading are low-utility" — [REQ §12](docs/requirements-v0.7.md):390.
- **[CODE]** Notes: `Note.body` required free text, optional location, tags, linked questions ([SCHEMA](prisma/schema.prisma):84-97; [notes.ts](src/lib/notes.ts):21-65). No due-date, interval, ease, last-reviewed or rating fields exist anywhere in SCHEMA. Note body is not hidden/cloze'd anywhere.
- **[CODE]** Review surfaces for notes are passive: per-item grouped by location ([notes-panel.tsx](src/app/goals/[id]/items/[itemId]/notes-panel.tsx):21-58), per-tag across items ([tags/[name]/page.tsx](src/app/tags/[name]/page.tsx)), print view ([print/page.tsx](src/app/goals/[id]/print/page.tsx):57-84). Under REQ FR-105 these count as re-exposure, not review.
- **[CODE]** Linking a note to a question (checkbox "Answers which question(s)?") is a form of self-asserted answering, not a test; nothing hides the note from the question or asks the learner to recall before looking.
- **[GH]** #7 (drag-and-drop note reordering) and #38 "No available method of updating notes" (body empty) are **OPEN**. #38 may be stale: the code does have an inline "Edit" button and `updateNoteAction` (note-item.tsx:147-149, :57-127; notes/actions.ts imports `updateNote`, line 4).

### Inferences
- A curriculum with retrieval or spacing components has no data hooks in the current model; adding it would need new entities (REQ names `Recall` and `Retrieval Item`, REQ:350-351).
- The PRD's "Confirmed healthy" claim that "none [of the landing page claims] promise the §5 deferred features (retrieval practice, concept mapping, corroboration)" ([PRD](docs/reading-curator-mvp.prd.md):190) was written before the graph shipped; "Concept graph" now appears in the nav (see §11).

### Gaps
- No document states when or how spaced review would be scheduled for a goal that is still in progress vs. completed (REQ FR-114 refresh mode is "Later phase", REQ:311).

---

## 10. Reflection and adaptation

### Takeaway
No reflection prompts, retrospective, stuck-declaration, re-scoping or adaptation exist in code. REQ specifies a detailed adaptation loop (struggle detection from retrieval performance, learner "stuck" declaration, proposals only) and PRD defers it all. The only reflective-ish capabilities are free-form notes, question linkage, editing a goal, deferring and moving items.

### Cited Findings
- **[DOC]** REQ §9.10: FR-25 (struggle identified primarily from measured retrieval performance), FR-27 (substitute source, revise segment claims, propose prerequisite material, promote from backlog), FR-28 "The learner can declare they are stuck without waiting for detection.", FR-29 chunking, FR-30 "All adaptations are proposals; the learner retains final control.", FR-33 results drive re-scoping, FR-53 "Support fades as competence grows" — [REQ](docs/requirements-v0.7.md):316-328. Stage 8 "Adapt" — :82. Risk 7 and G5 "Detect struggle and change the plan rather than demand more willpower" — :163.
- **[DOC]** FR-28 and FR-29 are placed in REQ v1 ("manual stuck-request and chunking") — [REQ §15](docs/requirements-v0.7.md):433; PRD §5: "Diagnosis & adaptation (struggle detection, re-scoping) — deferred." — [PRD](docs/reading-curator-mvp.prd.md):55.
- **[CODE]** No stuck/blocked state, reflection field, retrospective prompt, or goal-level review: absent from SCHEMA and routes. Adaptation tools that do exist are manual and self-directed: edit goal (title/description), add/delete questions, defer/restore items, reorder, move items to another goal, delete.
- **[CODE]** Activity events could in principle drive adaptation prompts but nothing reads them (see §8).
- **[DOC]** PRD key hypothesis is behavioural and tests "return and actively maintain that plan" — [PRD §4](docs/reading-curator-mvp.prd.md):40-44. PRD §13 headline: "the MVP loop works, but nothing in the app reflects the product's thesis back at the user ... The app stores the plan; it never signals whether the plan is alive." — :158.

### Inferences
- Reflection/adaptation is currently entirely learner-driven and unprompted; the product has no feedback mechanism to the learner other than the open-questions count.

### Gaps
- Not found: a PRD statement on whether "reflection" prompts (as opposed to retrieval-based diagnosis) are in or out of scope.

---

## 11. Concept mapping (including the new Concept Graph)

### Takeaway
A Concept Graph at `/graph` shipped 2026-08-31 (commit `23039f1`, merged as PR #37). It is a read-time derived, auto-generated SVG diagram of the user's tags (outer ring) and the goals whose notes carry those tags (inner ring), with tag-to-tag co-occurrence edges and goal-to-tag edges. It is not a learner-constructed concept map and is not mentioned anywhere in the PRD; PRD §5 and REQ both describe concept mapping as a deferred v2 artefact that the learner must construct.

### Cited Findings
- **[CODE]** What it shows. `getConceptGraph(userId)` ([src/lib/graph.ts](src/lib/graph.ts):32-113): loads all of the user's tags with their notes and each note's goal (:33-46). Nodes: one `tag` node per tag with `label` and `noteCount` (:48-53); one `goal` node per goal that is reached through at least one tagged note (:94-101; goal titles are collected only inside the tag/note loop, :64-74). Edges: `tag-tag` for each unordered pair of distinct tags sharing a note, deduped (:78-92); `goal-tag` for each (goal, tag) pair via any note (:60-62, :103-110). Types: [graph.ts](src/lib/graph.ts):6-19.
- **[CODE]** What it omits: goals with no tagged notes never appear (nodes come only from tags' notes; graph.ts:64-74, :94-101); reading items, notes, and questions are not nodes; edges are unlabeled and unweighted (the `noteCount` is carried on tag nodes but the renderer does not use it for size, concept-graph.tsx:102-107); no edge type for prerequisite, "is-a", "causes" etc.; learners cannot add, drag, label or link nodes (read-only view, no actions in `src/app/graph`).
- **[CODE]** Rendering: client component `ConceptGraphView` draws a dependency-free SVG, deterministic layout with goals on an inner ellipse (radii 130x100) and tags on an outer ellipse (320x250), 800x600 viewBox ([concept-graph.tsx](src/app/graph/concept-graph.tsx):7-35, :44-57, :69-122). Goal nodes purple 10px radius, tag nodes blue 6px; edge colours hard-coded `#c7b8f0` and `#cfcfcf` (:88, :106). Each node is a `Link`: tag to `/tags/<name>`, goal to `/goals/<id>` (:37-41, :100). Empty state: "No concepts to map yet. Tag some notes and their connections will appear here." (:59-66). With one goal, that goal sits at centre (:27).
- **[CODE]** Page: `/graph` requires login, intro text "Tags you've used are shown as connected concepts — two tags link up when they share a note, and each goal links to the tags its notes use. Click a tag or goal to drill in.", records `graph_viewed` event with a comment "Recurring-reference view (~every second session) ... to confirm the stated usage cadence" ([graph/page.tsx](src/app/graph/page.tsx):7-25). Its back link is `← Back to goals` pointing to `/` (:17), the landing page, the same defect the PRD flagged for `/tags` (#18). Nav link "Concept graph" added in the header ([layout.tsx](src/app/layout.tsx):39).
- **[CODE]** Tests: `src/lib/graph.test.ts` (147 lines), `src/app/graph/page.test.tsx`, `concept-graph.test.tsx` (from `git show --stat 23039f1`). Commit message: "No new tables or graph database — structure is computed at read time from existing relations"; "Rendered with a dependency-free SVG diagram rather than a third-party force-directed library".
- **[GH]** #39 "Concept graph is unreadable when browser is defaulted to dark mode" — **OPEN** (no body). Plausibly because of hard-coded stroke/fill colours and a theme-dependent text colour; the code shows hard-coded `#c7b8f0`/`#cfcfcf` edges (concept-graph.tsx:88) while the PRD describes a dark `prefers-color-scheme` variant (PRD:116). This is an inference, not confirmed.
- **[DOC]** PRD says nothing about the graph: `grep -n "graph\|Concept"` over the PRD returns only an unrelated hit at line 71. PRD §5: "The knowledge artefact / concept mapping (§9.9) — explicitly v2 in the full spec; also deferred here." — [PRD](docs/reading-curator-mvp.prd.md):53. PRD §13 "Confirmed healthy" says landing claims "none promise ... concept mapping" — :190. The landing page itself does not mention the graph (src/app/page.tsx has no graph text), but the app header does.
- **[DOC]** REQ: FR-108 "The learner builds a concept map of the domain as the artefact's structural spine, growing it as the goal progresses."; FR-109 "The learner constructs the map. The service may propose candidate nodes and links for the learner to accept, edit or reject, but must not generate the map."; FR-110 prompt to extend the map from memory, sources closed; FR-115 prohibitions "must not ... construct the concept map for them" — [REQ §9.9](docs/requirements-v0.7.md):305-312. Evidence: "constructing maps (g≈0.72) clearly beating studying them (g≈0.43)" — :18. Placed in REQ v2 (:436), with a note that "Concept mapping could be pulled into v1 as a limited experiment if the measurement plan is in place." — :438. REQ also lists "Themes" (FR-22-24) as v3 and excludes "Zettelkasten, PARA ... bidirectional linking" for lack of evidence (:18).
- **[CODE]** Tag-based cross-reading browsing: `/tags` (list with note counts) and `/tags/[name]` (notes grouped by reading item) — [tags/page.tsx](src/app/tags/page.tsx), [tags/[name]/page.tsx](src/app/tags/[name]/page.tsx); tags are per-user (`@@unique([userId, name])`, SCHEMA:107), normalised and orphan-pruned (SPEC:95-103; `pruneOrphanTags`, notes.ts:125). `/tags` still has no nav link (nav at layout.tsx:38-40 lists only "My goals" and "Concept graph"), and its back-link still points to `/` (tags/page.tsx:11). #18 and #19 are **OPEN**.

### Inferences
- The graph is closer to a "tag co-occurrence map" than a concept map in the sense of REQ FR-108/109: it is machine-derived, undirected, has no propositions or relationship labels, and is not constructed by the learner. Relative to REQ's constructed-versus-studied evidence it is a "studied" artefact generated automatically from tags the learner chose.
- Conceptual structure exists only in what the learner tags; there is no vocabulary linking tags to goals' questions.
- The graph is the first shipped feature that connects multiple goals visually (a tag shared across goals links them via the tag node), so it is the only cross-goal view in the product.

### Gaps
- No design doc for the graph (only the commit message); intended usage cadence ("~every second session") is stated in a code comment with no source document.

---

## 12. Multi-goal handling

### Takeaway
Multiple goals per user are fully supported in code with no cap, no ordering/priority, no status, and no discouragement. REQ FR-5 says multiple concurrent goals should be "actively discouraged, with the elapsed-time cost made explicit". Cross-goal features: moving reading items between goals, tags shared across goals, concept graph.

### Cited Findings
- **[DOC]** REQ FR-5: "Multiple concurrent goals permitted but actively discouraged, with the elapsed-time cost made explicit." — [REQ](docs/requirements-v0.7.md):193. FR-24 "Adjacent themes can be surfaced as candidate future goals." — :336. G6 "Absorb what the learner discovers without letting it derail the goal" — :164.
- **[DOC]** PRD does not mention FR-5 or multi-goal; PRD §7 resolved "single-user" which refers to users, not goals ([PRD](docs/reading-curator-mvp.prd.md):70). PRD §6 secondary metric: "number of goals created vs. goals with ≥1 reading item attached" — :63.
- **[CODE]** `/goals` lists all goals newest-first ([goals.ts](src/lib/goals.ts):4-10; [goals/page.tsx](src/app/goals/page.tsx):22-34). No sorting/priority/active flag; no archive. Goal deletion is hard delete cascading to items, notes, questions (SCHEMA cascades 32, 46, 78, 92) with an unconfirmed button ([page.tsx](src/app/goals/[id]/page.tsx):87-91).
- **[CODE]** Cross-goal capabilities: `Tag` is per-user, not per-goal, deliberately: SPEC "Tags are a global implicit many-to-many. ... scoping tags per goal would wall off exactly the value being sought" — [SPEC](docs/superpowers/specs/2026-08-23-reading-notes-design.md):95-97 (later scoped to user, SCHEMA:99-108). Items movable between goals (readingItems.ts:130-156). Graph links goals via shared tags (graph.ts:103-110).
- **[CODE]** No relation between goals (no parent, dependency, ordering) — SCHEMA:25-37.

### Inferences
- Goals are peers in a flat list; the only implied relationships are through shared tags.

### Gaps
- Neither doc covers a "programme" of several goals in a planned order or with a shared time budget.

---

## 13. AI assistance

### Takeaway
No AI is used anywhere in the shipped app. REQ commits to a research/recommendation service with strict limits on AI help for the learner's own cognition; PRD defers recommendation (Could). The `.agents/`/Archon scaffolding in the repo is a development workflow, not product functionality.

### Cited Findings
- **[CODE]** `package.json` dependencies (lines 10-17) have no AI/LLM client; no network calls to model APIs in `src` (Next, Prisma, better-sqlite3, React only).
- **[DOC]** REQ FR-7, FR-8, FR-9, FR-43 (research and propose material with rationale, verified, decline if unsure) — [REQ](docs/requirements-v0.7.md):206-211; FR-74 "generate assessment questions from publicly available web material" — :125; FR-101 suggested default order — :261.
- **[DOC]** REQ hard limits on AI: "Hard limits placed on AI assistance within the artefact ... The service must therefore withhold the help learners will ask for." — [REQ §1](docs/requirements-v0.7.md):19; Non-goal "Generating the learner's understanding for them — no AI-written summaries, concept maps, or answers to retrieval items." — :174; FR-115 prohibitions — :312; principle 6 "The learner does the generative work." — :93; principles 2 and 3 "Never fabricate a source." "Never claim to have read what it has not read." — :89-90; FR-69, FR-86 — :122, :129. Also "Processing the text of reading material, for any purpose" is a non-goal — :170. FR-104: service may assist with "format, cloze selection and scheduling, never with the answer." — :286.
- **[DOC]** PRD MoSCoW: service-suggested reading is "Could", "explicitly deferred-leaning" — [PRD](docs/reading-curator-mvp.prd.md):100; Phase 4 not started — :138; "Service-suggested material ... pending usage data".
- **[DOC]** REQ FR-2 "The service interrogates the goal" implies an interactive (possibly AI) goal-interrogation; the mechanism is unspecified — [REQ](docs/requirements-v0.7.md):190.

### Inferences
- Any AI-assisted curriculum feature would sit under REQ's principle that the learner authors goals/outcomes/maps; AI proposals must be verifiable, grounded, and subject to FR-115. The spec explicitly allows AI to propose candidate nodes/links (FR-109), prerequisite material (FR-67), and a default order on request (FR-101).

### Gaps
- No spec of a model/provider, prompt policy, or privacy treatment for sending goal/notes to an AI service (REQ NFR on privacy says notes are "private, unguarded reflection", [REQ](docs/requirements-v0.7.md):368).

---

## 14. Export and portability

### Takeaway
The only export is a per-goal browser print view ("Export to PDF" link); there is no data export in an open format. REQ makes full open-format export a requirement (FR-113, NFR data portability), and PRD does not list it as deferred.

### Cited Findings
- **[CODE]** Goal detail has link "Export to PDF" to `/goals/[id]/print` ([page.tsx](src/app/goals/[id]/page.tsx):60); the print page renders title, description, questions, items grouped by status, and each item's notes with location, tags and linked questions, and `PrintTrigger` invokes the browser print dialog ([print/page.tsx](src/app/goals/[id]/print/page.tsx); [print-trigger.tsx](src/app/goals/[id]/print/print-trigger.tsx)). Commits `41fc1bc` (print export) and `4759993` "Extend print view to show structured notes for each reading item".
- **[CODE]** Print omits: question answered/unanswered state, per-question answering-note links, tag cross-links, graph, item `type`, `createdAt`/`updatedAt`, goal-level progress rollup. It includes the legacy `item.note` (print/page.tsx:56). `item.url` is printed as text (:55).
- **[CODE]** No JSON/CSV/Markdown/OPML export, no import, no API routes (`find src -name route.ts` returns none), no whole-account export. Database is a local SQLite file `prisma/dev.db`.
- **[DOC]** Landing page: "When you want your plan away from the screen, open a goal's print view and use your browser's print dialog to put it on paper or save it as a PDF." — [src/app/page.tsx](src/app/page.tsx):71-75. PRD lists "print/PDF export of a goal" as shipped beyond the plan — [PRD](docs/reading-curator-mvp.prd.md):140.
- **[DOC]** REQ FR-113 "The artefact must be exportable in full and in an open format."; FR-111 "offloadable reference layer"; FR-112 minimum contents of a completed artefact (goal and completion condition, concept map, segment map, from-memory explanations, retrieval item set with history, annotated reference layer); NFR "Data portability — full export in open formats"; v3 mentions "import" — [REQ](docs/requirements-v0.7.md):308-310, :369, :441. Cross-platform consistency and offline use are NFRs (:367); the app is a local-only responsive web app (PRD:72, :118).
- **[DOC]** PRD §5 does not list export as deferred; PRD §10 "No authentication and no hosting — runs locally" is stale (auth shipped, see §16).

### Inferences
- Portability to other tools (a calendar, a spreadsheet, a PKM) is currently impossible except by copy-paste or PDF.

### Gaps
- No doc defines which "open format" (JSON, Markdown, OPML, CSV) REQ intends.

---

## 15. Where REQ (long-term vision) covers curriculum definition, and where it does not

### Takeaway
REQ covers single-goal curriculum definition very thoroughly (framing, completion condition, time budget, sub-goals, resource selection and verification, segment-level selection, learner-led sequencing with dependency warnings, retrieval/spacing, adaptation, concept-map artefact, export). It does not have a multi-goal "programme" or "curriculum" concept; no weekly-schedule/calendar construct beyond a per-goal weekly budget statement; no outcome taxonomy; and it contains explicit limits (science only, no courses/video, no AI generation of understanding).

### Cited Findings
- **[DOC]** Present in REQ (FR ids): goal framing FR-1 to 6, FR-38, 39, 54 ([REQ:187-197](docs/requirements-v0.7.md)); discovery FR-7 to 11, 40 to 43; supply FR-12, 55 to 58, 72; triage FR-45, 59 to 62, 90; segments FR-91 to 100; sequencing FR-13, 15, 44, 46, 101, 102; list FR-17 to 19, 47; retrieval FR-20, 21, 31, 34, 49 to 51, 64 to 66, 84, 103 to 105; artefact FR-106 to 115; adaptation FR-25 to 30, 33, 52, 53, 67; themes FR-22 to 24; subject gating FR-35 to 37.
- **[DOC]** Time: only per-goal and per-segment/backlog (FR-3, 10, 44, 46, 60), measured against "time budget per week and total" for the goal. No cross-goal time allocation. FR-5 acknowledges multiple concurrent goals only to discourage them.
- **[DOC]** Missing in REQ: any entity grouping goals (§10 entity list at :342-356); a distinction between outcomes and goal; calendar/reminders/notification; collaboration/sharing (non-goal "Social features", :176); "formal curriculum" learners excluded (:49).
- **[DOC]** REQ states that it is itself pre-PRD: "This remains a requirements statement rather than a PRD" — [REQ](docs/requirements-v0.7.md):6; draft v0.7, "Technology and architecture agnostic" — :3.
- **[DOC]** REQ phasing — v1: goal framing, discovery/verification, capture, grounding, triage, segment identification, learner-led sequencing, list/sessions, retrieval and notes; v2: artefact and adaptive loop; v3: refresh mode, themes, import, expansion beyond science — [REQ §15](docs/requirements-v0.7.md):430-441. The PRD's MVP corresponds to a thin subset: FR-1, 6, 12, 17, 18-adjacent, 62, 7 (not built), only.

### Inferences
- A "curriculum" in the sense of a multi-goal sequenced programme is outside both documents' conceptual model. A single-goal "learning path" with a completion condition, time budget, sub-goals, learner-ordered resources and retrieval is within REQ.

### Gaps
- REQ is explicitly unvalidated: "First test, before significant build" ([REQ](docs/requirements-v0.7.md):426) has not (to the evidence in the repo) been run; PRD §2 notes no validation beyond n=1.

---

## 16. Post-MVP review (§13), issues #18-#24, and current open/closed state

### Takeaway
PRD §13 (dated 2026-08-25) flagged defects and gaps; only #22 (questions first-class and linked to notes) is closed (2026-08-26). #18, #19, #20, #21, #23 and #24 remain open at head. Four of the seven items overlap with curriculum-definition concerns: #22 (questions), #21 (activity/progress rollup), #23 (goal-form scaffolding) and #20 (restructure goal page toward "what to read next").

### Cited Findings
- **[DOC]** [PRD §13 tracking table](docs/reading-curator-mvp.prd.md):176-184: #18 `/tags` back-link points at landing page; #19 tags browsing unreachable from nav; #20 goal detail page inverted; #21 activity signal / write-only telemetry; #22 questions first-class, notes linked; #23 new-goal form scaffolding; #24 defer vs delete unexplained. "Suggested order: #18 and #19 first ..., then #20, then #21, then #22 after its own design pass." (:186).
- **[GH]** State at time of reading (`gh issue list --state all --limit 60`):
  - #18 OPEN (bug) Tags page 'Back to goals' link points at the landing page. Verified still true: [tags/page.tsx](src/app/tags/page.tsx):11.
  - #19 OPEN Tags browsing is unreachable from navigation. Verified: [layout.tsx](src/app/layout.tsx):38-40 has no tags link.
  - #20 OPEN Restructure goal detail page: reading list first, edit and delete behind disclosure. Verified: Edit form and Delete still at [page.tsx](src/app/goals/[id]/page.tsx):62-91 above questions and list; each active row has up to 9 controls (Notes, Edit, progress select, move-to-goal select, up, down, Defer, Delete; :159-203).
  - #21 OPEN Surface goal activity. Verified: no readers of `Event` (grep).
  - #22 CLOSED Make questions first-class and link notes to them (see §3).
  - #23 OPEN Add scaffolding to the new-goal form. Verified: [new/page.tsx](src/app/goals/new/page.tsx):9-25.
  - #24 OPEN Explain Defer vs Delete. Verified: [page.tsx](src/app/goals/[id]/page.tsx):190-203 with no help text.
  - Other issues: #7 OPEN drag-and-drop note reordering; #9 OPEN legacy `ReadingItem.note`; #15 OPEN author wrapping; #30 OPEN login bare catch; #32 OPEN dev-server cross-origin; #38 OPEN "No available method of updating notes" (no body; code has inline note edit); #39 OPEN concept-graph dark mode; closed: #13 repo cruft, #28 signup error, #35 delete-note not working.
- **[DOC]** PRD §13 on goal-form scaffolding: "The landing page promises ... the form is three empty boxes" (:171). On the goal page: "This reads as a CRUD admin screen rather than something a learner scans to decide what to read next." (:167). On telemetry: "surface activity as a *user-facing* signal ... this makes the app the thing that catches the drift §8 says has no tutor or deadline to catch it" (:169).
- **[DOC]** Review also states what it deliberately avoids: making questions first-class does so "without pulling in any deferred v2 machinery from §5" (:168).

### Inferences
- The PRD's own review prioritises usage-signal and convergence signals (questions) over planning features; the issues do not touch time budgets, outcomes, milestones, sequencing, or export.

### Gaps
- No issue exists (open or closed, per the list of 17 issues returned, all states) for time budgeting, milestones, outcomes, spaced review, AI help, or data export.

---

## 17. What the PRD and REQ explicitly rule out that a curriculum tool would need

### Takeaway
Explicit exclusions (PRD §5 / REQ §8) cover: suggested sequencing and dependency warnings (PRD defers), segment identification, retrieval/spaced review, concept mapping (as constructed artefact), diagnosis/adaptation, themes, multi-user/social, accreditation, non-science subjects, hosting content, AI recommendation (deferred in PRD; allowed but constrained in REQ), and, in REQ, imposing a sequence and AI-generated understanding. Whether these are "ruled out" or merely "deferred" differs by source.

### Cited Findings
- **[DOC]** PRD §5 "What We're NOT Building" ([PRD](docs/reading-curator-mvp.prd.md):46-58): multi-source corroboration (FR-94/95); segment identification; retrieval practice / recall-as-note / spaced review; knowledge artefact / concept mapping; learner-led sequencing support (suggested order, dependency warnings); diagnosis and adaptation; themes / concept surfacing across notes; "Multi-user/social features, accreditation, non-science subjects, hosting or serving content — out of scope per the full spec's non-goals and not revisited here"; "No additional out-of-scope items".
- **[DOC]** PRD MoSCoW Won't: "Segment identification, corroboration, retrieval practice, concept map/artefact, sequencing suggestions, diagnosis/adaptation" — :102.
- **[DOC]** REQ non-goals ([REQ §8](docs/requirements-v0.7.md):168-179): processing the text of reading material; imposing a reading sequence; being a lifelong second brain (artefact is goal-scoped and finishable); hosting/serving/reading content, acquiring or paying for material; generating the learner's understanding; subjects outside science; social features, formal accreditation, courses/video/podcasts as first-class types; teaching the subject directly or adjudicating correctness; any claim of measured learning-outcome improvement; "learning styles" personalisation.
- **[DOC]** REQ target-user exclusions: "full-time students, learners inside a formal curriculum, frontier researchers, browsers with no specific goal" — :49 (repeated in PRD:84). Also "Will ask for the assistance that harms them" (REQ:47) — design to decline.
- **[DOC]** PRD scope tension: PRD §3 says the long-term features "are explicitly deferred past this MVP" (deferral), while REQ non-goals (imposed sequence, AI-generated understanding, non-science) are permanent exclusions.
- **[CODE]** The code enforces none of the exclusions: no subject gating (FR-35/36 not built), and nothing prevents any subject or any item type (ITEM_TYPES "BOOK, PAPER, ARTICLE, OTHER", locationLabel.ts:4). Courses/video/podcasts have no type but can be entered as OTHER or ARTICLE with a URL.

### Inferences
- Requirements a curriculum tool would typically need that the docs rule out or defer: suggested sequencing and prerequisite warnings (deferred, PRD:54), auto-sequencing (excluded in REQ:171), non-science subjects (excluded PRD:57, REQ:175), video/course items as first-class types (excluded REQ:176), AI-generated summaries/maps (excluded REQ:174), accreditation (excluded), learners within a formal curriculum (not target user).

### Gaps
- PRD §5 and REQ §8 disagree on one detail only by phrasing: PRD §5 says sequencing support is "deferred", REQ §8 says imposing a sequence is a non-goal, while suggesting an order on request is a v1 requirement (FR-101).

---

## 18. Internal inconsistencies and stale statements (PRD/REQ/SPEC vs. current code at head `aeb560c`)

### Takeaway
The PRD (last edited 2026-08-25, commit `aeb58fa`; `git log -- docs/reading-curator-mvp.prd.md` shows only that and the initial commit `ad3bdee`) pre-dates auth, move-between-goals, print-with-notes, the questions model and the concept graph, so its §7, §10, §11 and §13 contain statements that are no longer true.

### Cited Findings
- **[DOC vs CODE] Authentication.** PRD: "No authentication and no hosting — runs locally via `next dev`. Single-user by design (§7)." ([PRD](docs/reading-curator-mvp.prd.md):118) and "Resolved: single-user. No auth or multi-tenancy was built." (:70). Code: `User` model with email/passwordHash, `Goal.userId`, `Tag.userId` ([SCHEMA](prisma/schema.prisma):15-23, 31-32, 104); `src/proxy.ts` redirects unauthenticated requests to `/login`; routes `/login`, `/signup`, logout; commit `8b73e2a` "feat: add email/password auth and scope data to user"; migration `20260827181039_add_user_and_scope_goal_tag`. Hosting is still not present in-repo (no deployment config checked).
- **[DOC vs CODE] Questions.** PRD §10 ":122" says `Goal.questions` is a newline-delimited text field; §7 ":77" says questions-as-entities still open; §13 :168 describes them as inert. Code: `Question` model and note links (SCHEMA:39-50, 94); #22 closed.
- **[DOC vs CODE] Entity model.** PRD §10 lists `Goal, ReadingItem, Note, Tag, Event` ([PRD](docs/reading-curator-mvp.prd.md):122-126) but omits `User` and `Question`; says `Tag` is "unique name, shared across notes" (:125) while it is now unique per user (SCHEMA:107); `Event` is documented without `userId` (SCHEMA:115 has it).
- **[DOC vs CODE] Routes.** PRD §10 route map ([PRD](docs/reading-curator-mvp.prd.md):128) omits `/graph`, `/login`, `/signup` and the logout action.
- **[DOC vs CODE] Concept graph.** PRD §5 and MoSCoW defer concept mapping ("explicitly v2 ... also deferred here", :53, :102), and §13 "Confirmed healthy" says no landing-page claim promises concept mapping (:190). Code ships `/graph` Concept graph with a header nav link (layout.tsx:39) from commit `23039f1`/PR #37. The PRD has no mention of this feature, no decision-log entry, and its §11 "Also shipped beyond the original phase plan" (:140) omits it, as well as moving items between goals (`25ce255`), print-with-notes (`4759993`, though §11 mentions "print/PDF export of a goal"), email/password auth, and first-class questions.
- **[DOC vs CODE] Sequencing.** PRD :54 "MVP reading list is unordered/learner-free-form" vs :140 and code `position` ordering with up/down buttons (SCHEMA:74).
- **[DOC vs DOC] §12 Decisions Log last bullet** says "Technical Approach left largely unresolved (stack, entities, hosting) ... because the repository has no application code" ([PRD](docs/reading-curator-mvp.prd.md):154) while §10 now documents the stack as built and §"Validation Notes" says the original note is superseded (:146). The Decisions Log entry was not updated.
- **[DOC vs DOC] Phase table vs MoSCoW.** PRD §9 MoSCoW lists "Deferral/backlog distinction" as Could (:101), §11 says it shipped (:140); MoSCoW unchanged.
- **[DOC vs DOC] PRD §6 secondary metrics** ("not yet instrumented", :63) vs `Event` table now recording events with `userId`; still no reader.
- **[DOC vs CODE] SPEC.** SPEC says "Status: Approved (design); implementation plan not yet written" ([SPEC](docs/superpowers/specs/2026-08-23-reading-notes-design.md):4) though the feature shipped (`5d002c4`). SPEC `Tag.name @unique` (:70) superseded by per-user unique. SPEC notes actions use `{ error }` returns, verified in [notes/actions.ts](src/app/goals/[id]/items/[itemId]/notes/actions.ts):8-14. SPEC's "Open items" lists #7 and #9, both still open.
- **[CODE vs UI-copy] Graph back-link** `← Back to goals` goes to `/` ([graph/page.tsx](src/app/graph/page.tsx):17), repeating the #18 defect on a new page; no issue tracks it.
- **[CODE] Issue #38** "No available method of updating notes" is open though inline note editing is present in code (note-item.tsx:57-127, :147-149); status of the issue is unclear from the repo alone.
- **[CODE] Possible data-integrity edge:** moving an item to another goal leaves note-question links to the old goal's questions (see §5; unverified by test).
- **[DOC] Product name inconsistency:** repo/dir `read2learn`, app title "Reading Curator" (layout.tsx:19; PRD title). Only noteworthy for naming in the comparison report.
- **[DOC] "Where Gaps are named TBD":** PRD §2 "Gap: TBD" and §6 "Specific target thresholds — TBD" remain unresolved.

### Inferences
- If the comparison report cites the PRD's stack/entity/route sections, it should use the code-verified versions here (sections 0, 3, 11) because the PRD text is stale on auth, questions, tags, routes and graph.

### Gaps
- I did not check the app at runtime (no browser/dev server), only source. The migrations list and generated Prisma models were not read in detail beyond `schema.prisma`.

---

## 19. Summary matrix: PRD / REQ vs. code, by curriculum-definition dimension

| # | Dimension | REQ (long-term) | PRD (MVP) | Code at head | Gap |
|---|---|---|---|---|---|
| 1 | Goal framing and completion condition | FR-1 to 6, 38, 39; stage 1 Frame | FR-1, FR-6 only (Must/Should) | Title, description, edit; no completion condition, deadline, purpose | Large; #23 open (scaffolding only) |
| 2 | Outcomes/objectives | FR-4, FR-39 (implicit) | None | None (free-text description only) | Total |
| 3 | Questions | Not as learner questions (assessment FR-31 etc.) | Free-text "Questions" originally; first-class promoted in §13 / #22 | `Question` model; notes linked; "N of M open" | PRD stale; no edit/reorder; derived answered state |
| 4 | Sub-goals/modules/milestones | FR-54, FR-29, FR-58, Sub-theme | Deferred (themes) | None; note `location` free text only | Total |
| 5 | Resources and discovery | FR-7 to 12, 40 to 43, 55 to 62, 68, 72, 91 to 100 | Manual add (Must); suggestions Could/not started; deferral shipped | Manual items, type, defer/restore, move between goals; legacy note | Verification, discovery, estimates, segments absent |
| 6 | Sequencing/prerequisites | FR-13, 15, 96, 101, 102, 52 | Deferred (but manual ordering shipped) | `position` up/down | No suggestions/warnings/prereqs |
| 7 | Time budgeting/scheduling | FR-3, 10, 44, 46, 47, 60, 19 | None | None | Total |
| 8 | Progress tracking | FR-18, 19, 26, 90, G4 | Should (item progress, shipped); metric uncomputed | Item progress; question open count; events write-only | No goal rollup (#21), no abandoned, no evidence-based progress |
| 9 | Retrieval/spaced review | FR-20, 21, 49, 103 to 105 ("the spine") | Deferred | Free notes with tags; passive review | Total |
| 10 | Reflection/adaptation | FR-25 to 30, 33, 52, 53 | Deferred | Manual edits only | Total |
| 11 | Concept mapping | FR-108 to 110, 115 (learner-constructed; v2) | Deferred; no mention of graph | `/graph`: auto-derived tag/goal graph, read-only | Different in kind; PRD silent; #39 open |
| 12 | Multi-goal handling | FR-5 (discourage), FR-24 | Not covered | Unlimited goals; move items; shared tags | Opposite stance; no portfolio view |
| 13 | AI assistance | FR-7, 74, 101, 109, 115 limits | Could (deferred) | None | Total |
| 14 | Export/portability | FR-111 to 113, NFR portability | Print/PDF listed as shipped | Per-goal browser print only | No open-format/data export |

---

## Files read

- /Users/brianmason/Documents/src/ijump.co.uk/read2learn/docs/reading-curator-mvp.prd.md (190 lines, all)
- /Users/brianmason/Documents/src/ijump.co.uk/read2learn/docs/requirements-v0.7.md (459 lines, all)
- /Users/brianmason/Documents/src/ijump.co.uk/read2learn/docs/superpowers/specs/2026-08-23-reading-notes-design.md (250 lines, all)
- /Users/brianmason/Documents/src/ijump.co.uk/read2learn/prisma/schema.prisma (all)
- src: `lib/goals.ts`, `lib/questions.ts`, `lib/readingItems.ts`, `lib/events.ts`, `lib/notes.ts`, `lib/graph.ts`, `lib/locationLabel.ts`; `app/layout.tsx`, `page.tsx`, `goals/page.tsx`, `goals/new/page.tsx`, `goals/actions.ts`, `goals/[id]/page.tsx`, `goals/[id]/actions.ts`, `goals/[id]/goal-select.tsx`, `goals/[id]/print/page.tsx`, `goals/[id]/items/[itemId]/{page,notes-panel,note-item,add-note-form,edit/page,notes/actions}.tsx|ts`, `tags/page.tsx`, `tags/[name]/page.tsx`, `graph/page.tsx`, `graph/concept-graph.tsx`, `proxy.ts`; `package.json`; `git log`, `git show --stat 23039f1`; `gh issue list --state all --limit 60` and bodies of #7, #9, #21, #22, #23, #38, #39.
- Not read: tests (other than titles), generated Prisma client, globals.css (graph colours only via grep), login/signup/session/auth internals, `.archon/config.yaml`.
