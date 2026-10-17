# DSA Blitz --- AI-Guided Approach Discovery & Optimization System

## 1. Product vision

DSA Blitz is an adaptive DSA learning experience that teaches users how
to choose an algorithm, understand why it works, identify
misconceptions, and progressively optimize time and space complexity.

It is more than a question bank or a platform that checks whether code
passes. Its core purpose is to help users understand their own
problem-solving decisions.

The experience should help users answer five questions:

1.  Why did I choose this approach?
2.  Is the approach correct for every valid input?
3.  If it is wrong, what assumption or reasoning failed?
4.  If it is correct, can it be improved?
5.  What general pattern can I remember and reuse in another problem?

**Core principle:** Teach the reasoning behind a decision, not just the
answer.

The product should be concise and revision-friendly by default. Give
users a short, useful explanation first, with deeper details available
when needed.

------------------------------------------------------------------------

## 2. Learning philosophy

DSA Blitz should help users:

-   **Understand their thinking:** Infer the likely reasoning behind an
    answer and explain it as a hypothesis, not as certainty.
-   **Validate correctness:** Determine whether an approach actually
    solves the problem, rather than whether it matches a preferred
    answer.
-   **Understand efficiency:** Evaluate time complexity and
    auxiliary-space complexity separately.
-   **Discover alternatives:** Learn how a different data structure or
    algorithm changes the solution.
-   **Understand trade-offs:** Recognize when faster execution requires
    more memory, or when saving memory means accepting slower execution.
-   **Recognize patterns:** Retain general lessons that can be applied
    to future problems.

A valid but inefficient solution must not be labelled incorrect.
Correctness and efficiency are different dimensions.

------------------------------------------------------------------------

## 3. Complete user journey

The main learning flow is:

1.  Present a DSA problem.
2.  Ask the user to choose an approach.
3.  Evaluate the choice for correctness, complexity, and suitability.
4.  If incorrect, diagnose the likely misconception, explain the key
    insight, and offer a retry.
5.  If correct, acknowledge the reasoning and introduce a second
    approach-selection round.
6.  Present relevant optimization paths.
7.  Let the user expand pseudocode when they want implementation-level
    clarity.
8.  If an optimization choice is unsuitable, explain why and offer
    another attempt.
9.  Finish with a concise comparison and a memorable takeaway.
10. Track progress, including whether the user answered independently or
    needed hints.

The experience must be adaptive. A user who understands the initial
problem should progress quickly. A user who is struggling should receive
more scaffolding instead of being forced through the same fixed
sequence.

------------------------------------------------------------------------

## 4. Phase I --- Problem presentation and approach selection

### Purpose

Before revealing a solution, ask the user to reason about how they would
solve the problem. Do not start by asking them to write the full code.

### Example: LeetCode 217 --- Contains Duplicate

**Problem:** Given an integer array `nums`, return `true` if any value
appears at least twice. Return `false` if every element is distinct.

**Prompt:** Which approach would you choose to solve this problem?

Example options:

-   **A. Brute force:** Compare each element with every other element.
-   **B. Sorting:** Sort the array and check adjacent elements.
-   **C. Hash set:** Store previously seen elements and detect repeats.
-   **D. Frequency map:** Count occurrences of each value.

These options represent different algorithmic approaches, not merely
different code styles.

### Rules for approach options

-   Options must be relevant to the specific problem.
-   More than one option may be valid.
-   Avoid treating one preferred answer as the only correct approach
    when several approaches solve the problem.
-   Include a mixture of valid, inefficient, and genuinely incorrect
    approaches when appropriate.
-   Ensure that each option has a clear conceptual distinction.
-   Do not expose the recommended solution or full code before the user
    has made a choice.

### Example evaluation for Contains Duplicate

Brute force, sorting, hashing, and frequency counting can all solve the
problem. They differ in complexity, memory use, and implementation
characteristics.

The system must therefore evaluate correctness separately from
efficiency.

------------------------------------------------------------------------

## 5. Phase II --- Evaluate the selected approach

Every selection should be evaluated along three primary dimensions.

### A. Correctness

Does the approach solve the problem for every valid input and satisfy
all stated constraints?

Consider: - Empty and single-element inputs. - Repeated values in
different positions. - Negative numbers or large values where
relevant. - Input mutation restrictions. - Special cases implied by the
problem statement.

### B. Efficiency

Determine: - Time complexity. - Auxiliary-space complexity. - Whether
the complexity is worst-case, average-case, or amortized where
relevant. - Whether the approach is appropriate for the input
constraints.

### C. Reasoning

Infer why the user may have selected the approach. Explain the likely
intuition and, if necessary, identify the assumption that failed.

The system should distinguish three outcomes:

1.  **Correct and suitable:** The approach solves the problem and is
    reasonable under the constraints.
2.  **Correct but inefficient:** The approach works but a better
    alternative may exist.
3.  **Incorrect or incomplete:** The approach fails on at least one
    valid input or does not satisfy the requirements.

Do not conflate these outcomes.

------------------------------------------------------------------------

## 6. Phase III --- If the user's approach is wrong

A wrong answer should trigger a useful, targeted explanation rather than
simply displaying a red cross or revealing the final solution.

### Feedback structure

#### Step A: Predict the user's reasoning

Use language such as:

> You may have thought that...

Explain the plausible intuition behind the selected option. Present this
as a hypothesis, because the system cannot know the user's private
reasoning unless they explain it.

#### Step B: Identify the misconception

Point to the specific problem: - An assumption that is not guaranteed. -
A missed edge case. - An incorrect understanding of a data structure. -
Unnecessary repeated work. - An algorithm that does not cover every
valid input. - A mismatch with the problem's constraints.

#### Step C: Explain the correct reasoning

Introduce the key insight needed to solve the problem. Prefer a small
example, counterexample, or short trace over a long lecture.

#### Step D: Offer another attempt

Present a new or refined approach-selection interaction. Use targeted
options when possible, but do not reveal everything immediately if the
user can reasonably discover the insight with a hint.

### Example

Suppose a user selects an approach that only checks whether an unsorted
array has equal adjacent values.

The AI could explain:

> You may be assuming that duplicates will always be next to each other.
> That is only guaranteed after sorting. In an unsorted array such as
> `[3, 1, 3]`, the repeated values are separated. You need to compare
> all relevant pairs, sort first, or track previously seen values.

This explanation identifies the likely assumption, demonstrates why it
fails, and points toward valid alternatives.

### If the user gets the retry wrong

The second failure should trigger more explicit guidance:

1.  Show a small counterexample or trace.
2.  Explain why the chosen approach fails.
3.  Reveal the correct reasoning and why it works.
4.  Present the approach-selection options again.

Repeated failures should trigger more support, not endless repetition of
identical options.

Once the user demonstrates understanding, continue to the next learning
stage.

------------------------------------------------------------------------

## 7. Phase IV --- If the approach is correct

After a valid approach is selected, acknowledge the user's success and
introduce a second question.

This second question should test the user's ability to improve or
evaluate the approach, rather than simply ask them to repeat the same
answer.

### Example

Suppose the user initially chooses brute force for Contains Duplicate.

The platform can say:

> Correct! Your approach can solve the problem. Now let's see whether
> you can improve it.
>
> Your current approach compares every pair of elements. What would you
> try next?

Possible options:

-   **A. Improve the nested loops:** Try to reduce repeated comparisons.
-   **B. Sort the array first:** Make duplicates adjacent, then compare
    neighbors.
-   **C. Use a hash set:** Track previously seen values for fast average
    lookup.
-   **D. Use a frequency map:** Count occurrences of each value.

The best next choice depends on what the user selected in the first
round and what the second question is trying to optimize.

### Adaptive progression examples

-   **Starting from brute force:** Hashing is a natural
    time-optimization step. Sorting is another valid alternative.
-   **Starting from sorting:** Compare the time and memory trade-offs of
    hashing against sorting.
-   **Starting from a hash set:** Explore when sorting may be useful, or
    explain why hashing is already a strong choice.
-   **Starting from a frequency map:** Ask whether counts are necessary
    when the only goal is to detect whether a duplicate exists.
-   **Starting from an already suitable approach:** Test the user's
    understanding of trade-offs instead of forcing a redundant
    optimization.

The next stage must depend on the current approach. Do not force every
user through one fixed sequence.

------------------------------------------------------------------------

## 8. Phase V --- Progressive optimization

This is the central feature of DSA Blitz.

After the user correctly identifies an approach, present one or more
relevant optimization paths. Explain the idea first and place pseudocode
inside an expandable dropdown.

The user should understand what changes and why before seeing
implementation details.

### Optimization I --- Improve time complexity

**Example transition:** Brute force to hash set.

#### Before

-   Time complexity: `O(n^2)`.
-   Auxiliary space: `O(1)` for a straightforward pairwise scan.

#### After

-   Average time complexity: `O(n)` using a hash set.
-   Auxiliary space: `O(n)` in the worst case.

#### Key insight

Instead of searching the array repeatedly for a matching value, keep
track of values that have already appeared.

A hash set provides average `O(1)` lookup and insertion. Each number is
processed once, and the algorithm returns immediately when a duplicate
is found.

#### Pseudocode

``` text
Create an empty set

For each number:
    If number exists in set:
        Return true
    Insert number into set

Return false
```

#### Why it works

Before processing a number, the set contains the previously encountered
values. If the current number is already present, a duplicate exists.
Otherwise, insert it so later occurrences can be detected.

#### Trade-off

The hash set uses additional memory. Its operations are average constant
time, not guaranteed constant time in every worst-case scenario.
Hash-table operations can degrade under pathological conditions.

### Optimization II --- Reduce auxiliary space

**Example transition:** Hash set to sorting.

#### Before

-   Average time complexity: `O(n)` for the hash-set approach.
-   Auxiliary space: `O(n)` in the worst case.

#### After

-   Time complexity: `O(n log n)` for sorting plus a linear scan.
-   Typical auxiliary stack space for `std::sort`: `O(log n)`.

#### Key insight

Sorting places equal values next to each other. After sorting, compare
each element with the previous element.

#### Pseudocode

``` text
Sort the array

For each element starting at index 1:
    If current element equals previous element:
        Return true

Return false
```

#### Why it works

After sorting, equal values form adjacent groups. If any duplicate
exists, at least one pair of adjacent elements will be equal.

#### Trade-off

This approach generally uses less auxiliary memory than hashing, but it
takes `O(n log n)` time. It also modifies the input array. If the input
must remain unchanged, sorting a copy requires additional memory.

### Optimization III --- Balance time and space or respect a special constraint

Not every problem has a meaningful third optimization. Some problems
have several trade-offs; others have a clear best-fit solution under the
stated constraints.

Possible learning paths include:

-   **Balance time and space:** Choose the approach that best fits the
    constraints.
-   **Avoid unnecessary work:** Stop early when the answer is already
    known.
-   **Exploit a special property:** Use a problem-specific observation
    to reduce work.
-   **Preserve input:** Select a strategy that avoids modifying the
    original data.
-   **Meet a memory limit:** Use an approach that minimizes auxiliary
    storage when possible.

For Contains Duplicate, a hash set is generally a strong default when
fast average execution is the priority and `O(n)` additional space is
acceptable. Sorting is a useful alternative when lower auxiliary memory
matters more and input mutation is allowed.

Do not manufacture an Optimization III if no meaningful improvement
exists. Explain why the current solution is already suitable instead.

------------------------------------------------------------------------

## 9. Expandable pseudocode interaction

Pseudocode should be hidden by default and revealed when the user
expands the relevant section.

Each optimization card should include:

1.  Optimization title.
2.  What improves.
3.  Complexity before and after.
4.  The key insight.
5.  Why the approach works.
6.  Trade-offs.
7.  Expandable pseudocode.

The pseudocode should be language-independent where possible. It should
show the algorithm's steps without immediately giving away a complete
implementation in C++, Java, Python, or another language.

If the product later offers full code, make it a separate, deliberate
learning step.

### Example UI labels

-   `Optimization I — Faster execution`
-   `Why this works`
-   `Time and space comparison`
-   `View pseudocode`
-   `Show trade-offs`
-   `Try another approach`

Keep the initial interface compact. The user should be able to learn the
main insight without opening every detail.

------------------------------------------------------------------------

## 10. Phase VI --- If the optimization choice is wrong

The same adaptive retry mechanism should apply to optimization
questions.

### Example

Suppose the goal is to find the fastest average-time solution to
Contains Duplicate, and the user chooses sorting.

The AI should explain:

> Sorting is a valid solution, but it is not the fastest average-time
> option among these choices. Sorting takes `O(n log n)`, while a hash
> set can solve the problem in `O(n)` average time by tracking
> previously seen values.

Then present the optimization choices again.

### Second failure

If the user chooses an unsuitable optimization again:

1.  Give a clearer complexity comparison.
2.  Explain why the selected approach is less suitable for the stated
    goal.
3.  Show the correct trade-off.
4.  Provide a worked example if needed.
5.  Repeat the same optimization-choice interaction.

Once the user understands, resume the optimization path instead of
resetting the entire problem.

### Important rule

An optimization answer can be wrong relative to the stated objective
without being an invalid algorithm.

For example, sorting is valid for Contains Duplicate. It is simply
slower than a hash set in average-time complexity. The feedback must
communicate this distinction.

------------------------------------------------------------------------

## 11. Phase VII --- Final recap

At the end of a problem, provide a concise summary containing:

-   The user's original approach.
-   Whether it was correct.
-   Its time and auxiliary-space complexity.
-   The final or recommended approach.
-   Why the alternative is better for the stated goal.
-   The key trade-off.
-   A short reusable pattern.
-   Optional expandable pseudocode.

### Example final takeaway

> When a problem asks whether an element has appeared before, consider a
> hash set. When it asks you to count occurrences, consider a hash map.
> Choose based on the required output, complexity constraints, and
> memory trade-offs.

The takeaway should be specific to the problem, short enough to revise
later, and useful for recognizing similar patterns.

------------------------------------------------------------------------

## 12. Scoring and progress tracking

Reward demonstrated understanding, not just correct guesses.

### Suggested learning dimensions

-   **Approach accuracy:** Did the user recognize a valid algorithm?
-   **Reasoning mastery:** Can the user explain why it works?
-   **Optimization mastery:** Can the user identify a better time-space
    trade-off?
-   **Recovery:** Can the user correct a misconception after feedback?
-   **Retention:** Can the user recognize the pattern in a later
    problem?

A user who initially answers incorrectly but understands the explanation
should still make progress. However, the system should distinguish
independent answers from answers reached with hints.

### Suggested progress states

-   `Not attempted`
-   `Attempted`
-   `Needs guidance`
-   `Approach understood`
-   `Optimization understood`
-   `Mastered independently`

Avoid punishing users for making mistakes. The goal is to make mistakes
useful for learning.

------------------------------------------------------------------------

## 13. Problem data model and AI context

Every problem should have structured learning data. The AI should not
have to invent all explanations and complexity claims from scratch.

### Suggested fields

  -----------------------------------------------------------------------
  Field                               Purpose
  ----------------------------------- -----------------------------------
  Problem statement                   The question displayed to the user

  Constraints and edge cases          Define valid inputs and
                                      requirements

  Accepted approaches                 All valid strategies, including
                                      brute force

  Complexity per approach             Time and auxiliary-space bounds

  Common misconceptions               Likely reasons for incorrect
                                      selections

  Correct reasoning                   The key insight behind the solution

  Optimization transitions            Relevant improvements from each
                                      approach

  Trade-offs                          Speed, memory, mutability, and
                                      implementation complexity

  Pseudocode                          Expandable implementation outline

  Final takeaway                      A short pattern or lesson to
                                      remember
  -----------------------------------------------------------------------

### Why structured data matters

It helps ensure that: - Multiple valid approaches are recognized. -
Complexity claims remain consistent. - Feedback is specific to the
selected option. - Optimization paths are appropriate to the current
approach. - The AI does not label a correct but inefficient solution as
incorrect. - The same learning framework can be reused across a large
question bank.

The AI should use the problem's constraints and accepted strategies as
the source of truth for evaluating a user's selection.

------------------------------------------------------------------------

## 14. AI behavior requirements

The AI should:

-   Explain likely reasoning without claiming to know the user's
    thoughts.
-   Distinguish incorrect logic from correct but inefficient logic.
-   Evaluate approaches against constraints and edge cases.
-   Recognize multiple valid solutions.
-   Give counterexamples when useful.
-   Keep complexity claims accurate and state relevant assumptions.
-   Explain why a data structure or algorithm improves the solution.
-   Recommend optimizations only when they provide meaningful benefits.
-   Avoid repeating the same explanation after repeated failures.
-   Preserve the user's progress across retries.
-   Prioritize conceptual understanding over memorization.
-   Avoid revealing full code before the user has reasoned through the
    approach, except when a worked explanation is appropriate after
    repeated failure.

### Correctness versus efficiency

This distinction is fundamental.

For Contains Duplicate: - Brute force is correct but has `O(n^2)`
time. - Sorting is correct with `O(n log n)` time. - Hashing is correct
with `O(n)` average time and `O(n)` auxiliary space.

The platform must not label brute force or sorting as incorrect merely
because hashing is faster on average.

------------------------------------------------------------------------

## 15. UX and interaction principles

-   Use short explanations by default.
-   Use selectable cards for approach options.
-   Show time and space complexity in a consistent format.
-   Use expandable pseudocode sections.
-   Preserve the current problem, round, and previous selections during
    retries.
-   Make feedback specific to the chosen answer.
-   Show progress through the learning stages.
-   Distinguish independent mastery from assisted completion.
-   Avoid showing every possible detail simultaneously.
-   Do not force redundant optimization steps.
-   Make the learning experience supportive rather than punitive.

------------------------------------------------------------------------

## 16. Success criteria

A successful DSA Blitz session should leave the user able to:

1.  Explain why their selected approach works or fails.
2.  Identify the time and auxiliary-space complexity.
3.  Recognize a more suitable alternative when one exists.
4.  Explain the trade-off introduced by the alternative.
5.  Understand the core algorithm through pseudocode.
6.  Recall the key pattern when solving a similar problem later.

The defining product principle is:

**DSA Blitz adapts to the user's thinking. It does not merely mark
answers right or wrong; it guides the user from "I found a solution" to
"I understand why this solution is appropriate, and I know when a better
one exists."**
