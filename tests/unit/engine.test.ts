import { describe, it, expect } from "vitest";
import {
  evaluateMcq,
  evaluateMultiChoice,
  evaluateSpotBug,
  evaluateFillBlank,
  evaluatePuzzleHash,
  computeSpeedBonus,
  computeCalibration,
  evaluateSubmission,
} from "@/lib/engine/scoring";
import { calculateXp, getStreakMultiplier, BASE_XP } from "@/lib/engine/xp";
import { calculateSm2, mapOutcomeToQuality } from "@/lib/engine/sm2";
import {
  calculateMasteryTier,
  calculateMasteryProgress,
  scheduleMasteryRetests,
  isRetestDue,
} from "@/lib/engine/mastery";
import { evaluateStreakUpdate } from "@/lib/engine/streaks";
import { createHash } from "crypto";

describe("Deterministic Engine", () => {
  describe("Scoring Evaluators", () => {
    it("evaluates single-choice MCQ with whitespace tolerance", () => {
      expect(evaluateMcq("opt_b", "opt_b").correct).toBe(true);
      expect(evaluateMcq(" opt_b ", "opt_b").correct).toBe(true);
      expect(evaluateMcq("opt_a", "opt_b").correct).toBe(false);
    });

    it("evaluates multiple-choice requiring exact set match", () => {
      const correct = ["a", "c"];
      expect(evaluateMultiChoice(["a", "c"], correct).correct).toBe(true);
      expect(evaluateMultiChoice(["c", "a"], correct).correct).toBe(true);
      expect(evaluateMultiChoice(["a"], correct).correct).toBe(false); // omission
      expect(evaluateMultiChoice(["a", "b", "c"], correct).correct).toBe(false); // distractor chosen
    });

    it("evaluates spot-the-bug line selection", () => {
      const bugLines = [14, 18];
      expect(evaluateSpotBug([14, 18], bugLines).correct).toBe(true);
      expect(evaluateSpotBug([18, 14], bugLines).correct).toBe(true);
      expect(evaluateSpotBug([14], bugLines).correct).toBe(false);
      expect(evaluateSpotBug([14, 15, 18], bugLines).correct).toBe(false);
    });

    it("evaluates fill-in-the-blank with whitespace and case normalization", () => {
      const accepted = ["O(n log n)", "O(N LOG N)", "nlogn"];
      expect(evaluateFillBlank("O(n log n)", accepted).correct).toBe(true);
      expect(evaluateFillBlank("  o(n log n)  ", accepted).correct).toBe(true);
      expect(evaluateFillBlank("O(n^2)", accepted).correct).toBe(false);

      // Case-sensitive mode
      expect(
        evaluateFillBlank("quickSort", ["quickSort"], true).correct
      ).toBe(true);
      expect(
        evaluateFillBlank("quicksort", ["quickSort"], true).correct
      ).toBe(false);
    });

    it("validates puzzle solutions deterministically using SHA-256", () => {
      const solution = "42,88,105";
      const expectedHash = createHash("sha256").update(solution).digest("hex");

      expect(evaluatePuzzleHash(solution, expectedHash).correct).toBe(true);
      expect(evaluatePuzzleHash("wrong answer", expectedHash).correct).toBe(
        false
      );
    });

    it("computes speed bonus based on target time brackets", () => {
      const target = 20_000;
      // <= 50% time -> full 5 bonus
      expect(computeSpeedBonus(5_000, target, 5)).toBe(5);
      expect(computeSpeedBonus(10_000, target, 5)).toBe(5);

      // 75% time -> partial bonus
      expect(computeSpeedBonus(15_000, target, 5)).toBe(3);

      // > target time -> 0 bonus
      expect(computeSpeedBonus(21_000, target, 5)).toBe(0);
    });

    it("computes confidence-accuracy calibration status", () => {
      expect(computeCalibration("certain", true)).toBe("calibrated");
      expect(computeCalibration("certain", false)).toBe("overconfident");
      expect(computeCalibration("guessing", true)).toBe("underconfident");
      expect(computeCalibration("guessing", false)).toBe("calibrated");
      expect(computeCalibration("unsure", true)).toBe("calibrated");
      expect(computeCalibration(undefined, true)).toBe("uncalibrated");
    });

    it("evaluates unified submission with speed bonus and calibration", () => {
      const res = evaluateSubmission({
        type: "mcq",
        userAnswer: "opt_1",
        expected: "opt_1",
        ms: 4000,
        targetMs: 15_000,
        confidence: "certain",
      });

      expect(res.correct).toBe(true);
      expect(res.score).toBe(1);
      expect(res.speedBonus).toBe(5);
      expect(res.calibration).toBe("calibrated");
    });
  });

  describe("XP Ledger Rules", () => {
    it("computes base XP rewards correctly", () => {
      expect(calculateXp("blitz_solve")).toBe(BASE_XP.blitz_solve);
      expect(calculateXp("lesson_complete")).toBe(BASE_XP.lesson_complete);
      expect(calculateXp("mind_sprint_complete")).toBe(
        BASE_XP.mind_sprint_complete
      );
    });

    it("applies speed bonus and perfect bonus", () => {
      const base = BASE_XP.quiz_solve;
      const withBonuses = calculateXp("quiz_solve", {
        speedBonus: 5,
        perfectBonus: true,
      });
      expect(withBonuses).toBe(base + 5 + 15);
    });

    it("applies streak multipliers accurately", () => {
      expect(getStreakMultiplier(0)).toBe(1.0);
      expect(getStreakMultiplier(3)).toBe(1.1);
      expect(getStreakMultiplier(7)).toBe(1.25);
      expect(getStreakMultiplier(14)).toBe(1.5);
      expect(getStreakMultiplier(30)).toBe(2.0);

      const base = BASE_XP.blitz_solve; // 10
      expect(calculateXp("blitz_solve", { streakDays: 7 })).toBe(
        Math.round(base * 1.25)
      );
    });
  });

  describe("SM-2 Spaced Repetition", () => {
    it("maps answer outcomes to SM-2 quality grades", () => {
      expect(mapOutcomeToQuality(true, 5000, "certain")).toBe(5);
      expect(mapOutcomeToQuality(true, 20_000, "unsure")).toBe(4);
      expect(mapOutcomeToQuality(true, 25_000, "guessing")).toBe(3);
      expect(mapOutcomeToQuality(false, 10_000, "unsure")).toBe(2);
      expect(mapOutcomeToQuality(false, 10_000, "guessing")).toBe(1);
      expect(mapOutcomeToQuality(false, 10_000, "certain")).toBe(0);
    });

    it("schedules consecutive correct reviews with expanding intervals", () => {
      const t0 = new Date("2026-10-13T12:00:00Z");

      // Review 1 (quality 5)
      const r1 = calculateSm2({}, 5, t0);
      expect(r1.repetitions).toBe(1);
      expect(r1.interval).toBe(1); // 1 day
      expect(r1.ease).toBe(2.6); // 2.5 + 0.1

      // Review 2 (quality 5)
      const r2 = calculateSm2(r1, 5, r1.due);
      expect(r2.repetitions).toBe(2);
      expect(r2.interval).toBe(6); // 6 days
      expect(r2.ease).toBe(2.7);

      // Review 3 (quality 5)
      const r3 = calculateSm2(r2, 5, r2.due);
      expect(r3.repetitions).toBe(3);
      expect(r3.interval).toBe(Math.round(6 * 2.7)); // 16 days
    });

    it("resets interval and repetitions on failure while adjusting ease", () => {
      const prior = { ease: 2.5, interval: 16, repetitions: 3 };
      const failed = calculateSm2(prior, 1); // quality 1 (failed)

      expect(failed.repetitions).toBe(0);
      expect(failed.interval).toBe(1); // Back to 1 day
      expect(failed.ease).toBeLessThan(prior.ease);
    });

    it("never lets ease drop below the minimum threshold of 1.3", () => {
      let state = { ease: 1.35, interval: 1, repetitions: 0 };
      for (let i = 0; i < 5; i++) {
        state = calculateSm2(state, 0);
      }
      expect(state.ease).toBe(1.3);
    });
  });

  describe("Mastery & Schedule", () => {
    it("determines mastery tiers correctly", () => {
      expect(calculateMasteryTier({ repetitions: 0, accuracy: 0 })).toBe(
        "novice"
      );
      expect(calculateMasteryTier({ repetitions: 1, accuracy: 0.5 })).toBe(
        "learning"
      );
      expect(calculateMasteryTier({ repetitions: 3, accuracy: 0.8 })).toBe(
        "proficient"
      );
      expect(
        calculateMasteryTier({
          repetitions: 5,
          accuracy: 0.9,
          interval: 14,
        })
      ).toBe("mastered");
    });

    it("calculates progress percentage towards mastery", () => {
      const pNovice = calculateMasteryProgress({
        repetitions: 0,
        accuracy: 0,
        totalAttempts: 1,
      });
      expect(pNovice.tier).toBe("novice");
      expect(pNovice.percent).toBe(15);

      const pMastered = calculateMasteryProgress({
        repetitions: 6,
        accuracy: 0.95,
        interval: 18,
        totalAttempts: 10,
      });
      expect(pMastered.tier).toBe("mastered");
      expect(pMastered.percent).toBe(100);
    });

    it("schedules Module III mastery re-tests at +3 and +10 days", () => {
      const completionDate = new Date("2026-10-13T10:00:00Z");
      const schedule = scheduleMasteryRetests(completionDate);

      const msInDay = 24 * 60 * 60 * 1000;
      expect(schedule.retest1.getTime() - completionDate.getTime()).toBe(
        3 * msInDay
      );
      expect(schedule.retest2.getTime() - completionDate.getTime()).toBe(
        10 * msInDay
      );

      // Due checking
      expect(isRetestDue(schedule.retest1, completionDate)).toBe(false);
      const after3Days = new Date(completionDate.getTime() + 3 * msInDay + 100);
      expect(isRetestDue(schedule.retest1, after3Days)).toBe(true);
    });
  });

  describe("Deterministic Streaks", () => {
    it("handles initial streak startup", () => {
      const initial = { current: 0, longest: 0, lastDay: "" };
      const res = evaluateStreakUpdate(
        initial,
        new Date("2026-10-13T10:00:00Z")
      );

      expect(res.current).toBe(1);
      expect(res.longest).toBe(1);
      expect(res.lastDay).toBe("2026-10-13");
      expect(res.status).toBe("started");
    });

    it("maintains streak without increment on multiple activities on the same day", () => {
      const current = { current: 3, longest: 5, lastDay: "2026-10-13" };
      const res = evaluateStreakUpdate(
        current,
        new Date("2026-10-13T18:00:00Z")
      );

      expect(res.current).toBe(3);
      expect(res.longest).toBe(5);
      expect(res.status).toBe("maintained");
      expect(res.streakIncreased).toBe(false);
    });

    it("extends streak on consecutive day", () => {
      const current = { current: 3, longest: 3, lastDay: "2026-10-12" };
      const res = evaluateStreakUpdate(
        current,
        new Date("2026-10-13T09:00:00Z")
      );

      expect(res.current).toBe(4);
      expect(res.longest).toBe(4);
      expect(res.status).toBe("extended");
      expect(res.streakIncreased).toBe(true);
    });

    it("resets streak to 1 on missed day while preserving longest", () => {
      const current = { current: 8, longest: 12, lastDay: "2026-10-10" };
      const res = evaluateStreakUpdate(
        current,
        new Date("2026-10-13T09:00:00Z")
      );

      expect(res.current).toBe(1);
      expect(res.longest).toBe(12);
      expect(res.status).toBe("reset");
      expect(res.streakIncreased).toBe(false);
    });
  });
});
