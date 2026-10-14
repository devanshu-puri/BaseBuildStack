Build Module IV with the "Mind Sprint" daily challenge as the entry point.

MIND SPRINT (5 min): pattern recognition 45s, logical deduction 60s, memory
45s, numerical 60s, tricky problem 90s. Countdown timer per item, skip
allowed, daily streak, one attempt per day counts for streak.

SIX CATEGORIES: Logical Reasoning (interactive deduction grid), Patterns &
Sequences, Attention to Detail, Memory Challenges (show -> hide -> recall,
with distractor-task variant), Lateral Thinking, Numerical (Fermi slider
estimation scored by order-of-magnitude error).

GENERATION (important): the LLM may propose puzzles, but correctness is
verified in code. Logic grids: generate with a deterministic constraint
solver that guarantees exactly one solution; LLM only writes the
theme/clue wording. Reject any puzzle where solver count != 1. Sequences
and numerical items come from parameterized generators with computed answers.
Pre-generate and cache; never serve unverified puzzles.

SOCRATIC HINTS: "I'm stuck" sends the current grid state to the LLM, which
returns a guiding question, never the answer. Add an output check that
rejects hints leaking the solution.

METACOGNITION: before reveal, user picks Guessing / Unsure / 100% Certain.
Compute overconfidence and underconfidence per category, with a minimum of
10 samples before showing a conclusion. Dashboard shows heatmap plus one
plain-language insight.
ACCEPTANCE: 30 consecutive generated logic puzzles verified single-solution;
Mind Sprint completes offline-tolerant (state kept locally, synced after).