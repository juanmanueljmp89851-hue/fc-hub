import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { getConversation } from "@/lib/actions/dm";
import { getCurrentUser } from "@/lib/actions/user";
import { isBlocked } from "@/lib/actions/block";
import { DmChatInput } from "@/components/dm/DmChatInput";
import { DmMessages } from "@/components/dm/DmMessages";
import { DmActions } from "@/components/dm/DmActions";

export const metadata: Metadata = {
  title: "Mensajes",
};

export default async function ConversationPage({ params }: { params: { userId: string } }) {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");

  const { messages, partner, currentUserId } = await getConversation(params.userId);
  if (!partner) redirect("/mensajes");

  const blocked = await isBlocked(params.userId);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-8">
        {/* Header */}
        <div className="relative mb-4 flex items-center gap-3">
          <Link href="/mensajes" className="text-foreground/50 transition-colors hover:text-accent">
            ← Mensajes
          </Link>
          <div className="relative h-8 w-8 overflow-hidden rounded-full bg-surface">
            {partner.avatarUrl ? (
              <Image src={partner.avatarUrl} alt="" fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-foreground/30">👤</div>
            )}
          </div>
          <span className="font-bold">{partner.username}</span>
          <div className="ml-auto">
            <DmActions partnerId={params.userId} partnerUsername={partner.username} isBlockedInitial={blocked} />
          </div>
        </div>

        <div className="flex flex-col overflow-hidden rounded-xl border border-surface-light bg-surface" style={{ height: "calc(100vh - 200px)" }}>
          <DmMessages messages={messages} currentUserId={currentUserId ?? ""} />
          {blocked ? (
            <div className="border-t border-surface-light p-3 text-center text-xs text-foreground/40">
              Usuario bloqueado — no podés enviar ni recibir mensajes
            </div>
          ) : (
            <DmChatInput receiverId={params.userId} />
          )}
        </div>
      </main>
    </div>
  );
}
