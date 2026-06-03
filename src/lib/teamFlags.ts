/** ISO country code map for World Cup 2026 teams (used for flag images) */
export const TEAM_CODES: Record<string, string> = {
  // Group A
  "México": "mx",
  "Sudáfrica": "za",
  "Corea del Sur": "kr",
  "Chequia": "cz",
  // Group B
  "Canadá": "ca",
  "Bosnia y Herzegovina": "ba",
  "Catar": "qa",
  "Suiza": "ch",
  // Group C
  "Brasil": "br",
  "Marruecos": "ma",
  "Haití": "ht",
  "Escocia": "gb-sct",
  // Group D
  "Estados Unidos": "us",
  "Paraguay": "py",
  "Australia": "au",
  "Turquía": "tr",
  // Group E
  "Alemania": "de",
  "Curazao": "cw",
  "Costa de Marfil": "ci",
  "Ecuador": "ec",
  // Group F
  "Países Bajos": "nl",
  "Japón": "jp",
  "Suecia": "se",
  "Túnez": "tn",
  // Group G
  "Bélgica": "be",
  "Egipto": "eg",
  "Irán": "ir",
  "Nueva Zelanda": "nz",
  // Group H
  "España": "es",
  "Cabo Verde": "cv",
  "Arabia Saudita": "sa",
  "Uruguay": "uy",
  // Group I
  "Francia": "fr",
  "Senegal": "sn",
  "Irak": "iq",
  "Noruega": "no",
  // Group J
  "Argentina": "ar",
  "Argelia": "dz",
  "Austria": "at",
  "Jordania": "jo",
  // Group K
  "Portugal": "pt",
  "RD Congo": "cd",
  "Uzbekistán": "uz",
  "Colombia": "co",
  // Group L
  "Inglaterra": "gb-eng",
  "Croacia": "hr",
  "Ghana": "gh",
  "Panamá": "pa",
};

/** Get flag image URL for a team (20px wide) */
export function getFlagUrl(team: string): string | null {
  const code = TEAM_CODES[team];
  if (!code) return null;
  return `https://flagcdn.com/w20/${code}.png`;
}

/** Get flag image URL at custom width */
export function getFlagUrlW(team: string, width: number): string | null {
  const code = TEAM_CODES[team];
  if (!code) return null;
  return `https://flagcdn.com/w${width}/${code}.png`;
}
