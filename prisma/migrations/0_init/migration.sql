-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PLAYER', 'ADMIN');

-- CreateEnum
CREATE TYPE "TournamentFormat" AS ENUM ('SINGLE_ELIMINATION', 'DOUBLE_ELIMINATION', 'LEAGUE', 'GROUP_KNOCKOUT');

-- CreateEnum
CREATE TYPE "KnockoutSeeding" AS ENUM ('RANDOM', 'TRADITIONAL');

-- CreateEnum
CREATE TYPE "PlayoffRule" AS ENUM ('PENALTIES', 'GOLDEN_GOAL', 'EXTRA_TIME');

-- CreateEnum
CREATE TYPE "KnockoutFormat" AS ENUM ('SINGLE_MATCH', 'TWO_LEG', 'BEST_OF_3', 'BEST_OF_5', 'TWO_LEG_PENALTIES', 'TWO_LEG_EXTRA_PENALTIES');

-- CreateEnum
CREATE TYPE "DrawUntilStage" AS ENUM ('INITIAL_ONLY', 'QUARTERFINALS', 'SEMIFINALS', 'FINAL');

-- CreateEnum
CREATE TYPE "TournamentStatus" AS ENUM ('DRAFT', 'REGISTRATION', 'IN_PROGRESS', 'FINISHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('PS5', 'XBOX', 'PC');

-- CreateEnum
CREATE TYPE "TeamType" AS ENUM ('ULTIMATE_TEAM', 'REAL_TEAMS', 'FUT_CHAMPIONS');

-- CreateEnum
CREATE TYPE "TournamentVisibility" AS ENUM ('PUBLIC', 'PRIVATE_LINK', 'INVITE_ONLY');

-- CreateEnum
CREATE TYPE "VerificationLevel" AS ENUM ('NONE', 'VERIFIED_ORGANIZER', 'OFFICIAL');

-- CreateEnum
CREATE TYPE "ParticipantStatus" AS ENUM ('PENDING', 'CONFIRMED', 'WAITLIST', 'REJECTED', 'DISQUALIFIED');

-- CreateEnum
CREATE TYPE "BracketType" AS ENUM ('WINNERS', 'LOSERS', 'GRAND_FINAL');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('SCHEDULED', 'READY_P1', 'READY_P2', 'IN_PROGRESS', 'PENDING_CONFIRMATION', 'DISPUTED', 'FINISHED', 'WALKOVER', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'RESOLVED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "CasualMatchStatus" AS ENUM ('PENDING', 'ACCEPTED', 'IN_PROGRESS', 'PENDING_CONFIRMATION', 'DISPUTED', 'FINISHED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProdeStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'FINISHED');

-- CreateEnum
CREATE TYPE "ProdeVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "ProdeParticipantRole" AS ENUM ('MEMBER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ProdeRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ProdeWeekStatus" AS ENUM ('UPCOMING', 'OPEN', 'CLOSED', 'SCORED');

-- CreateEnum
CREATE TYPE "ProdeMatchStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'FINISHED');

-- CreateEnum
CREATE TYPE "ExternalGameMode" AS ENUM ('CLUBS_PRO', 'ULTIMATE_TEAM', 'SEASONS', 'MIXED');

-- CreateEnum
CREATE TYPE "ExternalFetchSource" AS ENUM ('MANUAL', 'SCRAPER_IESA', 'SCRAPER_ELPF', 'API_VPG', 'SCRAPER_CUSTOM');

-- CreateEnum
CREATE TYPE "ExternalSeasonStatus" AS ENUM ('UPCOMING', 'IN_PROGRESS', 'FINISHED');

-- CreateEnum
CREATE TYPE "ExternalMatchStatus" AS ENUM ('SCHEDULED', 'FINISHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('TOURNAMENT_INSCRIPTION', 'TOURNAMENT_STARTING', 'TOURNAMENT_JOIN_REQUEST', 'TOURNAMENT_JOIN_ACCEPTED', 'TOURNAMENT_JOIN_REJECTED', 'MATCH_ASSIGNED', 'RESULT_LOADED', 'RESULT_VALIDATED', 'DISPUTE_OPENED', 'ADVANCED_ROUND', 'ELIMINATED', 'TOURNAMENT_FINISHED', 'CASUAL_CHALLENGE', 'CASUAL_RESULT', 'PRODE_DEADLINE', 'PRODE_SCORED', 'PRODE_JOIN_REQUEST', 'PRODE_JOIN_ACCEPTED', 'PRODE_JOIN_REJECTED', 'SANCTION', 'ADMIN_MESSAGE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "avatar_url" TEXT,
    "bio" TEXT,
    "supabase_id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'PLAYER',
    "reputation_points" INTEGER NOT NULL DEFAULT 100,
    "ranking_points" INTEGER NOT NULL DEFAULT 0,
    "psn_username" TEXT,
    "xbox_username" TEXT,
    "pc_username" TEXT,
    "favorite_team" TEXT,
    "nationality" TEXT,
    "phone" TEXT,
    "location" TEXT,
    "profile_completed" BOOLEAN NOT NULL DEFAULT false,
    "banned" BOOLEAN NOT NULL DEFAULT false,
    "banned_reason" TEXT,
    "banned_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournaments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "rules" TEXT,
    "format" "TournamentFormat" NOT NULL,
    "league_legs" INTEGER,
    "status" "TournamentStatus" NOT NULL DEFAULT 'DRAFT',
    "max_players" INTEGER NOT NULL,
    "platforms" "Platform"[],
    "team_type" "TeamType" NOT NULL DEFAULT 'ULTIMATE_TEAM',
    "start_date" TIMESTAMP(3),
    "registration_open" TIMESTAMP(3),
    "registration_deadline" TIMESTAMP(3),
    "prize" TEXT,
    "visibility" "TournamentVisibility" NOT NULL DEFAULT 'PUBLIC',
    "verification_level" "VerificationLevel" NOT NULL DEFAULT 'NONE',
    "logo_url" TEXT,
    "banner_url" TEXT,
    "requires_verification" BOOLEAN NOT NULL DEFAULT false,
    "match_time" TEXT,
    "difficulty" TEXT,
    "controls" TEXT,
    "game_mode" TEXT,
    "stadium" TEXT,
    "group_count" INTEGER,
    "qualify_per_group" INTEGER,
    "knockout_seeding" "KnockoutSeeding" NOT NULL DEFAULT 'RANDOM',
    "random_draw_until" "DrawUntilStage" NOT NULL DEFAULT 'FINAL',
    "has_losers_bracket" BOOLEAN NOT NULL DEFAULT false,
    "third_place_match" BOOLEAN NOT NULL DEFAULT false,
    "playoff_rule" "PlayoffRule" NOT NULL DEFAULT 'PENALTIES',
    "knockout_format" "KnockoutFormat" NOT NULL DEFAULT 'SINGLE_MATCH',
    "require_proof" BOOLEAN NOT NULL DEFAULT false,
    "schedule_days" TEXT[],
    "schedule_time_mode" TEXT,
    "schedule_time" TEXT,
    "wait_time_minutes" INTEGER,
    "relegation_count" INTEGER,
    "cup1_name" TEXT,
    "cup1_spots" INTEGER,
    "cup2_name" TEXT,
    "cup2_spots" INTEGER,
    "created_by" TEXT NOT NULL,
    "cancelled_at" TIMESTAMP(3),
    "cancel_reason" TEXT,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_participants" (
    "id" TEXT NOT NULL,
    "tournament_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "ParticipantStatus" NOT NULL DEFAULT 'PENDING',
    "position_final" INTEGER,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmed_at" TIMESTAMP(3),

    CONSTRAINT "tournament_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_waitlist" (
    "id" TEXT NOT NULL,
    "tournament_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tournament_waitlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_matches" (
    "id" TEXT NOT NULL,
    "tournament_id" TEXT NOT NULL,
    "player1_id" TEXT,
    "player2_id" TEXT,
    "result_p1" INTEGER,
    "result_p2" INTEGER,
    "winner_id" TEXT,
    "round" TEXT,
    "bracket" "BracketType",
    "leg" INTEGER,
    "series_id" TEXT,
    "matchday" INTEGER,
    "group_name" TEXT,
    "status" "MatchStatus" NOT NULL DEFAULT 'SCHEDULED',
    "deadline" TIMESTAMP(3),
    "confirmed_at" TIMESTAMP(3),
    "proof_image_url" TEXT,
    "proof_image_urls" TEXT[],
    "dispute_count_p1" INTEGER NOT NULL DEFAULT 0,
    "dispute_count_p2" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 0,
    "scheduled_time" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tournament_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "league_standings" (
    "id" TEXT NOT NULL,
    "tournament_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "played" INTEGER NOT NULL DEFAULT 0,
    "won" INTEGER NOT NULL DEFAULT 0,
    "drawn" INTEGER NOT NULL DEFAULT 0,
    "lost" INTEGER NOT NULL DEFAULT 0,
    "goals_for" INTEGER NOT NULL DEFAULT 0,
    "goals_against" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "league_standings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_disputes" (
    "id" TEXT NOT NULL,
    "match_id" TEXT NOT NULL,
    "tournament_id" TEXT NOT NULL,
    "opened_by" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "evidence_urls" TEXT[],
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "resolved_by" TEXT,
    "resolution_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "tournament_disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_messages" (
    "id" TEXT NOT NULL,
    "tournament_match_id" TEXT,
    "casual_match_id" TEXT,
    "user_id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_audit_log" (
    "id" TEXT NOT NULL,
    "tournament_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performed_by" TEXT NOT NULL,
    "details" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tournament_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sanctions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "points_deducted" INTEGER NOT NULL,
    "sanctioned_by" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sanctions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "casual_matches" (
    "id" TEXT NOT NULL,
    "challenger_id" TEXT NOT NULL,
    "challenged_id" TEXT NOT NULL,
    "status" "CasualMatchStatus" NOT NULL DEFAULT 'PENDING',
    "result_challenger" INTEGER,
    "result_challenged" INTEGER,
    "proof_image_url" TEXT,
    "winner_id" TEXT,
    "points_awarded" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmed_at" TIMESTAMP(3),

    CONSTRAINT "casual_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ranking_history" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "casual_match_id" TEXT,
    "tournament_match_id" TEXT,
    "points_change" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ranking_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prodes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_by" TEXT NOT NULL,
    "share_code" TEXT NOT NULL,
    "status" "ProdeStatus" NOT NULL DEFAULT 'OPEN',
    "visibility" "ProdeVisibility" NOT NULL DEFAULT 'PUBLIC',
    "image_url" TEXT,
    "banner_url" TEXT,
    "prize_general" TEXT,
    "prize_per_week" TEXT,
    "prize_group_order" TEXT,
    "prize_rounds" TEXT,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prode_participants" (
    "id" TEXT NOT NULL,
    "prode_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "ProdeParticipantRole" NOT NULL DEFAULT 'MEMBER',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prode_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prode_join_requests" (
    "id" TEXT NOT NULL,
    "prode_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "ProdeRequestStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    "resolved_by" TEXT,

    CONSTRAINT "prode_join_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prode_weeks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "status" "ProdeWeekStatus" NOT NULL DEFAULT 'UPCOMING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prode_weeks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prode_matches" (
    "id" TEXT NOT NULL,
    "week_id" TEXT NOT NULL,
    "external_id" INTEGER,
    "home_team" TEXT NOT NULL,
    "away_team" TEXT NOT NULL,
    "home_score" INTEGER,
    "away_score" INTEGER,
    "match_date" TIMESTAMP(3) NOT NULL,
    "venue" TEXT,
    "stage" TEXT,
    "group" TEXT,
    "status" "ProdeMatchStatus" NOT NULL DEFAULT 'SCHEDULED',

    CONSTRAINT "prode_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prode_predictions" (
    "id" TEXT NOT NULL,
    "prode_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "match_id" TEXT NOT NULL,
    "pred_home_score" INTEGER NOT NULL,
    "pred_away_score" INTEGER NOT NULL,
    "points_earned" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prode_predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prode_group_predictions" (
    "id" TEXT NOT NULL,
    "prode_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "group_name" TEXT NOT NULL,
    "first" TEXT NOT NULL,
    "second" TEXT NOT NULL,
    "third" TEXT NOT NULL,
    "fourth" TEXT NOT NULL,
    "points_earned" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prode_group_predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prode_advance_predictions" (
    "id" TEXT NOT NULL,
    "prode_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "round" TEXT NOT NULL,
    "teams" TEXT[],
    "points_earned" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prode_advance_predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prode_messages" (
    "id" TEXT NOT NULL,
    "prode_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prode_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_leagues" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "logo_url" TEXT,
    "website_url" TEXT,
    "instagram_url" TEXT,
    "discord_url" TEXT,
    "platform" "Platform"[],
    "game_mode" "ExternalGameMode" NOT NULL DEFAULT 'CLUBS_PRO',
    "country" TEXT NOT NULL DEFAULT 'Argentina',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "fetch_source" "ExternalFetchSource" NOT NULL DEFAULT 'MANUAL',
    "fetch_url" TEXT,
    "fetch_config" TEXT,
    "last_fetch_at" TIMESTAMP(3),
    "fetch_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "external_leagues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_seasons" (
    "id" TEXT NOT NULL,
    "league_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ExternalSeasonStatus" NOT NULL DEFAULT 'UPCOMING',
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "external_seasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_standings" (
    "id" TEXT NOT NULL,
    "season_id" TEXT NOT NULL,
    "team_name" TEXT NOT NULL,
    "division" TEXT,
    "position" INTEGER NOT NULL,
    "played" INTEGER NOT NULL DEFAULT 0,
    "won" INTEGER NOT NULL DEFAULT 0,
    "drawn" INTEGER NOT NULL DEFAULT 0,
    "lost" INTEGER NOT NULL DEFAULT 0,
    "goals_for" INTEGER NOT NULL DEFAULT 0,
    "goals_against" INTEGER NOT NULL DEFAULT 0,
    "points" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_standings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_matches" (
    "id" TEXT NOT NULL,
    "season_id" TEXT NOT NULL,
    "home_team" TEXT NOT NULL,
    "away_team" TEXT NOT NULL,
    "home_score" INTEGER,
    "away_score" INTEGER,
    "round" TEXT,
    "match_date" TIMESTAMP(3),
    "status" "ExternalMatchStatus" NOT NULL DEFAULT 'SCHEDULED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "external_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "influencers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "youtube_channel_id" TEXT,
    "twitch_username" TEXT,
    "twitter_handle" TEXT,
    "instagram_handle" TEXT,
    "tiktok_handle" TEXT,
    "avatar_url" TEXT,
    "banner_url" TEXT,
    "subscribers" TEXT,
    "country" TEXT,
    "specialty" TEXT[],
    "platforms" TEXT[],
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "influencers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "influencer_videos" (
    "id" TEXT NOT NULL,
    "influencer_id" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "video_url" TEXT NOT NULL,
    "views" TEXT,
    "published_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "influencer_videos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "related_id" TEXT,
    "link_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lobby_messages" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lobby_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "influencer_comments" (
    "id" TEXT NOT NULL,
    "influencer_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "influencer_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fut_cards" (
    "id" TEXT NOT NULL,
    "ea_id" INTEGER NOT NULL,
    "futbin_id" INTEGER,
    "name" TEXT NOT NULL,
    "common_name" TEXT,
    "overall" INTEGER NOT NULL,
    "position" TEXT NOT NULL,
    "alt_positions" TEXT[],
    "pace" INTEGER NOT NULL DEFAULT 0,
    "shooting" INTEGER NOT NULL DEFAULT 0,
    "passing" INTEGER NOT NULL DEFAULT 0,
    "dribbling" INTEGER NOT NULL DEFAULT 0,
    "defending" INTEGER NOT NULL DEFAULT 0,
    "physical" INTEGER NOT NULL DEFAULT 0,
    "gk_diving" INTEGER,
    "gk_handling" INTEGER,
    "gk_kicking" INTEGER,
    "gk_reflexes" INTEGER,
    "gk_speed" INTEGER,
    "gk_positioning" INTEGER,
    "club" TEXT NOT NULL,
    "league" TEXT NOT NULL,
    "nation" TEXT NOT NULL,
    "nation_code" TEXT,
    "card_type" TEXT NOT NULL,
    "promo" TEXT,
    "promo_order" INTEGER NOT NULL DEFAULT 0,
    "release_date" TIMESTAMP(3),
    "card_image_id" TEXT,
    "image_url" TEXT,
    "skill_moves" INTEGER,
    "weak_foot" INTEGER,
    "foot" TEXT,
    "height" INTEGER,
    "weight" INTEGER,
    "work_rate_atk" TEXT,
    "work_rate_def" TEXT,
    "price_ps" INTEGER,
    "price_xbox" INTEGER,
    "price_pc" INTEGER,
    "futbin_rating" DOUBLE PRECISION,
    "source" TEXT NOT NULL DEFAULT 'futbin',
    "source_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fut_cards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_supabase_id_key" ON "users"("supabase_id");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_participants_tournament_id_user_id_key" ON "tournament_participants"("tournament_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_waitlist_tournament_id_user_id_key" ON "tournament_waitlist"("tournament_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "league_standings_tournament_id_user_id_key" ON "league_standings"("tournament_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "prodes_share_code_key" ON "prodes"("share_code");

-- CreateIndex
CREATE UNIQUE INDEX "prode_participants_prode_id_user_id_key" ON "prode_participants"("prode_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "prode_join_requests_prode_id_user_id_key" ON "prode_join_requests"("prode_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "prode_matches_external_id_key" ON "prode_matches"("external_id");

-- CreateIndex
CREATE UNIQUE INDEX "prode_predictions_prode_id_user_id_match_id_key" ON "prode_predictions"("prode_id", "user_id", "match_id");

-- CreateIndex
CREATE UNIQUE INDEX "prode_group_predictions_prode_id_user_id_group_name_key" ON "prode_group_predictions"("prode_id", "user_id", "group_name");

-- CreateIndex
CREATE UNIQUE INDEX "prode_advance_predictions_prode_id_user_id_round_key" ON "prode_advance_predictions"("prode_id", "user_id", "round");

-- CreateIndex
CREATE INDEX "prode_messages_prode_id_created_at_idx" ON "prode_messages"("prode_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "external_leagues_name_key" ON "external_leagues"("name");

-- CreateIndex
CREATE UNIQUE INDEX "external_leagues_slug_key" ON "external_leagues"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "external_standings_season_id_team_name_key" ON "external_standings"("season_id", "team_name");

-- CreateIndex
CREATE UNIQUE INDEX "influencers_slug_key" ON "influencers"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "influencers_youtube_channel_id_key" ON "influencers"("youtube_channel_id");

-- CreateIndex
CREATE UNIQUE INDEX "influencer_videos_external_id_key" ON "influencer_videos"("external_id");

-- CreateIndex
CREATE INDEX "lobby_messages_created_at_idx" ON "lobby_messages"("created_at");

-- CreateIndex
CREATE INDEX "influencer_comments_influencer_id_created_at_idx" ON "influencer_comments"("influencer_id", "created_at");

-- CreateIndex
CREATE INDEX "fut_cards_promo_promo_order_idx" ON "fut_cards"("promo", "promo_order");

-- CreateIndex
CREATE INDEX "fut_cards_overall_idx" ON "fut_cards"("overall");

-- CreateIndex
CREATE INDEX "fut_cards_card_type_idx" ON "fut_cards"("card_type");

-- CreateIndex
CREATE INDEX "fut_cards_release_date_idx" ON "fut_cards"("release_date");

-- CreateIndex
CREATE UNIQUE INDEX "fut_cards_ea_id_card_type_key" ON "fut_cards"("ea_id", "card_type");

-- AddForeignKey
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_participants" ADD CONSTRAINT "tournament_participants_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_participants" ADD CONSTRAINT "tournament_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_waitlist" ADD CONSTRAINT "tournament_waitlist_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_waitlist" ADD CONSTRAINT "tournament_waitlist_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_player1_id_fkey" FOREIGN KEY ("player1_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_player2_id_fkey" FOREIGN KEY ("player2_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_matches" ADD CONSTRAINT "tournament_matches_winner_id_fkey" FOREIGN KEY ("winner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_standings" ADD CONSTRAINT "league_standings_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_standings" ADD CONSTRAINT "league_standings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_disputes" ADD CONSTRAINT "tournament_disputes_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "tournament_matches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_disputes" ADD CONSTRAINT "tournament_disputes_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_disputes" ADD CONSTRAINT "tournament_disputes_opened_by_fkey" FOREIGN KEY ("opened_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_disputes" ADD CONSTRAINT "tournament_disputes_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_messages" ADD CONSTRAINT "match_messages_tournament_match_id_fkey" FOREIGN KEY ("tournament_match_id") REFERENCES "tournament_matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_messages" ADD CONSTRAINT "match_messages_casual_match_id_fkey" FOREIGN KEY ("casual_match_id") REFERENCES "casual_matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_messages" ADD CONSTRAINT "match_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_audit_log" ADD CONSTRAINT "tournament_audit_log_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_audit_log" ADD CONSTRAINT "tournament_audit_log_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sanctions" ADD CONSTRAINT "user_sanctions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sanctions" ADD CONSTRAINT "user_sanctions_sanctioned_by_fkey" FOREIGN KEY ("sanctioned_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "casual_matches" ADD CONSTRAINT "casual_matches_challenger_id_fkey" FOREIGN KEY ("challenger_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "casual_matches" ADD CONSTRAINT "casual_matches_challenged_id_fkey" FOREIGN KEY ("challenged_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "casual_matches" ADD CONSTRAINT "casual_matches_winner_id_fkey" FOREIGN KEY ("winner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ranking_history" ADD CONSTRAINT "ranking_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ranking_history" ADD CONSTRAINT "ranking_history_casual_match_id_fkey" FOREIGN KEY ("casual_match_id") REFERENCES "casual_matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ranking_history" ADD CONSTRAINT "ranking_history_tournament_match_id_fkey" FOREIGN KEY ("tournament_match_id") REFERENCES "tournament_matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prodes" ADD CONSTRAINT "prodes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prode_participants" ADD CONSTRAINT "prode_participants_prode_id_fkey" FOREIGN KEY ("prode_id") REFERENCES "prodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prode_participants" ADD CONSTRAINT "prode_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prode_join_requests" ADD CONSTRAINT "prode_join_requests_prode_id_fkey" FOREIGN KEY ("prode_id") REFERENCES "prodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prode_join_requests" ADD CONSTRAINT "prode_join_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prode_join_requests" ADD CONSTRAINT "prode_join_requests_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prode_matches" ADD CONSTRAINT "prode_matches_week_id_fkey" FOREIGN KEY ("week_id") REFERENCES "prode_weeks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prode_predictions" ADD CONSTRAINT "prode_predictions_prode_id_fkey" FOREIGN KEY ("prode_id") REFERENCES "prodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prode_predictions" ADD CONSTRAINT "prode_predictions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prode_predictions" ADD CONSTRAINT "prode_predictions_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "prode_matches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prode_group_predictions" ADD CONSTRAINT "prode_group_predictions_prode_id_fkey" FOREIGN KEY ("prode_id") REFERENCES "prodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prode_group_predictions" ADD CONSTRAINT "prode_group_predictions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prode_advance_predictions" ADD CONSTRAINT "prode_advance_predictions_prode_id_fkey" FOREIGN KEY ("prode_id") REFERENCES "prodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prode_advance_predictions" ADD CONSTRAINT "prode_advance_predictions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prode_messages" ADD CONSTRAINT "prode_messages_prode_id_fkey" FOREIGN KEY ("prode_id") REFERENCES "prodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prode_messages" ADD CONSTRAINT "prode_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_seasons" ADD CONSTRAINT "external_seasons_league_id_fkey" FOREIGN KEY ("league_id") REFERENCES "external_leagues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_standings" ADD CONSTRAINT "external_standings_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "external_seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_matches" ADD CONSTRAINT "external_matches_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "external_seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "influencer_videos" ADD CONSTRAINT "influencer_videos_influencer_id_fkey" FOREIGN KEY ("influencer_id") REFERENCES "influencers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lobby_messages" ADD CONSTRAINT "lobby_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "influencer_comments" ADD CONSTRAINT "influencer_comments_influencer_id_fkey" FOREIGN KEY ("influencer_id") REFERENCES "influencers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "influencer_comments" ADD CONSTRAINT "influencer_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

