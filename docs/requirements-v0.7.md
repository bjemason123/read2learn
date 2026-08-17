# Learning Path & Reading Curation Service — Requirements Statement

*Status: draft v0.7 — consolidated, pre-PRD. Technology and architecture agnostic.*
*Supersedes v0.6. Folds in (a) learner-led sequencing, (b) the segment-identification feasibility findings, (c) the built-in personal knowledge artefact.*

> **Note on status.** This remains a requirements statement rather than a PRD. It is now complete enough to convert: what a PRD would add is user journeys, screen-level behaviour, acceptance criteria per requirement, release scope with dates, and named owners. Say the word and I'll convert it.

---

## 1. What Changed in v0.7, and Why

| Change | Consequence |
|---|---|
| **The learner now orders their own reading.** The service does not impose a sequence. | Removes a capability that was only ever an inference without source text. But the evidence says self-directed learners plan and sequence *poorly*, so this is a hand-off of **control, not of cognitive load** — dependency warnings and an optional suggested order remain. |
| **Segment identification becomes the service's primary curatorial act.** | "Read these three chapters, not this book" is now the core value proposition for a time-poor adult. §9.5 is new and is the heart of the product. |
| **Segment claims must be corroborated, confidence-scored, and edition-bound.** | The feasibility research found the underlying data is real but uneven: ToC coverage in catalogue records rose to roughly 59% for books published 2005–08 but is far thinner historically; chapter numbers are routinely omitted from those records; syllabus data identifies *which books* are assigned but almost never *which chapters*; and citation-context section salience is fuzzy. Subtractive claims therefore need evidence, not confidence. |
| **A personal knowledge artefact is built into the service**, goal-scoped and finishable. | Reverses the v0.3–v0.6 non-goal. Scoped tightly: it is a by-product of the retrieval loop, not a parallel activity. |
| **Concept mapping adopted as the artefact's spine.** | It is the one PKM structure with a substantial evidence base — meta-analytic effects around g≈0.58 overall, with **constructing** maps (g≈0.72) clearly beating **studying** them (g≈0.43), and effects in science specifically at the moderate-to-large end. Zettelkasten, PARA, progressive summarisation and bidirectional linking have essentially no controlled learning-outcome evidence and are excluded. |
| **Hard limits placed on AI assistance within the artefact.** | Retrieval practice beat elaborative concept-mapping head-to-head in Karpicke & Blunt (2011) — and learners predicted the opposite. Evidence also indicates learning from AI syntheses produces shallower knowledge than active search, and that higher AI assistance lowers post-test scores *while learners prefer it*. The service must therefore withhold the help learners will ask for. |

---

## 2. Problem & Context

An adult improver with five or six hours a week faces four compounding problems.

1. **Volume without discrimination.** Nothing signals what is foundational versus peripheral, credible versus not, or pitched at their level.
2. **No sense of sufficiency.** They cannot tell what the minimum reading is, so they over-read and stall, or under-read and miss foundations.
3. **The backlog compounds.** Every good paper cites five more.
4. **No feedback loop, and no durable record.** They finish a chapter, feel they understood it, cannot test that feeling — and six months later have nothing to show for the hours.

There is no tutor, cohort or deadline to catch the fall.

**The proposition is subtraction, proof, and a record.** The service points at the specific parts of the learner's chosen sources that serve their goal, uses retrieval practice to prove whether the learning happened, and leaves behind a knowledge artefact that makes later refresh cheap.

---

## 3. Target User

**The adult improver.** An adult learning a science subject outside any institution, with limited and fragmented time and no external structure.

- **Time-poor, not motivation-poor.** They will do effortful work; they will not do wasted work.
- **Fragmented sessions.** 20–40 minutes, often days apart.
- **High cost of a false start.** Three wasted weeks and they don't come back.
- **Uneven prior knowledge.** Strong in one area, absent in an adjacent one, or decades stale.
- **No tolerance for admin.** This now governs the knowledge artefact as much as anything else.
- **Will ask for the assistance that harms them.** The evidence on AI assistance is consistent on this point, and the product must be designed to decline gracefully.

**Not the target user in v1:** full-time students, learners inside a formal curriculum, frontier researchers, browsers with no specific goal.

---

## 4. Subject Scope — Science First

v1 supports **science subjects only**. Humanities, history and politics deferred pending v1 evidence.

Science suits the constraints because so much can be known about a source without reading it — bibliographic infrastructure (Crossref, OpenAlex, arXiv, PubMed Central, DOAJ, Unpaywall, open citation data), citation structure, and a dense educational web. Concept mapping's evidence base is also strongest in science.

That web coverage thins sharply at advanced levels, which remains the central limitation (§7).

| ID | Requirement |
|---|---|
| FR-35 | The service must define and publish its supported subject scope, and recognise when a goal falls outside it. |
| FR-36 | Out-of-scope goals are declined honestly with an option to register interest, not served with a degraded plan. |
| FR-37 | The service must be instrumented to answer whether expansion beyond science is justified, and against what threshold. |

---

## 5. Product Concept

### The core loop

| Stage | What happens |
|---|---|
| **1. Frame** | Goal interrogated into something specific and testable; prior knowledge and time budget established |
| **2. Discover** | Service researches and proposes candidate material; the learner may also supply their own |
| **3. Triage** | Candidates assessed against goal and time budget; most are deferred |
| **4. Locate** | For each admitted source, the service identifies **which parts** serve the goal — its primary curatorial act |
| **5. Order** | **The learner** sequences their own reading, with dependency warnings and an optional suggested order |
| **6. Read & Recall** | Learner works a segment, then recalls and explains it **from memory**. The recall becomes the atomic note |
| **7. Map & Space** | The learner grows a concept map from those recalls; earlier material resurfaces on a spaced schedule |
| **8. Adapt** | Retrieval performance drives re-scoping, chunking, substitution, or promotion from the backlog |

Stage 4 is the differentiator. Stage 6 is the spine. Stage 7 is what remains when the goal is done.

### Design principles

1. **Subtract before adding.** The service applies deferral discipline to its own recommendations as much as the learner's.
2. **Never fabricate a source.** An unverifiable recommendation does not exist.
3. **Never claim to have read what it has not read.** Every output is reasoned from descriptions.
4. **Never make a subtractive claim without corroboration.** Telling someone to skip something is a stronger act than telling them to read it, and needs more evidence.
5. **Never let the learner carry the service's uncertainty.**
6. **The learner does the generative work.** Recalls, explanations, concept maps and questions are authored by the learner. The service verifies, prompts, schedules and formats — it does not generate the learner's understanding for them.
7. **Preserve the effort that produces learning**, and fade support as competence grows.
8. **Trust performance over feeling.**
9. **Respect the hour.** Anything that consumes reading time without producing learning is a defect.

---

## 6. Access & Grounding

### 6.1 Item status and learner access

| Status | Meaning |
|---|---|
| **Resolved** | Confirmed to exist, with identifier, **edition**, metadata and access route established |
| **Unresolvable** | Cannot be confirmed to exist. Held and marked; never enriched with plausible detail, never recommended |

### 6.2 What the service reasons from

The service holds no source text. All outputs derive from:

| Rank | Grounding source | Primary use |
|---|---|---|
| **1** | The learner's own notes and recalls | Segment-level questions; inconsistency detection; the knowledge artefact |
| **2** | Credible public web material about the topic and source | Topic-level questions, spaced review, segment identification, theme candidates |
| **3** | Item metadata, table of contents, structural information and citation relationships | Segment identification, sequencing advice, reading-time estimation, coverage-gap detection |

| ID | Requirement |
|---|---|
| FR-68 | Every item is classified as resolved or unresolvable, with edition, access route and cost recorded where resolved. |
| FR-69 | The service must never assert or imply knowledge of a source's contents. It has read none of them. |
| FR-70 | The grounding for every substantive output must be recorded and inspectable. |
| FR-71 | Where the service's knowledge of an item is thin, that must be visible rather than concealed behind uniform presentation. |
| FR-74 | The service may generate assessment questions from publicly available web material on the topic and source. |
| FR-75 | Web grounding is constrained to credible source types — university and course material, open textbooks, established encyclopaedic references, peer-reviewed and preprint literature, recognised professional and scientific bodies. Content farms, undifferentiated blog content and unattributed AI-generated summaries are excluded. |
| FR-76 | Every generated question retains a traceable link to the material it derives from, inspectable by the learner. |
| FR-77 | Where web coverage is thin or conflicting, the service degrades to note-grounded and coverage-gap questions rather than generating confident questions from weak grounding. |
| FR-86 | The service must never present itself as having read the material, in wording, tone or interface. |
| FR-87 | Before a learner commits reading time to an item, the service must disclose the basis on which it is recommending and can support it. |
| FR-89 | **New.** Data sources must be used within their licences. Open and CC0 sources (Open Library, OpenAlex, Crossref, PubMed Central, arXiv, DOAJ, Unpaywall) form the backbone. Sources that display structural data to humans without granting reuse rights must not be ingested. Commercial metadata feeds require confirmed rights per feed. |

---

## 7. The Grounding Risk

**The risk.** Web material describes the *topic*, not the *specific pages the learner read*. A question or segment claim may reflect content the source does not contain. The learner fails a question about material they were never given — and cannot tell whether they misunderstood or the service did.

**Why it matters here.** A time-poor adult has no tutor to appeal to and no cohort to sanity-check against. Unexplained failure is read as personal failure, and personal failure precedes abandonment.

| ID | Requirement |
|---|---|
| FR-78 | Every question must offer a one-tap **"this wasn't in what I read"** response. The question is set aside without counting against the learner, and the event is recorded. |
| FR-79 | Questions must be **labelled by scope** — specific segment or broader topic. |
| FR-80 | Web-grounded questions must be scoped to the item using its abstract, table of contents or structural metadata. |
| FR-81 | **Mismatch rate** is a first-class product metric and the primary instrument for evaluating the grounding approach. |
| FR-82 | A defined mismatch threshold must trigger review for that subject or level, including reverting to note-grounded questions only. Set before launch. |
| FR-83 | Where a question is disputed, the service must not defend it. Deference to the learner's account of what they read is the default. |
| FR-88 | Learners must be able to correct the service's understanding of what a source covers, and corrections persist for that item. |

---

## 8. Goals & Non-Goals

### Goals

| # | Goal |
|---|---|
| G1 | Convert a loose ambition into a specific, testable goal calibrated to prior knowledge and time |
| G2 | Identify the **minimum sufficient parts** of chosen sources that serve the goal |
| G3 | Make every reading hour count, through retrieval and spacing rather than volume |
| G4 | Give the learner evidence of progress, not a feeling of it |
| G5 | Detect struggle and change the plan rather than demand more willpower |
| G6 | Absorb what the learner discovers without letting it derail the goal |
| G7 | Leave behind a durable knowledge artefact that makes later refresh cheap |
| G8 | Fit fragmented, unpredictable adult time |

### Non-Goals

- **Processing the text of reading material, for any purpose.**
- **Imposing a reading sequence.** The learner orders their own reading.
- **Being a lifelong, general-purpose second brain.** The artefact is goal-scoped and finishable. *(Amended: v0.3–v0.6 excluded PKM entirely; only the unbounded lifelong form is now excluded.)*
- **Hosting, serving or reading the content**; acquiring or paying for material.
- **Generating the learner's understanding for them** — no AI-written summaries, concept maps, or answers to retrieval items.
- **Subjects outside science.**
- **Social features**, formal accreditation, courses/video/podcasts as first-class types.
- **Teaching the subject directly**, or adjudicating whether a learner's understanding of a source is factually correct.
- **Any claim of measured learning-outcome improvement** until the service has its own evidence.
- **"Learning styles" personalisation.**

---

## 9. Functional Requirements

### 9.1 Goal Framing & Calibration

| ID | Requirement |
|---|---|
| FR-1 | A learner can state a learning goal in their own words, however vague. `[R2]` |
| FR-2 | The service interrogates the goal until it is specific enough to plan against. `[R2]` |
| FR-3 | Goal framing captures subject scope, **time budget per week and total**, any deadline, and purpose. |
| FR-4 | The service records what "achieved" looks like in terms the learner recognises. |
| FR-5 | Multiple concurrent goals permitted but actively discouraged, with the elapsed-time cost made explicit. |
| FR-6 | A goal can be revised at any point; the service reconciles existing work rather than discarding progress. |
| FR-38 | Prior knowledge is assessed at intake rather than taken purely on self-report. |
| FR-39 | Goal framing favours mastery framing and specific sub-goals. |
| FR-54 | A learner can define sub-goals or sub-themes beneath a goal. `[R7]` |

### 9.2 Discovery, Verification & Recommendation

| ID | Requirement |
|---|---|
| FR-7 | The service researches and proposes science reading material to meet a stated goal. `[R1, R3]` |
| FR-8 | **Critical.** Every recommended item must be resolved and verified against an authoritative bibliographic source before it is shown. Unverifiable items are discarded, not caveated. |
| FR-40 | Verification confirms existence, identifier resolution, and correct authorship, venue, edition and date. The service must never invent metadata. |
| FR-9 | Each recommendation carries a rationale, and the basis for it. |
| FR-10 | Each item carries estimated reading time, assumed prior knowledge, and access route and cost. |
| FR-41 | The service prefers accessible material and must not build a plan around material the learner cannot obtain or afford. |
| FR-42 | Where an open-access version of a paywalled item exists, the service surfaces it. |
| FR-11 | The learner can accept, reject or replace any recommendation; rejection is a usable signal. |
| FR-43 | The service declines to recommend where it lacks confidence rather than guessing. |

### 9.3 Learner Supply & Capture

| ID | Requirement |
|---|---|
| FR-12 | The learner can add their own material alongside recommended items. |
| FR-55 | Material can be added by identifier, citation, title, URL or free text, with low enough friction to do mid-session. |
| FR-56 | While reading, the learner can capture a **forward reference** in seconds without interrupting the session. |
| FR-57 | Captured forward references enter a **backlog**; they are not automatically admitted. |
| FR-58 | The learner can capture emergent sub-themes and notes against a segment, item, sub-goal or goal. `[R7]` |
| FR-72 | Learner-supplied references are resolved on the same basis as recommended ones. Provenance is retained. |

### 9.4 Triage & Prioritisation

| ID | Requirement |
|---|---|
| FR-59 | The service assesses candidates from both channels for relevance to the goal and can recommend deferral or exclusion. |
| FR-60 | The service shows the **time cost** of the backlog against the declared budget. |
| FR-61 | The service can prompt about a previously captured or deferred item when it becomes relevant. |
| FR-62 | Deferral is a first-class, guilt-free action, distinct from deletion. |
| FR-45 | The service produces the **minimum sufficient** set of material and justifies every inclusion against the goal. |
| FR-90 | **New.** The service must guard against the collector's fallacy — accumulation that feels like progress but produces no learning. Capture volume without corresponding retrieval activity should be surfaced to the learner, not rewarded. |

### 9.5 Segment Identification *(new — the core curatorial function)*

*Establishing which parts of a source serve the learner's goal, without reading it.*

| ID | Requirement |
|---|---|
| FR-91 | The service must identify candidate segments of a source that serve the learner's goal, and say why. |
| FR-92 | **Segments must be identified by chapter or section identity, never by page range.** Page numbering varies by format and printing, and e-book pagination is device-dependent. |
| FR-93 | **Every segment claim must be bound to a specific edition**, captured at resolution. Where the learner holds a different edition, the service must warn rather than silently mis-map — chapters are routinely added, removed and renumbered between editions. |
| FR-94 | Each segment claim carries a **confidence score and its supporting signals**, drawn from: table-of-contents semantics against the goal; syllabus and course-assignment evidence; citation-context evidence of which sections are used; credible human reading guidance; and the learner's own stated sub-themes. |
| FR-95 | **A subtractive claim — advising the learner to skip material — requires at least two independent corroborating signals.** A single signal may support a positive recommendation ("this chapter looks central") but not an exclusion. |
| FR-96 | The service must issue **dependency warnings** where a recommended segment appears to assume earlier material. Omitting a prerequisite is the most damaging failure this feature can produce. |
| FR-97 | Where signals are insufficient, the service must **degrade gracefully** — presenting the structure it has plus generic strategic-reading guidance (for papers, a staged approach beginning with title, abstract, headings and conclusions before deeper passes) — rather than fabricating specificity. |
| FR-98 | The service must **tell the learner when it cannot make a subtractive claim** about an item, rather than presenting thin coverage as if it were confident guidance. |
| FR-99 | For research papers, the service should use section structure (available for open-access literature and inferable more widely) to give goal-conditional guidance on which sections matter. |
| FR-100 | The learner can correct or override any segment claim, and corrections persist for that item and edition (extends FR-88). |

> **Expected coverage.** Plan for two tiers of experience: corroborated, goal-conditional segment maps for well-covered items — recent and scholarly-press books with populated tables of contents, canonical texts with syllabus and guidance coverage, and open-access papers — and honest structure-plus-generic-strategy guidance for the long tail. Presenting the second tier as if it were the first is the failure mode to design against.

### 9.6 Learner-Led Sequencing

*The learner owns the order. The service reduces the cognitive load of choosing it.*

| ID | Status | Requirement |
|---|---|---|
| FR-13 | **Amended** | **The learner determines the order of their own reading.** The service does not impose or auto-apply a sequence. `[R4 reinterpreted]` |
| FR-101 | New | The service must offer a **suggested default order** on request, with its reasoning and confidence shown. Evidence indicates self-directed learners sequence poorly, so a bare hand-off with no support is a known failure point. |
| FR-102 | New | Dependency warnings (FR-96) must surface at the point of ordering, not only at recommendation. |
| FR-15 | Amended | The learner reorders freely; the service flags — never blocks — apparent dependency breaks. |
| FR-44 | — | Each segment is sized to a single realistic session; the plan shows elapsed-time-to-goal against the budget. |
| FR-46 | — | Where the goal cannot be met within the time budget, the service says so and offers a narrowed goal. |

### 9.7 Reading List & Session Management

| ID | Requirement |
|---|---|
| FR-17 | The learner views and maintains their list across platforms with consistent state. `[R5]` |
| FR-18 | Progress recorded per segment: not started, in progress, completed, abandoned. |
| FR-19 | The **single next action** is unambiguous and reachable in under a minute after days away. |
| FR-47 | Short sessions are the design default. |

### 9.8 Retrieval, Notes & Spacing

*The spine.*

| ID | Requirement |
|---|---|
| FR-20 | After a segment, the learner is prompted to **recall and explain it from memory** before reviewing the source. `[R6]` |
| FR-103 | **New.** The recall **is** the note. Persisted from-memory explanations form the atomic units of the knowledge artefact. There must be no separate note-capture workflow competing for the learner's hours. |
| FR-21 | Notes and recalls are retrievable and reviewable independently of the source item. |
| FR-31 | Questions test understanding against the goal, grounded per §6.2. `[R10]` |
| FR-104 | **New.** Retrieval items attached to notes must be **authored by the learner** — the learner writes the answer. The service may assist with format, cloze selection and scheduling, never with the answer. |
| FR-64 | Generated questions must be traceable to the note, recall, abstract or web source they derive from. |
| FR-65 | The service can identify **coverage gaps** and question those. |
| FR-66 | The service can identify **internal inconsistency** across a learner's notes and surface it for resolution. |
| FR-84 | Where a learner's recorded understanding diverges from credible web material, the service surfaces it **as a prompt to check, not a correction.** |
| FR-34 | Assessment distinguishes recall from comprehension and application. |
| FR-49 | Previously covered material resurfaces on a **spaced schedule**. |
| FR-105 | **New.** Passive resurfacing of saved highlights or excerpts must not be presented as review. Re-exposure is not retrieval, and rereading is among the least effective study techniques. |
| FR-50 | Confidence judgments, where collected, are elicited after a delay. |
| FR-51 | Where self-assessed understanding diverges from measured retrieval, the service surfaces the gap constructively. |

### 9.9 The Knowledge Artefact *(new — goal-scoped PKM)*

*Both a working aid during learning and a durable record afterwards. Built from what the learner already does.*

| ID | Requirement |
|---|---|
| FR-106 | The artefact is **scoped to a learning goal** and reaches a finished state. It is not an unbounded lifelong system. |
| FR-107 | The artefact must be assembled from by-products of the learning loop — recalls, retrieval items, corrected segment claims, captured sub-themes — and must not require a separate maintenance activity. Maintenance overhead is the dominant cause of these systems being abandoned. |
| FR-108 | The learner builds a **concept map** of the domain as the artefact's structural spine, growing it as the goal progresses. |
| FR-109 | **The learner constructs the map.** The service may propose candidate nodes and links for the learner to accept, edit or reject, but must not generate the map. Constructing maps produces materially larger learning gains than studying pre-made ones. |
| FR-110 | Where practical, the learner should be prompted to extend the map **from memory**, with sources closed — uniting the concept-mapping and retrieval-practice evidence rather than trading one against the other. |
| FR-111 | The artefact must include an **offloadable reference layer**: verified bibliographic metadata, segment claims, and why each source mattered. This is the material it is appropriate to externalise, as against the conceptual understanding the learner should internalise. |
| FR-112 | A completed artefact must contain, at minimum: the interrogated goal and its completion condition; the learner's concept map; the segment map of which parts of which sources mattered and why; the learner's from-memory explanations; the retrieval item set with its performance and decay history; and the annotated reference layer. |
| FR-113 | The artefact must be exportable in full and in an open format. |
| FR-114 | **Later phase.** A **refresh mode** should use the recorded decay history to re-activate a completed goal cheaply, exploiting the fact that relearning is substantially faster than first learning. |
| FR-115 | **Prohibitions.** The service must not generate summaries of the learner's material, construct the concept map for them, or author answers to retrieval items. Learning from AI syntheses produces shallower knowledge than active engagement, and higher automation lowers learning outcomes even as learners prefer it. Where the learner requests such help, the service should explain briefly why it declines and offer a scaffolded alternative. |

### 9.10 Diagnosis & Adaptation

| ID | Requirement |
|---|---|
| FR-25 | Struggle is identified **primarily from measured retrieval performance** rather than self-report. `[R8]` |
| FR-26 | Signals, in rough order of reliability: retrieval performance and trend; decay on spaced review; stalling and elapsed time; repeated revisits; abandonment; explicit self-report. |
| FR-85 | Questions disputed under FR-78 are excluded from struggle inference. A mismatch is a service failure, not learner difficulty. |
| FR-52 | The service attempts to identify the **upstream cause** — the missing prerequisite — rather than treating only the item where failure surfaced. |
| FR-27 | Proposed changes may include substituting a source, revising segment claims, proposing newly researched prerequisite material, or promoting from the backlog. `[R8]` |
| FR-67 | Where a gap cannot be filled from existing material, the service may research and propose material to fill it, subject to FR-8 and FR-41. |
| FR-28 | The learner can declare they are stuck without waiting for detection. `[R9]` |
| FR-29 | The service can decompose a goal into smaller chunks with intermediate milestones. `[R9]` |
| FR-33 | Assessment results drive re-scoping, not merely a score. `[R10]` |
| FR-30 | All adaptations are proposals; the learner retains final control. |
| FR-53 | Support **fades** as competence grows. |

### 9.11 Themes

| ID | Requirement |
|---|---|
| FR-22 | The service surfaces candidate themes from abstracts, metadata, credible web material and learner-captured sub-themes — never from source text. Themes are candidates for the learner's concept map, not an independent output. `[R7]` |
| FR-23 | The service surfaces connections between the learner's notes across items. Claims of disagreement between sources must be grounded in web material characterising that disagreement. |
| FR-24 | Adjacent themes can be surfaced as candidate future goals. |

---

## 10. Key Entities

| Entity | Description |
|---|---|
| **Learner** | Prior knowledge, time budget, access rights, preferences |
| **Learning Goal** | Desired achievement with an explicit completion condition |
| **Reading Item** | A resolved source with identifier, **edition**, metadata, access route, cost and provenance |
| **Segment** | A chapter or section of an Item, with a segment claim |
| **Segment Claim** | The assertion that a Segment does or does not serve the Goal, with confidence, supporting signals and dependency warnings |
| **Backlog** | Candidate items not yet admitted |
| **Recall** | A learner's from-memory explanation — the atomic note |
| **Retrieval Item** | A learner-authored question or cloze, with schedule and performance history |
| **Concept Map** | The learner-constructed structural spine of the artefact |
| **Knowledge Artefact** | The goal-scoped, finishable body of work: map, recalls, retrieval items, segment map, reference layer |
| **Sub-theme** | A strand beneath a goal, learner-captured or service-suggested |
| **Grounding Reference** | The specific source an output derives from |
| **Signal** | Observed evidence of progress, struggle or decay |

---

## 11. Non-Functional Requirements

- **Verifiability** — every recommendation traces to a real, resolvable source. Highest-priority quality attribute.
- **Groundedness** — no claim asserted beyond what its grounding supports; grounding always inspectable.
- **Capture latency** — capture must be near-instant; friction above a few seconds destroys consistency.
- **Time-to-resume** — the next action reachable in seconds after days away.
- **Artefact overhead** — time spent on the artefact must remain a small fraction of time spent reading and recalling. This is a measurable, enforceable constraint, not an aspiration.
- **Cross-platform consistency** and **offline** use for list, notes, capture and pending reviews.
- **Privacy** — notes and recalls are private, unguarded reflection including records of failure.
- **Data portability** — full export in open formats.
- **Auditability** — grounding provenance retained for substantive outputs.
- **Accessibility** — WCAG 2.2 AA target.
- **Graceful degradation** — if recommendation or web grounding is unavailable, list, capture, recall and note-grounded review remain usable.

---

## 12. Constraints & Assumptions

**Legal**
- No text-and-data-mining question arises; the service processes no source text.
- Web and metadata sources used within their terms, respecting access controls and robots directives, without reproducing substantial portions. Open and CC0 sources form the backbone (FR-89).

**Practical**
- The service has read none of the material it recommends or tests.
- Table-of-contents and structural metadata coverage is uneven — better for recent and scholarly-press titles, thin in the long tail — and catalogue records frequently omit chapter numbers.
- Syllabus data identifies which *books* are assigned far more reliably than which *chapters*.
- Web coverage of science topics thins at advanced levels.
- Learners will not tolerate manual upkeep.

**Evidence-based**
- Retrieval practice and spacing carry the learning; summarising, highlighting and rereading are low-utility.
- Constructing concept maps beats studying them; learner-generated material is better retained than received material.
- Learners' judgments of their own understanding are unreliable, and they systematically prefer less effortful methods that produce worse outcomes.
- Externalising knowledge shifts what is remembered toward *where to find it* — appropriate for references, inappropriate for core concepts.
- Free alternatives already exist; the product must beat the hand-assembled combination.

---

## 13. Measurement Plan

What v1 must instrument to know whether the design works.

| Area | Measure | Why |
|---|---|---|
| **Segment claims** | Precision and recall against expert annotation, on a seeded set of goal × item pairs across several subfields, split by well-covered and long-tail items | The core capability; no external benchmark exists, so ground truth must be built |
| **Segment safety** | False-skip rate; dependency-omission rate | The asymmetric harms — a wrong "skip" costs more than a wrong "read" |
| **Segment coverage** | % of real items receiving a corroborated (two-signal) claim versus structure-only fallback | Determines whether the value proposition holds in practice |
| **Edition integrity** | Edition-mismatch incidence in live use | A silent failure mode |
| **Grounding** | Mismatch rate (FR-81) by subject and level; correlation with abandonment | The central bet of the no-full-text design |
| **Artefact overhead** | Artefact time ÷ reading-and-recall time, per session | Detects the artefact cannibalising the scarce hours |
| **Artefact value** | Retention on delayed assessment for high- versus low-artefact users; post-goal return rate and time-to-refresh | Tests whether the artefact earns its place |
| **Authoring** | % of retrieval items self-authored; retention difference versus assisted items | Tests whether the human-authoring constraint should be relaxed to reduce friction |
| **Sequencing** | Outcomes for learners who take the suggested order versus those who don't | Tests whether the hand-off needs more scaffolding |

---

## 14. Highest-Risk Assumptions

1. **That segment claims can be made accurately and safely enough to justify subtraction.** The data is real but uneven, and the "which chapters matter" signal is the thinnest link in the chain. Validate against expert annotation before shipping any "skip this" language.
2. **That web material is a good enough proxy for source content.** Expect it to hold at introductory level and degrade with depth.
3. **That the artefact adds retention without stealing retrieval time.** If artefact time displaces recall time with no retention gain, cut it back to the reference layer.
4. **That learners will author their own retrieval items** rather than demand generation. The pull toward pre-made material is strong and well documented.
5. **That a time-poor adult will do effortful retrieval at all** rather than just wanting an organised list.
6. **That learner-led sequencing works with light scaffolding**, given the evidence that self-directed learners sequence poorly.
7. **That triage is trusted** — the service must persuade a learner *not* to read something it recommended.

**First test, before significant build.** Take three or four real science goals at different levels. Produce segment claims against specific books and papers, and generate the web-grounded questions that go with them. Have someone who has actually read those sources mark (a) how many recommended segments genuinely serve the goal, (b) how many essential segments were missed, and (c) how many questions test content the source never covers. That single exercise resolves Assumptions 1 and 2 for the cost of an afternoon, and would change the shape of the product if it fails.

---

## 15. Suggested Phasing

**v1 — prove segment identification and the retrieval loop, in science.**
Goal framing (FR-1 to FR-6, FR-38, FR-39, FR-54); discovery and verification (FR-7 to FR-11, FR-40 to FR-43); supply and capture (FR-12, FR-55 to FR-58, FR-72); grounding, honesty and licensing (FR-68 to FR-71, FR-74 to FR-77, FR-86, FR-87, FR-89); grounding safeguards (FR-78 to FR-83, FR-85, FR-88); triage (FR-45, FR-59 to FR-62, FR-90); **segment identification (FR-91 to FR-100)**; learner-led sequencing (FR-13, FR-15, FR-44, FR-46, FR-101, FR-102); list and sessions (FR-17 to FR-19, FR-47); retrieval and notes (FR-20, FR-21, FR-31, FR-34, FR-49 to FR-51, FR-64, FR-103 to FR-105); manual stuck-request and chunking (FR-28, FR-29); subject gating (FR-35 to FR-37).

**v2 — the artefact and the adaptive loop.**
Knowledge artefact (FR-106 to FR-113, FR-115); performance-driven diagnosis (FR-25 to FR-27, FR-33, FR-52, FR-67); coverage-gap, inconsistency and divergence prompting (FR-65, FR-66, FR-84); fading support (FR-53).

*Note on ordering:* the artefact is deliberately placed in v2. It depends on there being recalls to build from, and its value is unproven relative to the retrieval loop it must not displace. Concept mapping could be pulled into v1 as a limited experiment if the measurement plan is in place.

**v3 — depth and breadth.**
Refresh mode (FR-114); themes (FR-22 to FR-24); import; expansion beyond science if evidence supports it.

---

## 16. Traceability to Original Requirements

| Original | Status | Covered by |
|---|---|---|
| R1 — curate a sequence of reading | Reinterpreted | FR-7, FR-45, FR-91 to FR-100 — curation is now *within* sources, not across them |
| R2 — specify learning goals, with clarifying questions | Intact | FR-1 to FR-4, FR-38, FR-39 |
| R3 — suggest/research reading material | Intact | FR-7 to FR-11, FR-40 to FR-43 |
| R4 — suggest sequence | **Handed to the learner** | FR-13, FR-15, FR-101, FR-102 — suggestion on request only |
| R5 — cross-platform UI for reading list | Intact | FR-17 to FR-19, FR-47 |
| R6 — notes on what they learned | Reframed | FR-20, FR-103 — the recall is the note |
| R7 — related themes in the material | Constrained, absorbed | FR-22 to FR-24, FR-54, FR-58, FR-108 — themes feed the learner's concept map |
| R8 — identify struggle, suggest changes | Reframed | FR-25 to FR-27, FR-52, FR-67, FR-85 |
| R9 — break into smaller chunks when stuck | Intact | FR-28, FR-29 |
| R10 — questions to test and optimise the plan | Reframed, promoted | FR-31, FR-33, FR-34, FR-49, FR-64 to FR-66, FR-74 to FR-84, FR-104 |
| *(new)* | — | FR-106 to FR-115 — the durable knowledge artefact |
