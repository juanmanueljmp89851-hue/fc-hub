-- AlterEnum: add SETUP to TournamentStatus
ALTER TYPE "TournamentStatus" ADD VALUE 'SETUP';

-- CreateEnum: DrawMode
CREATE TYPE "DrawMode" AS ENUM ('RANDOM', 'SEEDED', 'MANUAL', 'MATCHDAY');

-- AlterTable: add draw_mode and draw_data to tournaments
ALTER TABLE "tournaments" ADD COLUMN "draw_mode" "DrawMode" NOT NULL DEFAULT 'RANDOM';
ALTER TABLE "tournaments" ADD COLUMN "draw_data" JSONB;
