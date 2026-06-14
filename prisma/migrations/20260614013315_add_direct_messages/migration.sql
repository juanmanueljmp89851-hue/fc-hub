-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'DIRECT_MESSAGE';

-- CreateTable
CREATE TABLE "direct_messages" (
    "id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "receiver_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "direct_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "direct_messages_sender_id_receiver_id_created_at_idx" ON "direct_messages"("sender_id", "receiver_id", "created_at");

-- CreateIndex
CREATE INDEX "direct_messages_receiver_id_read_idx" ON "direct_messages"("receiver_id", "read");

-- AddForeignKey
ALTER TABLE "direct_messages" ADD CONSTRAINT "direct_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_messages" ADD CONSTRAINT "direct_messages_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
