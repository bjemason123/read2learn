# Data models, standards and technical approaches for a personal learning-curriculum tool

Scope: notes to guide extending the existing read2learn app (Next.js 16 / React 19 / Prisma 7 / SQLite). No Next.js-specific claims are made here; none were verified from current Next.js docs. Research date 2026-11-07. Several vendor docs fetched below carry 2026 dates (Crossref 21 July 2026; OpenAlex change affecting accounts created after 3 Nov 2026), so the API sections are volatile and should be re-checked before implementation.

**Repo discrepancies spotted while checking the codebase (read from `/Users/brianmason/Documents/src/ijump.co.uk/read2learn`, not web-sourced):**
- `prisma/schema.prisma` already has a `Question` model (`goalId`, `text`, `order`, many-to-many with `Note`). The brief described goal questions as newline-delimited text; in the current schema they are rows.
- The schema has a `User` model (`email`, `passwordHash`) and `Goal.userId`/`Tag.userId`, and `src/app` has login/signup routes. The app is multi-user-capable, not "no auth".
- `Note` belongs to a `ReadingItem` (`readingItemId` required), not directly to a Goal.
- `Goal` has `title` and `description`; there is no module, outcome or time-budget model yet.
- `package.json` has `@prisma/adapter-better-sqlite3 ^7.9.1`, `next 16.3.1`, `react 19.2.8`, `@types/node ^20`, and no graph/charting library.
- The concept graph (`src/app/graph/concept-graph.tsx`) is a dependency-free SVG with deterministic ring layout. `src/lib/graph.ts` derives edges from existing relations with "no new tables".
- Local Node is v26.13.0, per `node -v`.

---

## 1. Which standards and open models describe curricula, competencies and learning paths, and which are worth borrowing from?

### Takeaway
For a single-learner local tool, borrow vocabulary and a few structural ideas rather than adopt any standard wholesale. Useful: CASE's item/association (typed edge) model, schema.org `LearningResource` property names for export, the knowledge-space "outer fringe" idea for "next action", Metacademy's concept/prerequisite/resource separation, and Bloom verbs for outcome statements. Overkill: CTDL, Open Badges 3.0 issuance, xAPI/cmi5, LTI, and the ESCO/O*NET taxonomies, unless you later need interchange or employer-facing skills.

### Cited Findings

**IMS/1EdTech CASE (Competencies and Academic Standards Exchange)**
- The CASE v1.1 information model lists CFAssociation among its core classes and is dated January 2025. v1.1 added a `notes` attribute to CFAssociation and `isTranslationOf` to the association-type vocabulary. — [1EdTech CASE v1.1 info model via search](https://standards.1edtech.org/case/specifications/standards/v1p1/im)
- CFAssociation links two objects (CFDocument to CFDocument, or CFItem to CFItem) via `associationType` (for example `isChildOf`), `originNodeURI` and `destinationNodeURI`. — [IPSJ magazine article](https://ftp.ipsj.or.jp/magazine/9faeag0000005al5-att/6210peta.pdf)
- A practitioner blog notes recursive `isChildOf` associations can make retrieved documents very large when there are thousands of associations. — [Making CASE Easier to Understand](https://medium.com/data-science-in-learning/making-case-easier-to-understand-3e1d9f4d46c2)
- I could not confirm from the sources reached whether a `precedes` association type exists in the CASE v1.1 enumeration. The info-model URL I tried directly returned 404. — [attempted: imsglobal.org CASE v1p1 information](https://www.imsglobal.org/spec/case/v1p1/information)

**CTDL (Credential Transparency Description Language) / CTDL-ASN**
- CTDL-ASN encodes competency hierarchy with `hasChild`/`isChildOf`, published as JSON-LD (`CompetencyFramework`, `Competency`). O*NET publishes competency frameworks using these classes. — [skills-ml ontologies doc](https://workforce-data-initiative.github.io/skills-ml/ontologies); [O*NET Competency Frameworks](https://onetcenter.org/competencyFrameworks.html)
- Credential Engine positions CTDL, CASE and CaSS as complementary, with an explainer. — [CE Explainer CTDL CASE CaSS](https://credentialengine.org/wp-content/uploads/2024/03/CE-Explainer-CTDL-CASE-CaSS.pdf)
- I did not confirm a competency-prerequisite property in CTDL; the credreg.net term page returned 403. — [attempted](https://credreg.net/ctdl/terms/CompetencyFramework)

**ESCO / O*NET**
- ESCO attribution notes say O*NET OnLine data is provided by USDOL/ETA and used under CC BY 4.0. The European Commission site generally licenses owned content under CC BY 4.0, but I could not confirm the licence for the ESCO API specifically. — [ESCO](https://esco.ec.europa.eu/en/use-esco/use-esco-services-api)
- O*NET Web Services is described by a third-party blog as free with a developer account and attribution terms. That is not an authoritative source. — [jobspipe blog](https://jobspipe.dev/blog/onet-api.md)

**Open Badges 3.0**
- Final Release, Spec Version 3.0, document version 1.4.5, issued June 29, 2026 (as shown on the fetched page), by 1EdTech. — [Open Badges 3.0](https://www.imsglobal.org/spec/ob/v3p0/)
- OB 3.0 aligns with W3C Verifiable Credentials Data Model v2.0, and an Assertion is now also a Verifiable Credential. Core objects: AchievementCredential, Achievement, Criteria, Profile, Alignment, Result, ResultDescription. It includes an OAuth 2.0 API, JWT and Linked-Data proof formats, key management and a conformance programme. The spec lists a "Self-assertion" use case, but its text wasn't retrieved. — [Open Badges 3.0](https://www.imsglobal.org/spec/ob/v3p0/)

**schema.org LearningResource / LRMI**
- `LearningResource` defines `learningResourceType`, `educationalLevel`, `teaches`, `assesses`, `competencyRequired`, `educationalAlignment` (AlignmentObject), `educationalUse`. Inherited from CreativeWork: `timeRequired` (Duration), `isBasedOn`, `interactivityType` ("active", "expositive" or "mixed"). `Course`, `Quiz` and `Syllabus` are listed as more specific types. — [schema.org/LearningResource](https://schema.org/LearningResource)
- That page does not say whether LRMI is part of schema.org; I'm treating the LRMI properties as living in schema.org on that basis only. Not verified.

**xAPI / cmi5**
- cmi5 is built on xAPI statements (actor-verb-object) and adds launch rules, completion rules and mandatory verbs (passed, failed, completed, abandoned). xAPI leaves reporting to whatever sits on the LRS. Sources are a vendor blog and an ADL deck, not the spec text. — [Coursebox comparison](https://www.coursebox.ai/blog/xapi-vs-cmi5-elearning-standards); [ADL overview PDF](https://demo.adlnet.gov/assets/uploads/Overview%20and%20Application%20of%20xAPI%20cmi5%20and%20xAPI%20Profiles.pdf)

**Knowledge Space Theory (KST)**
- Outer fringe of a state: items outside the state that can be added while staying in the structure. Inner fringe: items inside the state that can be removed while staying in it. In a learning space a state is determined by its two fringes. The outer fringe is read as "ready to learn". — [Doignon & Falmagne, arXiv 1511.06757](https://arxiv.org/pdf/1511.06757); [Springer s40593-019-00176-0](https://link.springer.com/doi/10.1007/s40593-019-00176-0)
- In ALEKS data, the estimated probability that a student successfully learns an item picked from the outer fringe is about 0.93. — [arXiv 1511.06757](https://arxiv.org/pdf/1511.06757)
- In the quasi-ordinal case, the inner fringe is the maximal items in the state and the outer fringe is the minimal items not in it. This is the same as "all prerequisites done, itself not done" on a prerequisite DAG. — [arXiv 0803.4030](https://arxiv.org/pdf/0803.4030)

**Metacademy**
- Each concept lists prerequisites and collects learning resources; the prerequisite graph generates a learning plan for a chosen concept ("package manager for knowledge"). Content was a flat-file database on GitHub (metacademy-content) under a permissive licence, centred on ML/AI. Sources date from about 2014; current status unconfirmed. — [hunch.net](https://hunch.net/?p=2714); [foldl.me](https://foldl.me/2014/metacademy)
- ConcepDAG (separate project) renders concept dependencies as a static site. — [sharmaeklavya2/concepdag](https://github.com/sharmaeklavya2/concepdag)

**roadmap.sh**
- Roadmap content is Markdown, one file per topic at `roadmaps/<slug>/content/<topic-slug>@<node-id>.md`; node IDs in filenames link content to graph nodes. I found no JSON schema, progress-tracking or licence details on the repo page. — [kamranahmedse/developer-roadmap](https://github.com/kamranahmedse/developer-roadmap)

### Inferences
- CASE's transferable idea is a typed edge table (`origin`, `destination`, `type`) instead of a hard-wired tree. Combined with KST, that suggests a single `OutcomeLink` table (`PREREQUISITE`, `RELATED`) over outcomes, with the hierarchy (curriculum > module > outcome) kept as plain foreign keys. Avoid CASE's recursive-`isChildOf` pattern for hierarchy; a plain parent FK is cheaper and sufficient.
- KST's "outer fringe" translates directly into the "next action" query: outcomes not mastered whose prerequisite outcomes are all mastered.
- Metacademy's separation (concept, prerequisite, resource) maps to Outcome, OutcomeLink, Activity/ReadingItem. This also matches the existing ReadingItem-as-resource design.
- Export-only alignment is cheap: map Goal to schema.org `Course`/`Syllabus`, Outcome to `teaches`/`competencyRequired` text, ReadingItem to `LearningResource` with `timeRequired` ISO-8601 duration. No runtime dependency on any standard is needed.
- Open Badges 3.0 is only relevant if you want a verifiable self-issued "I completed this goal" artefact, which requires key management and proofs. This seems out of scope for a single local learner. Defer.
- xAPI/cmi5/LTI exist to connect content to an LMS/LRS. Single-learner, no-LMS use has no counterpart for them. One light use: emit xAPI-like "actor verb object" rows into the existing `Event` table for later export. Optional.
- ESCO/O*NET are occupational skills taxonomies. They are only useful if the learner wants outcomes tagged to employment skills (autocomplete from ESCO). Overkill for v1.
- Bloom's: the verb-led outcome statement ("Explain...", "Compare...", "Design...") plus a `level` field (REMEMBER, UNDERSTAND, APPLY, ANALYSE, EVALUATE, CREATE) is lightweight, and is the practical way to model "Bloom's-aligned outcomes". I did not retrieve a Bloom's source in this pass; treat the six-level taxonomy as general knowledge, not a cited finding.

### Gaps
- Whether CASE has a `precedes`-type association (only `isChildOf` confirmed). Sources 404'd.
- Whether CTDL/CTDL-ASN has a competency prerequisite property (credreg.net 403).
- Whether LRMI is formally within schema.org (the LearningResource page was silent).
- Licence of the ESCO API and the terms of the O*NET Web Services (not confirmed from primary sources).
- Whether OB 3.0 permits and specifies self-issued credentials (section 3.8 text not read).
- Current maintenance status of Metacademy (sources circa 2014); the metacademy.org about page was unreachable.
- LTI was not researched; no source retrieved.
- Bloom's taxonomy: no source retrieved.

---

## 2. A sensible minimal entity model: curriculum, modules/milestones, outcomes, activities/resources

### Takeaway
Extend `Goal` as the curriculum root (do not add a parallel "Curriculum" entity), add `Module` (ordered milestone), make `Outcome` a first-class row with an optional prerequisite edge table (a DAG, validated acyclic in application code), link `ReadingItem`s to outcomes through an `Activity` join that carries time estimates, and add a per-goal weekly time budget. Promote notes/questions to link to outcomes via join tables. SQLite and Prisma support all of this using plain relations; enums are stored as TEXT without DB-level enforcement.

### Cited Findings
- On SQLite, Prisma enums map to `TEXT`, and "SQLite doesn't enforce enum values at the database level"; invalid values fail at Prisma Client runtime. `Json` maps to `JSONB`, `DateTime` to `NUMERIC`, `Boolean` to 0/1. — [Prisma SQLite docs](https://www.prisma.io/docs/orm/overview/databases/sqlite)
- Prisma 7 with local SQLite uses a driver adapter (`@prisma/adapter-better-sqlite3`, `PrismaBetterSqlite3`) passed to `new PrismaClient({ adapter })`; `prisma.config.ts` holds `schema` and `datasource.url`; use `prisma migrate dev` for local schema changes. The better-sqlite3 adapter's `timestampFormat` defaults to ISO 8601. — [Prisma SQLite docs](https://www.prisma.io/docs/orm/overview/databases/sqlite)
- The Prisma SQLite page does not address self-relations, many-to-many or scalar lists on SQLite; I did not verify those from docs. — [Prisma SQLite docs](https://www.prisma.io/docs/orm/overview/databases/sqlite)
- The existing repo already uses implicit many-to-many (`Note`<->`Tag`, `Note`<->`Question`) and enums for `Progress`/`ItemType`. — read from `prisma/schema.prisma` in the repo

### Inferences

**Schema sketch (Prisma-style; additive to the current schema; verify syntax with `prisma validate`)**

```prisma
// --- Goal stays the root. Add fields and relations ---
model Goal {
  // existing: id, title, description, userId, readingItems, questions...
  targetDate        DateTime?
  weeklyMinutes     Int?          // time budget; null = unbudgeted
  budgetStartsOn    DateTime?     // anchor for week 1
  modules           Module[]
  outcomes          Outcome[]
  drafts            CurriculumDraft[]
}

model Module {                    // "milestone" — ordered chunk of the plan
  id         String   @id @default(cuid())
  goalId     String
  goal       Goal     @relation(fields: [goalId], references: [id], onDelete: Cascade)
  title      String
  summary    String?
  position   Int
  targetDate DateTime?            // optional soft deadline
  outcomes   Outcome[]
  @@index([goalId, position])
}

model Outcome {                   // first-class learning outcome
  id          String   @id @default(cuid())
  goalId      String
  goal        Goal     @relation(fields: [goalId], references: [id], onDelete: Cascade)
  moduleId    String?
  module      Module?  @relation(fields: [moduleId], references: [id], onDelete: SetNull)
  statement   String               // "Explain how X causes Y" (verb-led)
  bloomLevel  String?              // REMEMBER|UNDERSTAND|APPLY|ANALYSE|EVALUATE|CREATE (TEXT)
  status      String   @default("NOT_STARTED") // NOT_STARTED|IN_PROGRESS|MASTERED
  masteredAt  DateTime?
  position    Int      @default(0)
  source      String   @default("USER")        // USER|AI (provenance, see section 4)
  draftItemId String?              // back-link to accepted proposal
  activities  Activity[]
  notes       NoteOutcome[]
  questions   Question[]           // add Question.outcomeId optional FK
  cards       ReviewCard[]
  prereqOf    OutcomeLink[] @relation("to")    // edges where this is the dependent
  prereqs     OutcomeLink[] @relation("from")
  @@index([goalId, position])
}

model OutcomeLink {               // typed edge; PREREQUISITE is a DAG
  id         String @id @default(cuid())
  fromId     String               // prerequisite
  toId       String               // dependent
  type       String @default("PREREQUISITE") // or RELATED
  from       Outcome @relation("from", fields: [fromId], references: [id], onDelete: Cascade)
  to         Outcome @relation("to",   fields: [toId],   references: [id], onDelete: Cascade)
  @@unique([fromId, toId, type])
}

model Activity {                  // outcome <-> resource, with time estimate
  id            String  @id @default(cuid())
  outcomeId     String
  outcome       Outcome @relation(fields: [outcomeId], references: [id], onDelete: Cascade)
  readingItemId String?           // existing resource; null for non-reading tasks
  kind          String  @default("READ")   // READ|WATCH|PRACTISE|WRITE|REVIEW
  label         String?           // chapter/section/exercise
  estMinutes    Int?
  actualMinutes Int     @default(0)
  done          Boolean @default(false)
  position      Int     @default(0)
}

model NoteOutcome {               // explicit join (can carry "evidence" flag later)
  noteId    String
  outcomeId String
  @@id([noteId, outcomeId])
}

model ReviewCard { ... }          // see section 3
model CurriculumDraft { ... }     // see section 4
```

**Trade-offs**
- Tree vs DAG: Module as a plain FK gives a simple ordered tree for the roadmap view. Prerequisites between outcomes (including across modules) go in `OutcomeLink`, giving a DAG. Enforce acyclicity in application code on every insert (DFS reachability from `to` back to `from`); SQLite has no declarative cycle check. Store only direct edges, never transitive closure.
- Outcomes first-class vs free text: first-class rows allow mastery state, links from notes/questions/cards, and AI proposals to be accepted/rejected individually. Free text (e.g. extending `Goal.description`) is cheaper but cannot carry progress, prerequisites or links. Recommendation: first-class, with an `Outcome.statement` free-text field. Skip competency IDs/URIs until export is needed.
- Milestones vs sub-goals: Modules as grouping-only (title, position, optional date) avoid recursive Goals. The existing `Goal.userId` ownership, `Event` logging and goal pages stay unchanged. A "sub-goal" would duplicate reading lists, questions and notes plumbing. A nullable `Module.targetDate` carries the milestone semantics.
- Questions: the schema already has `Question` rows; add an optional `Question.outcomeId` rather than a join table (one question belongs to at most one outcome). Keep the existing Note<->Question many-to-many.
- Notes to outcomes: `Note` currently hangs off `ReadingItem`. Use a join (`NoteOutcome`) since a note can evidence several outcomes. A Tag-to-Outcome mapping can be derived rather than stored.
- Activity vs just linking `ReadingItem` to `Outcome`: the join exists because the time estimate and "which chapters" belong to the pairing, not the book. If extra complexity is unwanted, collapse to `ReadingItem.estMinutes` and an implicit many-to-many `ReadingItem<->Outcome`.
- Time budget: `Goal.weeklyMinutes` plus `Activity.estMinutes` is enough for a projection. Projected finish = today + ceil(sum(estMinutes of undone activities) / weeklyMinutes) weeks. Per-module "on track" compares the cumulative planned minutes up to that module's end against the budget-implied date and `Module.targetDate`. Critical path for prerequisite chains is a longest-path pass over the DAG weighted by remaining minutes. Use a topological sort (Kahn) for both.
- Next-action query ("outer fringe"): outcomes where `status != MASTERED` and every incoming PREREQUISITE edge's `from` has `status = MASTERED`, ordered by `Module.position`, then `Outcome.position`. Surface the first undone `Activity` of those.
- Enums as TEXT: matches Prisma's SQLite mapping; validate with a TypeScript union / Zod at write time, since the DB won't.
- Migration: existing goals keep working (all new relations optional). Existing reading items need no outcome; they appear under an "Unassigned" bucket until linked.

### Gaps
- No empirical source on how real personal-curriculum tools model modules/outcomes (competitive landscape is covered by a separate notes file `competitive_landscape.md`; not reviewed here).
- Prisma self-relation/many-to-many behaviour on SQLite was not verified from docs; the schema sketch is unvalidated against Prisma 7.9.1.
- No source on Bloom's-aligned outcome modelling retrieved.

---

## 3. Spaced repetition and retrieval scheduling: FSRS vs SM-2

### Takeaway
FSRS (via `ts-fsrs`, MIT) is the better default: it outputs a recall probability, so it can be calibrated and used to rank due items. Needs a small `ReviewCard` + `ReviewLog` table pair keyed to Outcome/Note/Question. However, the ts-fsrs v6 page I fetched now says Node 24+ and an async `DefaultScheduler()` API with FSRS-7 default, which differs from older examples I know; verify the exact API from the installed package before coding.

### Cited Findings
- SM-2 was not designed to predict recall probabilities, so benchmarking it needs an added formula (benchmark uses a trainable SM-2 variant). Log loss and RMSE(bins) are the benchmark metrics; secondary sources agree FSRS achieves lower log loss than SM-2, but numbers conflict (e.g. SM-2 0.354 vs FSRS-5 0.291 from one vendor page, SM-2 0.354 vs FSRS-4 0.327 from another). One source claims FSRS-6 has lower log loss than the baselines in 99.6% of collections. Primary benchmark: `open-spaced-repetition/srs-benchmark`; I did not open it. — [Expertium benchmark](https://expertium.github.io/Benchmark.html); [Anki forum](https://forums.ankiweb.net/t/fsrs-vs-sm2-in-2-seperate-profiles/52171); [Diane.app](https://www.diane.app/en/guides/fsrs-vs-sm2); [DEV post](https://dev.to/palachdigital_20fd679f5fe/why-fsrs-is-better-than-sm-2-2m17)
- ts-fsrs on GitHub: MIT licence; supports FSRS-3 through FSRS-7; `DefaultScheduler()` (async) uses FSRS-7 when `version` is omitted; Node.js 24.0.0 or later required for ts-fsrs v6 and the optimiser binding; ESM/CJS/UMD builds. — [ts-fsrs README](https://github.com/open-spaced-repetition/ts-fsrs)
- API shape on that page: `scheduler.newCard({ now })`, `scheduler.preview({ card, now })` returns outcomes per grade with `card` and `revlog`, `scheduler.review({ card, grade: Rating.Good, now })` returns `{ card, revlog }` without mutating the input. Grades: Again, Hard, Good, Easy. — [ts-fsrs README](https://github.com/open-spaced-repetition/ts-fsrs); [packages/fsrs README](https://github.com/open-spaced-repetition/ts-fsrs/blob/main/packages/fsrs/README.md)
- Retrievability: `scheduler.model.forgettingCurve(memoryState, elapsedDays)` returns 0 to 1; for FSRS-7 the memory state needs `stability`, `stabilityFast` and `difficulty`; elapsed days via `scheduler.chrono.difference(reviewedAt, checkedAt)`. Example config values on the page: `desiredRetention: 0.9`, `enableShortTerm: true`, `enableFuzz: false`, `maximumInterval: 36500` (example values, not documented defaults). — [packages/fsrs README](https://github.com/open-spaced-repetition/ts-fsrs/blob/main/packages/fsrs/README.md)
- Parameters can be trained from review logs using `@open-spaced-repetition/binding`, which lists FSRS-6 and 7. — [ts-fsrs README](https://github.com/open-spaced-repetition/ts-fsrs)

### Inferences
- Card field list not retrieved from the v6 README (the README said see the package). Practical approach: persist the scheduler's returned `card` object as JSON (SQLite `Json` is supported) plus denormalised `due`, `state`, `lastReview` columns for indexing, so a library version change does not force a column migration. Persist each returned `revlog` as an append-only row; those logs are the training data for later parameter optimisation.
- Node 24 requirement: the project's `@types/node` is `^20` and local Node is v26.13.0, so runtime is probably fine, but pin `engines.node` and check CI/hosting Node version. This is an inference from the version numbers only.
- SM-2 remains viable as a fallback if you want a ~20-line zero-dependency implementation (ease factor, interval, repetitions). Cost: no probability output, so no "retention-driven" ranking and no weak-outcome signal.
- Data model sketch:

```prisma
model ReviewCard {
  id          String   @id @default(cuid())
  userId      String
  outcomeId   String?            // curriculum link
  noteId      String?            // source of the prompt
  questionId  String?            // goal question reused as a retrieval prompt
  prompt      String             // front
  answer      String?            // back / rubric (optional for open recall)
  cardJson    String             // serialised scheduler card (version-tagged)
  schedulerV  String             // e.g. "fsrs-7@ts-fsrs-6.x"
  due         DateTime
  state       String             // NEW|LEARNING|REVIEW|RELEARNING
  suspended   Boolean  @default(false)
  logs        ReviewLog[]
  @@index([userId, due])
}
model ReviewLog {
  id String @id @default(cuid())
  cardId String
  grade Int          // 1..4
  reviewedAt DateTime
  elapsedMs Int?
  logJson String     // scheduler's revlog
}
```
- Linking review items to outcomes: define outcome "mastery" as a function of its cards, e.g. MASTERED when at least N cards exist and the mean retrievability of its cards is above a threshold (0.8), with manual override. This makes spaced repetition feed the same `status` that drives prerequisite unlocking, so a prerequisite outcome with decayed retrievability can regress to "needs review". Make the regress behaviour optional to avoid surprising the learner.
- Card sources, cheapest first: (a) existing Goal `Question`s as open-recall prompts, (b) AI-suggested cloze/Q&A drafted from a note body through the same accept/reject flow as the curriculum drafts, (c) manual.
- Budget interplay: reviews have a time cost; use a flat estimate (e.g. 0.5 to 1 minute per due card; my assumption, not sourced) and subtract expected review minutes from weekly reading minutes in the budget projection.

### Gaps
- Primary benchmark figures (srs-benchmark repo) were not opened; quoted numbers are from secondary sources and conflict. Do not cite specific log-loss values in the final report without verification.
- Card/ReviewLog field names in ts-fsrs v6 not retrieved; the FSRS-7 default and Node 24 requirement come from a summarised fetch of the GitHub page, and should be confirmed from the package's `package.json` (engines) and type definitions. Whether the earlier `createEmptyCard`/`fsrs()` API still exists in v6 was not confirmed.
- FSRS algorithm papers/maintainer docs (open-spaced-repetition wiki) not read.
- Review-time cost figure is an assumption.

---

## 4. AI-assisted curriculum drafting: architecture, guardrails, and API details

### Takeaway
Use a two-stage pipeline: (1) Claude generates a flat, ID-referenced curriculum draft under a JSON schema (structured outputs, no recursion), stored as a `CurriculumDraft` with per-item accept/edit/reject; (2) bibliographic claims are never trusted from the model. Resource suggestions are resolved against OpenAlex/Crossref/Open Library by your server, and only verified matches become `ReadingItem`s. All three APIs are usable without payment for a local tool, but rate-limit and pricing terms changed recently (Crossref 21 July 2026; OpenAlex key/pacing changes around 3 Nov 2026), so wrap them in a small client with backoff and caching.

### Cited Findings

**Claude structured outputs (current docs)**
- JSON outputs use `output_config.format` with `type: "json_schema"` and a `schema`; the response JSON is in the text content block. `output_format` is deprecated and, without the `structured-outputs-2025-11-13` beta header, returns 400; beta headers are no longer needed for `output_config.format`. — [Anthropic structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)
- TypeScript helper: `zodOutputFormat()` from `@anthropic-ai/sdk/helpers/zod` with `client.messages.parse()` returns `parsed_output`; plain JSON schema via `jsonSchemaOutputFormat()` from `@anthropic-ai/sdk/helpers/json-schema` (no response validation). — [Anthropic structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)
- Strict tool use: `strict: true` on a tool, with `input_schema` setting `additionalProperties: false`; can be combined with JSON outputs in one request. — [Anthropic structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)
- Supported schema features: object/array/string/integer/number/boolean/null, `enum`, `const`, `anyOf`, `$ref`/`$defs` (internal), `required`, `additionalProperties: false` (required on objects), formats such as `date`, `date-time`, `uri`, `uuid`, array `minItems` of 0 or 1 only. — [Anthropic structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)
- Unsupported (400): recursive schemas, `minimum`/`maximum`/`multipleOf`, `minLength`/`maxLength`, array constraints beyond `minItems` 0/1, external `$ref`, `additionalProperties` other than `false`. SDK helpers can move such constraints into descriptions and, for Zod/Pydantic, validate afterwards. — [Anthropic structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)
- Complexity limits: 20 strict tools per request; 24 optional parameters across all strict and JSON schemas; 16 parameters with union types (`anyOf` or type arrays); "Schema is too complex" errors possible; compilation timeout 180 s; compiled grammars cached for 24 hours; changing `output_config.format` invalidates the prompt cache. — [Anthropic structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)
- Behaviour caveats: `stop_reason: "refusal"` may return non-conforming output; `stop_reason: "max_tokens"` may return truncated output (retry with higher `max_tokens`); Claude may change enum capitalisation, so compare case-insensitively. — [Anthropic structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)
- Models listed as supporting structured outputs on that page include Claude Sonnet 5.5, Sonnet 5, Sonnet 4.6, Opus 5.5, Haiku 5.5 and others; the page's own example uses `claude-opus-5-5`. — [Anthropic structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)

**OpenAlex**
- A key is optional for basic queries; a free key is needed for higher volume and for cursor paging past the first page. Send it as an `api_key` query parameter or a Bearer `Authorization` header. Keys are free from an openalex.org account, or via an agent flow with an emailed activation link valid for 7 days. — [OpenAlex rate limits and auth](https://help.openalex.org/how-to-use-the-api/rate-limits-and-authentication)
- Rate limits (requests/second): no key 10; free key or prepaid 30; annual plan 50; semantic search 1; searches with more than 5 `OR`/`AND`/`NOT` operators 1 (no key), 5 (free key/prepaid), 25 (annual). A free key gives "10x the keyless budget"; a new free account spends its first $1 at up to $0.10 every 5 minutes, with pacing ending after about 50 minutes of steady use and not applying to accounts created before 3 November 2026. Cost per response is in the `X-RateLimit-Credits-Used` header; list responses include `meta.cost_usd`. Actual daily budget amounts weren't stated. — [OpenAlex rate limits and auth](https://help.openalex.org/how-to-use-the-api/rate-limits-and-authentication); [OpenAlex pricing overview](https://help.openalex.org/how-to-use-the-api/api-pricing)
- Pricing from the works-search page: searches $1 per 1,000 calls; list-and-filter $0.10 per 1,000; `rerank=true` adds $1 per 1,000. — [OpenAlex search works](https://help.openalex.org/api-entities/works/search-works)
- Search syntax: `search`, `search.title`, `search.title_and_abstract`, `search.title_abstract_keywords`, `.exact` forms, boolean operators, quoted phrases. — [OpenAlex search works](https://help.openalex.org/api-entities/works/search-works)
- Data licence: the pricing overview page says all data is released under CC0. — [OpenAlex pricing overview](https://help.openalex.org/how-to-use-the-api/api-pricing)
- The old `docs.openalex.org` URLs 301-redirect to `help.openalex.org`. — [OpenAlex docs redirect](https://docs.openalex.org/how-to-use-the-api/rate-limits-and-authentication)

**Crossref REST API**
- From 21 July 2026: single-record requests (e.g. one DOI) 5 req/s public, 10 req/s polite (unchanged); list requests (queries/filters) 1 req/s public, 3 req/s polite. Limits are applied per `mailto` email address (not just IP); generic shared addresses share a limit; 429 on limit; headers `x-rate-limit-limit`, `x-rate-limit-interval`, `x-rate-limit-type`. — [Crossref community post](https://community.crossref.org/t/refining-rest-api-limits-for-improved-stability-and-reliability/16137)
- The Crossref access documentation (last updated 2025-October-16) lists public 5 (concurrency 1), polite 10 (concurrency 3), Plus 150 (no concurrency limit) and says "we strongly recommend" a `mailto` parameter in all requests. This predates the July 2026 change and conflicts with it on list-request limits, so prefer the July 2026 post. — [Crossref access docs](https://www.crossref.org/documentation/retrieve-metadata/rest-api/access-and-authentication/)
- Plus is paid; data is the same across pools. Crossref's site content is CC BY 4.0; the access page does not state a licence for the metadata, so I could not confirm metadata licensing from it. — [Crossref access docs](https://www.crossref.org/documentation/retrieve-metadata/rest-api/access-and-authentication/); [Crossref rate-limit blog (Nov 2025)](https://crossref.org/blog/announcing-changes-to-rest-api-rate-limits/)

**Open Library**
- Non-identified requests 1 req/s; identified requests (with `User-Agent` naming the app plus a contact email or phone) 3 req/s. Do not bulk-download via the APIs; use the monthly dumps. The page names no data licence. — [Open Library developers API](https://openlibrary.org/developers/api)
- Search endpoint `https://openlibrary.org/search.json` with `q`, `fields`, `limit`, `page`, `offset`, `sort`, `lang`; `fields=*` is expensive; the sample document includes `key`, `title`, `author_name`, `first_publish_year`, `cover_i`, `edition_count`, `ia`; the schema "is not guaranteed to be stable". Sample: `search.json?q=harry%20potter&fields=*,availability&limit=1`. — [Open Library search API](https://openlibrary.org/dev/docs/api/search)

### Inferences

**Recommended architecture**
1. Context assembly (server): goal title/description, existing questions, existing reading items, learner constraints (weekly minutes, target date, prior knowledge). Keep prompt text and schema fixed to benefit from caching; vary only the user content.
2. Stage A, structure (Claude, JSON schema, no tools): returns flat arrays with draft-local IDs.
   - `modules[{id,title,summary,position}]`, `outcomes[{id,moduleId,statement,bloomLevel,estMinutes}]`, `prerequisites[{fromId,toId}]`, `questions[{text,outcomeId}]`, and `resourceIntents[{outcomeId,kind,searchQuery,authorHint,whyRelevant}]`.
   - Flat + ID references because recursion is unsupported; no numeric bounds in schema, so enforce limits (max modules, max outcomes, `estMinutes` range) in server-side Zod. Make fields required (nullable strings via `anyOf` count against the 16-union limit; prefer empty-string sentinels or required fields) to stay under the 24-optional and 16-union limits.
   - `enum` for `bloomLevel`/`kind`, compared case-insensitively after parse.
   - Never ask Claude to output DOIs, ISBNs or URLs as facts. Ask for search intents only.
3. Stage B, grounding (server code, optionally model-assisted): for each `resourceIntent`, query OpenAlex (`search.title_and_abstract` or `search.title`) and Crossref (query bibliographic) for papers, Open Library `search.json` for books. Score candidates by normalised title similarity and author overlap. Attach `verification: "matched" | "ambiguous" | "unmatched"`, the external ID (OpenAlex `W...`, DOI, Open Library `key`), and the raw returned metadata. Only `matched` items are promotable to `ReadingItem`; `unmatched` stay visible as "unverified suggestion (search query: ...)", never as a citation. An alternative to a two-step design is giving Claude `search_openalex`/`search_openlibrary` as tools (strict tool use is supported) in an agent loop, but the fixed two-stage pipeline is cheaper, deterministic and easier to rate-limit.
4. Stage C, validation (server): topological sort to reject cycles (drop or flag offending edges), check every `moduleId`/`outcomeId` reference resolves, dedupe against existing outcomes, cap sizes, sum `estMinutes` against the budget, and flag if projected finish is past `targetDate`.
5. Stage D, human in the loop: persist everything as a draft, show a diff-like review UI (accept / edit / reject per module, outcome, edge, question, resource; "accept all verified"). Accepted rows are copied into live tables with `source = AI` and `draftItemId`; rejected rows kept (hidden) so the same suggestion is not re-proposed on regeneration.
6. Provenance: record model ID, prompt version hash, schema version, timestamp, the user's input, per-resource verification status/external IDs, and who edited what. Supports "why is this here?" in the UI and later evaluation.

```prisma
model CurriculumDraft {
  id          String   @id @default(cuid())
  goalId      String
  createdAt   DateTime @default(now())
  model       String            // claude model id used
  promptVer   String
  inputJson   String            // learner inputs as sent
  rawJson     String            // validated model output
  status      String @default("PENDING") // PENDING|PARTIAL|APPLIED|DISCARDED
  items       DraftItem[]
}
model DraftItem {
  id        String @id @default(cuid())
  draftId   String
  kind      String   // MODULE|OUTCOME|EDGE|QUESTION|RESOURCE
  localId   String   // id inside the model output
  payload   String   // JSON, editable
  decision  String @default("PENDING") // ACCEPTED|EDITED|REJECTED
  verification String? // MATCHED|AMBIGUOUS|UNMATCHED for RESOURCE
  externalId  String?  // W123..., DOI, /works/OL...
  appliedId   String?  // id of the live row created
}
```

**API usage recommendations (client wrapper)**
- Identify yourself: Crossref `mailto` query parameter (a real address; limit is per email since 21 July 2026), Open Library `User-Agent: read2learn (you@example.org)`, OpenAlex a free key from env (not hard-coded) once volume justifies it.
- Throttle conservatively: list requests at or under 1 req/s to Crossref polite pool if you are not sure the 3/s applies, 1 req/s to Open Library unless identified, 10 req/s ceiling to OpenAlex keyless. A draft with ~20 resource intents needs ~20 to 40 calls, so a sequential queue with backoff on 429 is adequate.
- Cache results in a table keyed by (source, normalised query) with TTL, and store external IDs on `ReadingItem` (new columns `doi`, `openAlexId`, `olKey`) to dedupe. Crossref asks for caching as a best practice.
- Do not use Open Library APIs for bulk data; use dumps if you ever want local lookup.
- Treat results as unstable: Open Library says the search schema is not guaranteed stable, and OpenAlex/Crossref both changed terms within the last few months. Select only the fields you need and fail soft.
- Prompt design: system prompt states role, forbids invented bibliographic identifiers, requires verb-led outcomes with a Bloom level, asks for explicit prerequisite edges only where one outcome truly requires another, and asks the model to say when scope is too broad for the time budget. Provide the learner's weekly budget and have the model target total `estMinutes` within it. Keep temperature low; handle `refusal` and `max_tokens` stop reasons explicitly.

### Gaps
- Anthropic tool-use documentation (non-strict tool use, citations, web search tool, pricing/rate limits for the API, model alias recommendations) was not fetched; only the structured-outputs page was read. I did not verify whether the model ID `claude-sonnet-5-5` is the right choice for this task, or API costs.
- OpenAlex: actual free-key daily credit budget in dollars, current pricing page details (help.openalex.org/access/pricing/ not fetched), and how DOI filtering and field selection work (page didn't cover). The OpenAlex rate-limit page describes a very recent change (3 Nov 2026 reference); details may shift again.
- Crossref: concurrency limits after the July 2026 change are unspecified (post silent); metadata licence not confirmed from the access page; the July 2026 post and the November 2025 blog were not reconciled in the sources.
- Open Library: data licence not stated on the developer pages fetched; search page gives no rate limits (rate limits from the main developer page).
- No source retrieved on LLM citation-hallucination rates; the grounding design is an engineering inference, not a cited finding.
- Anthropic and OpenAlex pages were summarised by a fetch tool rather than read in full (the Anthropic page's last ~6,000 characters were not read).

---

## 5. Visualisation and UX patterns for curricula

### Takeaway
Keep the current dependency-free SVG approach for the existing concept graph, but for a prerequisite DAG use a layered layout (dagre-style left-to-right), either hand-rolled with a small dependency or via React Flow. For a roadmap, a vertical module list with expandable outcomes and per-module progress is the cheapest high-value view; add a time-budget bar/timeline and a prominent "next action" card.

### Cited Findings
- React Flow's layouting guide recommends dagre, d3-hierarchy, d3-force and elkjs. Dagre: dynamic node sizes yes, sub-flows yes (known issue when sub-flow nodes link outside it), no edge routing, "highly recommend dagre" for trees; d3-hierarchy: needs a single root and uniform node size; d3-force: physics-based, suits non-tree graphs, iterative so costlier on large graphs; elkjs: most configurable, async, no common recommendation due to complexity, with a package size ~1.46 MB versus ~40 kB for dagre (per the guide's pkg-size badges). — [React Flow layouting](https://reactflow.dev/learn/layouting/layouting)
- React Flow open-source project is MIT-licensed; Pro offers examples/templates and support, with Pro examples including libavoid edge routing and editable edges. — [React Flow layouting](https://reactflow.dev/learn/layouting/layouting)
- roadmap.sh models each roadmap node as a Markdown topic file keyed by node ID, and renders interactive clickable nodes. — [developer-roadmap](https://github.com/kamranahmedse/developer-roadmap)
- The existing concept graph in this repo is a dependency-free SVG with a deterministic ring layout, chosen to render identically server- and client-side. — read from `src/app/graph/concept-graph.tsx` in the repo
- KST's outer fringe is interpreted as what a learner is "ready to learn". — [arXiv 1511.06757](https://arxiv.org/pdf/1511.06757)

### Inferences
- Views, in descending value-for-effort:
  1. "Next up" card (outer-fringe query + first undone activity + minutes estimate). Server-rendered, no library.
  2. Roadmap/module list: modules in order, each with outcome rows (status chip, activity count, minutes remaining), a progress ratio, and a target date badge. Collapsible. Server-rendered.
  3. Time-budget strip: weekly capacity vs planned minutes per week as a simple stacked bar (hand-built SVG/CSS grid); label projected finish and on-track/behind. A Gantt-lite is a row per module spanning projected start/end weeks derived from cumulative minutes / weekly budget.
  4. Dependency graph: nodes = outcomes, edges = prerequisites, coloured by status; layered left-to-right layout (rank = longest path from sources). With <=100 nodes a hand-rolled layered layout (longest-path rank, order by module position) in the existing SVG component is feasible without new dependencies. If interactivity (pan/zoom/drag edges to create prerequisites) is wanted, React Flow + dagre is the lowest-risk route; elkjs only if edge routing becomes a problem. d3-force would give an organic look but is a poor fit for directed prerequisites, whereas the current concept graph (tags/goals) could still use it.
  5. Concept graph integration: add outcome nodes and `NoteOutcome`/`OutcomeLink` edges to `getConceptGraph`; keep tag/goal rings, add a toggle.
- visx and d3 give primitives (scales, shapes) rather than a node-editor; they fit charts (budget bars, burndown) better than editable graphs. Not researched beyond that; treat as general knowledge.
- Accessibility/no-JS: the repo has commit history around making actions work "without/before JS" (commit 2c58d9e, from git log), which favours server-rendered lists and forms for core flows, with graph interactivity as a progressive enhancement. React Flow requires client rendering.
- Burn-up chart or a simple "minutes done per week vs budget" sparkline from `Event` plus `Activity.actualMinutes` would support "am I on pace?" without more tables.

### Gaps
- No specifics retrieved on visx or d3 beyond React Flow's own comparison; React Flow bundle size and React 19 compatibility not verified (only its docs page was read). Check React Flow's current package (`@xyflow/react`) supports React 19.2 before adding it.
- No sources on UX research for "next action" surfaces in learning tools; the view list is design judgement.
- Dagre's maintenance status (the original package vs the maintained fork) was not checked.

---

## 6. Import/export: open formats for a goal-scoped exportable artefact

### Takeaway
Export a goal as one self-describing JSON document (primary, lossless, versioned) plus a human-readable Markdown rendering; offer CSL JSON/BibTeX for the bibliography and OPML for the outline as optional lossy views. Open Badges and CASE/CTDL export are possible but not worth building now. Note: I retrieved little primary documentation on these formats in this pass; most of this section is design inference.

### Cited Findings
- schema.org `Course`, `Syllabus`, `LearningResource`, with `teaches`, `competencyRequired`, `educationalAlignment`, `timeRequired` provide a ready vocabulary for a JSON-LD export. — [schema.org/LearningResource](https://schema.org/LearningResource)
- Open Badges 3.0 is a W3C VC 2.0-aligned credential format with proofs (JWT/Linked Data); Achievement and Criteria objects describe what was achieved. — [Open Badges 3.0](https://www.imsglobal.org/spec/ob/v3p0/)
- CTDL-ASN competency frameworks are published as JSON-LD with `hasChild`/`isChildOf`. — [skills-ml ontologies doc](https://workforce-data-initiative.github.io/skills-ml/ontologies)
- roadmap.sh keeps roadmap content as one Markdown file per topic keyed by node ID. — [developer-roadmap](https://github.com/kamranahmedse/developer-roadmap)
- OpenAlex data is CC0 and Open Library's monthly dumps are the sanctioned bulk path (relevant to what bibliographic metadata you may embed in exports). — [OpenAlex pricing overview](https://help.openalex.org/how-to-use-the-api/api-pricing); [Open Library developers API](https://openlibrary.org/developers/api)

### Inferences
- Suggested export bundle for a goal (versioned `schemaVersion`):
  - `goal.json`: `{schemaVersion, exportedAt, goal, modules, outcomes, outcomeLinks, activities, readingItems (with doi/openAlexId/olKey), questions, notes (with tags, location), reviewCards (optional, with card JSON), provenance}`. Use stable IDs (the existing cuids) so re-import can upsert; remap IDs on import to avoid collisions across users/databases.
  - `goal.md`: Markdown rendering: goal title/description, modules as `##`, outcomes as checklist items (`- [x]`), activities nested, questions, and notes grouped by reading item and location. Matches the existing note grouping by location (`groupNotesByLocation`, from repo file list).
  - `bibliography.json` (CSL JSON) and `bibliography.bib` (BibTeX): from reading items that have verified metadata. CSL JSON is the common interchange for Zotero/Pandoc; BibTeX for LaTeX users. For unverified items, emit minimal `title`/`author`/`type` entries.
  - `outline.opml`: nested `<outline>` for modules > outcomes > activities, for outliners/mind-mapping tools. Lossy (no prerequisite edges unless represented as attributes).
  - Optional `goal.jsonld`: schema.org `Course` with `hasPart` modules, `teaches` outcomes, `LearningResource` items with ISO-8601 `timeRequired` (for example `PT90M`).
- Import: accept the native JSON (full fidelity) and a Markdown/OPML outline (structure only, creating modules/outcomes). Parsing in a draft state, reusing the same accept/reject UI as AI drafts (section 4), keeps a single review path and avoids accidental overwrite. Validate with the same Zod schemas used for LLM output.
- Dedupe on import by external IDs (DOI, OpenAlex ID, Open Library key) before title matching.
- Open Badges export: only if a "completed goal" credential is wanted; unsigned/self-asserted would have little external trust value, and signing requires key management. Defer.
- CASE/CTDL: export only if interoperating with a skills registry; the association-table design in section 2 would allow a mapping later.
- Do not run the BibTeX/CSL field mapping from memory without testing against a converter (e.g. Pandoc/citation-js); I did not fetch the CSL or BibTeX specs.

### Gaps
- No primary sources fetched for OPML 2.0, CSL JSON schema, BibTeX field rules, or Pandoc/Zotero import behaviour; section content is design judgement and general knowledge.
- Open Library data licence and Crossref metadata licence for redistribution inside exports are unconfirmed (see section 4 gaps).
- Open Badges 3.0 self-assertion specifics unconfirmed.
- No survey of how other personal-learning tools handle export/import (not researched).
