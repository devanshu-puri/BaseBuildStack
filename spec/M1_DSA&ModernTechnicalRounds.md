Build Module I using the foundation and UI_SPEC. Three modes behind one home
screen styled like a category list with progress counts (0/N) and a vertical
stepper per category.

MODE A, PATTERN BLITZ (30–45s/card)
- Card: problem title + constraints -> user taps the governing pattern
  (MCQ) -> "missing invariant" line fill (select from options) -> one-tap
  reveal of 6-line language-agnostic pseudocode + time/space chips.
- Seed 60 problems as JSON (id, title, pattern, invariant, distractors,
  pseudocode, complexity, edgeCases). Schema validated.
- Spaced repetition (SM-2 style) deterministic scheduler; "saved for revision".

MODE B, BUG AUDIT (60–90s)
- 12–20 line snippet in CodeBlock. Stage A: tap the buggy line. Stage B: pick
  the breaking input from options. 5-part feedback (verdict, why, distractor
  takedown, takeaway).
- Bugs come from a curated bank of canonical solutions + 50 bug templates.
  AI-assisted injection is Phase 2; MVP uses deterministic templates.
  Validate injected bugs by executing both versions in a sandboxed test
  harness before serving.

MODE C, OPEN-ENDED DRILL (2–3 min)
- Vague scenario -> Phase 1 constraint estimates -> Phase 2 map components to
  primitives -> Phase 3 interviewer pushback. Branching is a data-defined
  decision tree. LLM only grades free-text defence against a rubric
  returning {score, feedback} JSON; MCQ path works with no LLM.

SHARED: visualizer-style player where relevant (step scrubber, Explain/Code
/Predict tabs). Mark done -> XP, milestones ("First steps", "Collector").
ACCEPTANCE: each mode fully playable end-to-end without LLM; LLM adds grading
and variety only. Progress, mistakes and bookmarks persist.
OUT OF SCOPE: multi-file repo comprehension (Phase 2 of this module).