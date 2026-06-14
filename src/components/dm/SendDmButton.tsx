"use client";

import Link from "next/link";

export function SendDmButton({ userId, username }: { userId: string; username: string }) {
  return (
    <Link
      href={`/mensajes/${userId}`}
      className="rounded-lg border border-surface-light px-2 py-1 text-[10px] font-medium text-foreground/50 transition-colors hover:border-accent hover:text-accent"
      title={`Mensaje a ${username}`}
    >
      💬
    </Link>
  );
}
