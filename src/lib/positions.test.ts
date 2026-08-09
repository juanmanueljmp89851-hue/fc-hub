import { describe, it, expect } from "vitest";
import { tPos, translatePositionsInText, POS_ES } from "./positions";

describe("tPos", () => {
  it("translates known positions", () => {
    expect(tPos("GK")).toBe("POR");
    expect(tPos("ST")).toBe("DC");
    expect(tPos("CAM")).toBe("MCO");
    expect(tPos("CB")).toBe("DFC");
    expect(tPos("LW")).toBe("EI");
    expect(tPos("RW")).toBe("ED");
  });

  it("returns original for unknown positions", () => {
    expect(tPos("FAKE")).toBe("FAKE");
    expect(tPos("")).toBe("");
  });
});

describe("translatePositionsInText", () => {
  it("translates positions in text", () => {
    expect(translatePositionsInText("Min. 1 GK")).toBe("Min. 1 POR");
    expect(translatePositionsInText("2 ST, 1 CAM")).toBe("2 DC, 1 MCO");
  });

  it("does not translate partial matches", () => {
    expect(translatePositionsInText("STUN")).toBe("STUN");
    expect(translatePositionsInText("AGKB")).toBe("AGKB");
  });

  it("handles empty string", () => {
    expect(translatePositionsInText("")).toBe("");
  });
});

describe("POS_ES completeness", () => {
  it("has all standard EA FC positions", () => {
    const positions = ["GK", "CB", "LB", "RB", "LWB", "RWB", "CDM", "CM", "CAM", "LM", "RM", "LW", "RW", "LF", "RF", "CF", "ST"];
    for (const pos of positions) {
      expect(POS_ES[pos]).toBeDefined();
    }
  });
});
