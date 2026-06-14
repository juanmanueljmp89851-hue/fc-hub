import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { getConversations } from "@/lib/actions/dm";
import { getCurrentUser } from "@/lib/actions/user";

export const metadata: Metadata = {
  title: "Mensajes",
  description: "Tus mensajes directos en Modo Fosa.",
};

function timeAgo(date: Date) {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "ahora";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(date).toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

export default async function MensajesPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");

  const conversations = await getConversations();

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">Mensajes</h1>

        {conversations.length === 0 ? (
          <Card className="py-12 text-center">
            <span className="mb-4 block text-5xl">💬</span>
            <h3 className="mb-2 text-lg font-bold">Sin mensajes</h3>
            <p className="text-sm text-foreground/60">
              Enviá un mensaje desde el perfil de cualquier usuario
            </p>
          </Card>
        ) : (
          <div className="space-y-1">
            {conversations.map((conv) => (
              <Link
                key={conv.partnerId}
                href={`/mensajes/${conv.partnerId}`}
                className="flex items-center gap-3 rounded-lg border border-surface-light p-3 transition-colors hover:border-accent/50 hover:bg-surface-light/50"
              >
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-surface">
                  {conv.partnerAvatar ? (
                    <Image src={conv.partnerAvatar} alt="" fill className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg text-foreground/30">👤</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{conv.partnerUsername}</span>
                    <span className="text-xs text-foreground/40">{timeAgo(conv.lastDate)}</span>
                  </div>
                  <p className="truncate text-sm text-foreground/50">{conv.lastMessage}</p>
                </div>
                {conv.unreadCount > 0 && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-background">
                    {conv.unreadCount}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
