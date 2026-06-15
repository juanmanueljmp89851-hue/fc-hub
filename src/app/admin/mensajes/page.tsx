import { adminGetAllConversations } from "@/lib/actions/dm";

export default async function AdminMensajesPage() {
  const messages = await adminGetAllConversations();

  const grouped = new Map<string, typeof messages>();
  for (const msg of messages) {
    const key = [msg.sender.id, msg.receiver.id].sort().join("-");
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(msg);
  }

  const conversations = Array.from(grouped.entries()).map(([key, msgs]) => ({
    key,
    user1: msgs[0].sender,
    user2: msgs[0].receiver,
    messages: msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    lastDate: msgs[0].createdAt,
  }));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Mensajes Directos</h1>
      <p className="mb-4 text-sm text-foreground/50">Últimos 500 mensajes entre usuarios</p>

      {conversations.length === 0 ? (
        <p className="py-12 text-center text-foreground/40">Sin mensajes</p>
      ) : (
        <div className="space-y-4">
          {conversations.map((conv) => (
            <div key={conv.key} className="rounded-xl border border-surface-light bg-surface p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-bold">
                <span className="text-accent">{conv.user1.username}</span>
                <span className="text-foreground/30">↔</span>
                <span className="text-accent">{conv.user2.username}</span>
                <span className="ml-auto text-xs text-foreground/30">{conv.messages.length} msgs</span>
              </div>
              <div className="max-h-60 space-y-1.5 overflow-y-auto">
                {conv.messages.map((msg) => (
                  <div key={msg.id} className="flex gap-2 text-xs">
                    <span className="shrink-0 font-semibold text-foreground/60">{msg.sender.username}:</span>
                    <span className="text-foreground/80">{msg.text}</span>
                    <span className="ml-auto shrink-0 text-foreground/20">
                      {new Date(msg.createdAt).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
