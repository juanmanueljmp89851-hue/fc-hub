-- AlterTable
ALTER TABLE "prode_matches" ADD COLUMN     "extra_time" BOOLEAN,
ADD COLUMN     "penalties" BOOLEAN,
ADD COLUMN     "winner_team" TEXT;

-- AlterTable
ALTER TABLE "prode_predictions" ADD COLUMN     "pred_extra_time" BOOLEAN,
ADD COLUMN     "pred_penalties" BOOLEAN,
ADD COLUMN     "pred_winner" TEXT;
