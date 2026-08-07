export const POS_ES: Record<string, string> = {
  GK: "POR", CB: "DFC", LB: "LI", RB: "LD", LWB: "CAI", RWB: "CAD",
  CDM: "MCD", CM: "MC", CAM: "MCO", LM: "MI", RM: "MD",
  LW: "EI", RW: "ED", LF: "II", RF: "ID", CF: "MP",
  ST: "DC", SW: "LIB",
};

export function tPos(pos: string): string {
  return POS_ES[pos] ?? pos;
}

export function translatePositionsInText(text: string): string {
  return text.replace(
    /\b(GK|CB|LB|RB|LWB|RWB|CDM|CM|CAM|LM|RM|LW|RW|LF|RF|CF|ST|SW)\b/g,
    (m) => POS_ES[m] ?? m,
  );
}
