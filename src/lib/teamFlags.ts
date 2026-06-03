/** Country flag emoji map for World Cup 2026 teams */
export const TEAM_FLAGS: Record<string, string> = {
  // Group A
  "México": "🇲🇽",
  "Sudáfrica": "🇿🇦",
  "Corea del Sur": "🇰🇷",
  "Chequia": "🇨🇿",
  // Group B
  "Canadá": "🇨🇦",
  "Bosnia y Herzegovina": "🇧🇦",
  "Catar": "🇶🇦",
  "Suiza": "🇨🇭",
  // Group C
  "Brasil": "🇧🇷",
  "Marruecos": "🇲🇦",
  "Haití": "🇭🇹",
  "Escocia": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  // Group D
  "Estados Unidos": "🇺🇸",
  "Paraguay": "🇵🇾",
  "Australia": "🇦🇺",
  "Turquía": "🇹🇷",
  // Group E
  "Alemania": "🇩🇪",
  "Curazao": "🇨🇼",
  "Costa de Marfil": "🇨🇮",
  "Ecuador": "🇪🇨",
  // Group F
  "Países Bajos": "🇳🇱",
  "Japón": "🇯🇵",
  "Suecia": "🇸🇪",
  "Túnez": "🇹🇳",
  // Group G
  "Bélgica": "🇧🇪",
  "Egipto": "🇪🇬",
  "Irán": "🇮🇷",
  "Nueva Zelanda": "🇳🇿",
  // Group H
  "España": "🇪🇸",
  "Cabo Verde": "🇨🇻",
  "Arabia Saudita": "🇸🇦",
  "Uruguay": "🇺🇾",
  // Group I
  "Francia": "🇫🇷",
  "Senegal": "🇸🇳",
  "Irak": "🇮🇶",
  "Noruega": "🇳🇴",
  // Group J
  "Argentina": "🇦🇷",
  "Argelia": "🇩🇿",
  "Austria": "🇦🇹",
  "Jordania": "🇯🇴",
  // Group K
  "Portugal": "🇵🇹",
  "RD Congo": "🇨🇩",
  "Uzbekistán": "🇺🇿",
  "Colombia": "🇨🇴",
  // Group L
  "Inglaterra": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  "Croacia": "🇭🇷",
  "Ghana": "🇬🇭",
  "Panamá": "🇵🇦",
};

/** Get flag emoji for team name, empty string if not found */
export function getFlag(team: string): string {
  return TEAM_FLAGS[team] ?? "";
}

/** Team name with flag prefix */
export function teamWithFlag(team: string): string {
  const flag = TEAM_FLAGS[team];
  return flag ? `${flag} ${team}` : team;
}
