-- AlterTable: Add team fields to tournament_participants
ALTER TABLE "tournament_participants" ADD COLUMN "team_id" TEXT;

-- AlterTable: Add team fields to tournament_matches
ALTER TABLE "tournament_matches" ADD COLUMN "team1_id" TEXT;
ALTER TABLE "tournament_matches" ADD COLUMN "team2_id" TEXT;
ALTER TABLE "tournament_matches" ADD COLUMN "winner_team_id" TEXT;

-- AlterTable: Add ranking fields to teams
ALTER TABLE "teams" ADD COLUMN "ranking_points" INTEGER NOT NULL DEFAULT 1000;
ALTER TABLE "teams" ADD COLUMN "won" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "teams" ADD COLUMN "drawn" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "teams" ADD COLUMN "lost" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "teams" ADD COLUMN "goals_for" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "teams" ADD COLUMN "goals_against" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "tournament_participants_tournament_id_team_id_key" ON "tournament_participants"("tournament_id", "team_id");

-- AddForeignKey
ALTER TABLE "tournament_participants" ADD CONSTRAINT "tournament_participants_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_team1_id_fkey" FOREIGN KEY ("team1_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_team2_id_fkey" FOREIGN KEY ("team2_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_winner_team_id_fkey" FOREIGN KEY ("winner_team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
