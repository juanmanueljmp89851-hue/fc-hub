-- CreateTable
CREATE TABLE "tournament_messages" (
    "id" TEXT NOT NULL,
    "tournament_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tournament_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tournament_messages_tournament_id_created_at_idx" ON "tournament_messages"("tournament_id", "created_at");

-- AddForeignKey
ALTER TABLE "tournament_messages" ADD CONSTRAINT "tournament_messages_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_messages" ADD CONSTRAINT "tournament_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
