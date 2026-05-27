export type {
  User,
  Tournament,
  TournamentParticipant,
  TournamentWaitlist,
  TournamentMatch,
  LeagueStanding,
  TournamentDispute,
  MatchMessage,
  TournamentAuditLog,
  UserSanction,
  CasualMatch,
  RankingHistory,
  ProdeWeek,
  ProdeMatch,
  ProdePrediction,
  Influencer,
  Notification,
} from "@prisma/client";

export type {
  UserRole,
  TournamentFormat,
  TournamentStatus,
  Platform,
  TournamentVisibility,
  VerificationLevel,
  ParticipantStatus,
  BracketType,
  MatchStatus,
  DisputeStatus,
  CasualMatchStatus,
  ProdeWeekStatus,
  ProdeMatchStatus,
  NotificationType,
} from "@prisma/client";

export interface RankingEntry {
  position: number;
  userId: string;
  username: string;
  avatarUrl: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  reputation: number;
}

export interface ProdeLeaderboardEntry {
  position: number;
  userId: string;
  username: string;
  avatarUrl: string | null;
  totalPoints: number;
  exactResults: number;
  correctWinners: number;
}

export interface TournamentWithDetails {
  id: string;
  name: string;
  format: string;
  status: string;
  platform: string;
  maxPlayers: number;
  currentPlayers: number;
  verificationLevel: string;
  bannerUrl: string | null;
  startDate: Date | null;
  registrationDeadline: Date | null;
  prize: string | null;
  createdBy: {
    username: string;
    avatarUrl: string | null;
  };
}
