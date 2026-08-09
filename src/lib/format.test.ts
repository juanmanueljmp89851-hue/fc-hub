import { describe, it, expect, vi, afterEach } from "vitest";
import { fmtCoins, timeLeft } from "./format";

describe("fmtCoins", () => {
  it("formats millions", () => {
    expect(fmtCoins(1_000_000)).toBe("1M");
    expect(fmtCoins(2_500_000)).toBe("2.5M");
    expect(fmtCoins(10_000_000)).toBe("10M");
    expect(fmtCoins(1_230_000)).toBe("1.23M");
  });

  it("formats thousands", () => {
    expect(fmtCoins(1_000)).toBe("1K");
    expect(fmtCoins(1_500)).toBe("1.5K");
    expect(fmtCoins(999_999)).toBe("1000K");
  });

  it("formats small numbers as-is", () => {
    expect(fmtCoins(0)).toBe("0");
    expect(fmtCoins(500)).toBe("500");
    expect(fmtCoins(999)).toBe("999");
  });
});

describe("timeLeft", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns Permanente for null", () => {
    expect(timeLeft(null)).toBe("Permanente");
  });

  it("returns Expira ya for past dates", () => {
    expect(timeLeft("2020-01-01T00:00:00Z")).toBe("Expira ya");
  });

  it("formats days and hours", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-08T12:00:00Z"));
    expect(timeLeft("2026-08-10T18:00:00Z")).toBe("2d 6h");
    vi.useRealTimers();
  });

  it("formats hours and minutes when < 1 day", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-08T12:00:00Z"));
    expect(timeLeft("2026-08-08T14:30:00Z")).toBe("2h 30m");
    vi.useRealTimers();
  });
});
