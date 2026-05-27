export const REPUTATION = {
  INITIAL: 100,
  NO_SHOW: -10,
  CHEATING: -25,
  CANCEL_NO_REASON: -20,
  TOURNAMENT_COMPLETED: 5,
  DISPUTE_WON: 5,
  POSITIVE_FEEDBACK: 3,
  SUSPENSION_THRESHOLD: 0,
  SUSPENSION_DAYS: 7,
} as const;

export const RANKING = {
  WIN: 3,
  DRAW: 1,
  LOSS: 0,
  WALKOVER_PENALTY: -2,
} as const;

export const PRODE = {
  EXACT_RESULT: 5,
  CORRECT_WINNER: 3,
  INCORRECT: 0,
  // Group order scoring
  GROUP_ALL_4_CORRECT: 10,
  GROUP_3_CORRECT: 6,
  GROUP_2_CORRECT: 3,
  GROUP_1_CORRECT: 1,
  // Round advancement scoring (per correct team)
  ADVANCE_ROUND_32: 1,
  ADVANCE_ROUND_16: 2,
  ADVANCE_QUARTERS: 3,
  ADVANCE_SEMIS: 5,
  ADVANCE_FINAL: 7,
  ADVANCE_CHAMPION: 10,
} as const;

export const TOURNAMENT = {
  MIN_PLAYERS_LEAGUE: 4,
  MIN_PLAYERS_ELIMINATION: 4,
  DISPUTE_RESOLVE_HOURS: 48,
  LEAGUE_POINTS_WIN: 3,
  LEAGUE_POINTS_DRAW: 1,
  LEAGUE_POINTS_LOSS: 0,
} as const;

export const PLATFORMS = [
  { value: "PS5", label: "PlayStation 5" },
  { value: "XBOX", label: "Xbox Series X|S" },
  { value: "PC", label: "PC" },
] as const;

export const TOURNAMENT_FORMATS = [
  { value: "SINGLE_ELIMINATION", label: "Eliminación Simple" },
  { value: "DOUBLE_ELIMINATION", label: "Doble Eliminación" },
  { value: "LEAGUE", label: "Liga (Todos contra todos)" },
  { value: "GROUP_KNOCKOUT", label: "Fase de Grupos + Eliminación" },
] as const;

export const NATIONALITIES = [
  "Argentina",
  "Bolivia",
  "Brasil",
  "Chile",
  "Colombia",
  "Costa Rica",
  "Cuba",
  "Ecuador",
  "El Salvador",
  "España",
  "Guatemala",
  "Honduras",
  "México",
  "Nicaragua",
  "Panamá",
  "Paraguay",
  "Perú",
  "Puerto Rico",
  "República Dominicana",
  "Uruguay",
  "Venezuela",
  "Otro",
] as const;

export const POPULAR_TEAMS = [
  "River Plate",
  "Boca Juniors",
  "Racing Club",
  "Independiente",
  "San Lorenzo",
  "Huracán",
  "Vélez Sarsfield",
  "Estudiantes",
  "Lanús",
  "Banfield",
  "Defensa y Justicia",
  "Argentinos Juniors",
  "Talleres",
  "Belgrano",
  "Newell's Old Boys",
  "Rosario Central",
  "Godoy Cruz",
  "Unión",
  "Colón",
  "Tigre",
  "Platense",
  "Barracas Central",
  "Instituto",
  "Sarmiento",
  "Central Córdoba",
  "Real Madrid",
  "Barcelona",
  "Atlético Madrid",
  "Manchester City",
  "Liverpool",
  "Arsenal",
  "Chelsea",
  "Manchester United",
  "PSG",
  "Bayern Munich",
  "Juventus",
  "Inter Milan",
  "AC Milan",
  "Napoli",
  "Borussia Dortmund",
  "Otro",
] as const;
