import { describe, it, expect } from "vitest";
import { REPUTATION, RANKING, TOURNAMENT, PRODE, PLATFORMS, TOURNAMENT_FORMATS } from "./constants";

describe("REPUTATION constants", () => {
  it("has positive initial reputation", () => {
    expect(REPUTATION.INITIAL).toBeGreaterThan(0);
  });

  it("has all penalties as negative or zero", () => {
    expect(REPUTATION.NO_SHOW).toBeLessThan(0);
    expect(REPUTATION.CHEATING).toBeLessThan(0);
    expect(REPUTATION.CANCEL_NO_REASON).toBeLessThan(0);
  });

  it("has suspension threshold at 0", () => {
    expect(REPUTATION.SUSPENSION_THRESHOLD).toBe(0);
  });

  it("cheating penalty is worst", () => {
    expect(REPUTATION.CHEATING).toBeLessThan(REPUTATION.NO_SHOW);
    expect(REPUTATION.CHEATING).toBeLessThan(REPUTATION.CANCEL_NO_REASON);
  });
});

describe("RANKING constants", () => {
  it("win > draw > loss", () => {
    expect(RANKING.WIN).toBeGreaterThan(RANKING.DRAW);
    expect(RANKING.DRAW).toBeGreaterThan(RANKING.LOSS);
  });

  it("walkover gives penalty", () => {
    expect(RANKING.WALKOVER_PENALTY).toBeLessThan(0);
  });
});

describe("TOURNAMENT constants", () => {
  it("needs at least 4 players", () => {
    expect(TOURNAMENT.MIN_PLAYERS_LEAGUE).toBeGreaterThanOrEqual(4);
    expect(TOURNAMENT.MIN_PLAYERS_ELIMINATION).toBeGreaterThanOrEqual(4);
  });

  it("league points follow standard football scoring", () => {
    expect(TOURNAMENT.LEAGUE_POINTS_WIN).toBe(3);
    expect(TOURNAMENT.LEAGUE_POINTS_DRAW).toBe(1);
    expect(TOURNAMENT.LEAGUE_POINTS_LOSS).toBe(0);
  });
});

describe("PRODE scoring", () => {
  it("exact result scores more than correct winner", () => {
    expect(PRODE.EXACT_RESULT).toBeGreaterThan(PRODE.CORRECT_WINNER);
  });

  it("incorrect gives 0 points", () => {
    expect(PRODE.INCORRECT).toBe(0);
  });

  it("later rounds score more for advancement", () => {
    expect(PRODE.ADVANCE_ROUND_16).toBeGreaterThan(PRODE.ADVANCE_ROUND_32);
    expect(PRODE.ADVANCE_QUARTERS).toBeGreaterThan(PRODE.ADVANCE_ROUND_16);
    expect(PRODE.ADVANCE_SEMIS).toBeGreaterThan(PRODE.ADVANCE_QUARTERS);
    expect(PRODE.ADVANCE_FINAL).toBeGreaterThan(PRODE.ADVANCE_SEMIS);
  });
});

describe("PLATFORMS", () => {
  it("has PS5, XBOX, and PC", () => {
    const values = PLATFORMS.map((p) => p.value);
    expect(values).toContain("PS5");
    expect(values).toContain("XBOX");
    expect(values).toContain("PC");
  });
});

describe("TOURNAMENT_FORMATS", () => {
  it("has 4 formats", () => {
    expect(TOURNAMENT_FORMATS).toHaveLength(4);
  });

  it("includes all expected formats", () => {
    const values = TOURNAMENT_FORMATS.map((f) => f.value);
    expect(values).toContain("SINGLE_ELIMINATION");
    expect(values).toContain("DOUBLE_ELIMINATION");
    expect(values).toContain("LEAGUE");
    expect(values).toContain("GROUP_KNOCKOUT");
  });
});
