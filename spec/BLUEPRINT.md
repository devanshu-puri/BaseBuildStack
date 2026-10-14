# BLUEPRINT — Vision, Pillars, Journey

> Read after: PRD.md · Read before: architecture.md

---

## 1. Vision

Become the place a candidate opens on **any device** the week before an interview, and know exactly what to do next, because the platform understands what they know, what they claim, and where they are overconfident.

## 2. Hackathon pitch (2 sentences)

> **BaseBuildStack diagnoses what you actually know from your resume and GitHub, teaches the gaps in 15-minute interactive lessons, and drills the real modern interview formats, all in one loop.** Every answer is verified by deterministic code, and open-weight AI only personalises, grades free text, and asks the uncomfortable follow-up questions.

## 3. Product pillars

| # | Pillar | Meaning in practice |
|---|---|---|
| 1 | **Deterministic truth, AI personalisation** | Scoring, XP, streaks, puzzle correctness, bug validity = plain code. LLM = extraction, wording, grading, pushback. |
| 2 | **Diagnose → Teach → Drill → Review** | Every module feeds the next. No dead ends. |
| 3 | **One lesson, one outcome** | Short, structured, repeatable formats everywhere. |
| 4 | **Proof over trivia** | Questions are grounded in the user's own stack and repos. |
| 5 | **Same product on every screen** | Phone for quick drills, laptop for deep work, one design system, one account. |
| 6 | **Private by default** | Per-user data scoping, deletable, exportable, no ads, no data selling. |

## 4. End-to-end user journey

```
 ┌────────────┐   ┌────────────┐   ┌────────────┐   ┌────────────┐   ┌────────────┐
 │ 1 ONBOARD  │ → │ 2 DIAGNOSE │ → │ 3 LEARN    │ → │ 4 DRILL    │ → │ 5 REVIEW   │
 │ role+stack │   │ M2 quiz    │   │ M3 Tech    │   │ M1 rounds  │   │ Progress,  │
 │ resume     │   │ heatmap    │   │ Bites      │   │ M4 Sprint  │   │ mistakes,  │
 │ (optional) │   │            │   │            │   │            │   │ re-tests   │
 └────────────┘   └────────────┘   └────────────┘   └────────────┘   └─────┬──────┘
        ▲                                                                   │
        └───────────────────────── weak areas feed back ────────────────────┘
```

### Step detail
1. **Onboard (≤ 60s):** sign up → choose target role → pick stack chips → optional resume upload (confirm extracted skills). Skip is always allowed.
2. **Diagnose:** first 5-minute Quick Quiz → skill heatmap + confidence-vs-accuracy.
3. **Learn:** "Weak: Event Loop" → recommended Tech Bite → 5-stage lesson → recall quiz → XP.
4. **Drill:** Pattern Blitz on the commute (phone), Bug Audit and Open-Ended at the desk (desktop), Mind Sprint daily.
5. **Review:** Mistakes list, bookmarks, spaced-repetition queue, mastery re-tests at +3 and +10 days, milestone cards.

### Device-aware journey
| Moment | Likely device | UX emphasis |
|---|---|---|
| Commute flashcards, Mind Sprint | Phone | One-thumb, bottom CTA, large tap targets |
| Resume upload, repo link, long lessons | Laptop | Side-by-side panes, keyboard shortcuts |
| Quick progress check | Either | Same data, adaptive layout |

## 5. Cross-module links

| Trigger | From | To | Mechanism |
|---|---|---|---|
| Low skill score on a topic | M2 heatmap | M3 lesson | `skill → lessonId` map (data, not code) |
| Lesson completed | M3 | M2 / M1 retest | Re-test queued at +3, +10 days |
| Wrong answer | M2 / M1 | Mistakes list | Saved with source + reason |
| High confidence + wrong | M2 / M4 | Insight card | Deterministic calculation |
| Bookmark | Any | Bookmarks tab | Unified `bookmarks` collection |
| XP / milestone | Any | Progress tab | Single `xp_events` ledger |

## 6. Experience principles

1. **First value fast:** the home screen always has one obvious "Continue" action.
2. **Predictable structure:** same stepper, same chips, same feedback format across modules.
3. **Never block on AI:** if the model is slow or down, serve cached or deterministic content.
4. **Explain, don't just score:** every wrong answer gets Why + Distractor takedown + Takeaway.
5. **Calm UI:** one accent colour, no clutter, no ads, no dark patterns.

## 7. Demo script (3 minutes)

1. Open on phone-size window: sign in → pick "AI Engineer" → upload resume → confirm skills.
2. Take a 5-minute quiz → heatmap shows weak "embeddings".
3. Tap recommended Tech Bite → step through the clickable RAG diagram → recall quiz → XP.
4. Resize to desktop: Bug Audit split-view, then Proof of Authorship evidence panel (if built).
5. Mind Sprint → confidence tagging → insight card.
6. Upgrade to Pro (Razorpay test mode) → entitlement unlocks.
