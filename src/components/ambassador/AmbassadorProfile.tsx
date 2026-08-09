"use client";

import Link from "next/link";
import { ShareButtons } from "./ShareButtons";

interface AmbassadorData {
  referralCode: string;
  totalReferrals: number;
  activeReferrals: number;
  totalBengalas: number;
  rankPosition: number;
  titlesWon: string[];
  periodActiveRefs: number;
  activePeriodName: string | null;
  bengalas: {
    id: string;
    amount: number;
    reason: string;
    referredUsername: string | null;
    createdAt: string;
  }[];
}

const REASON_LABELS: Record<string, string> = {
  REFERRAL_ACTIVE: "Referido activo",
  REFERRAL_TOURNAMENT: "Referido participó en torneo",
  REFERRAL_PRODE: "Referido creó Prode",
  REFERRAL_ORGANIZED: "Referido organizó torneo",
};

export function AmbassadorProfile({ data }: { data: AmbassadorData }) {
  return (
    <div className="space-y-4 rounded-xl border border-accent/20 bg-accent/5 p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/20 text-2xl">
            🔥
          </div>
          <div>
            <h2 className="text-lg font-bold">Embajador</h2>
            <p className="text-xs text-foreground/50">Expandí La Fosa</p>
          </div>
        </div>
        {data.titlesWon.length > 0 && (
          <div className="flex items-center gap-1 rounded-full bg-gold/10 px-3 py-1">
            <span>🏆</span>
            <span className="text-sm font-bold text-gold">{data.titlesWon.length}x Embajador del Mes</span>
          </div>
        )}
      </div>

      {/* Active period banner */}
      {data.activePeriodName && (
        <Link
          href="/embajadores"
          className="block rounded-lg border border-accent/30 bg-accent/10 p-3 transition-colors hover:bg-accent/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-accent/60">Período activo</p>
              <p className="font-bold text-accent">{data.activePeriodName}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-accent">{data.periodActiveRefs}</p>
              <p className="text-xs text-foreground/50">referidos este mes</p>
            </div>
          </div>
        </Link>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg bg-background/50 p-3 text-center">
          <p className="text-2xl font-black text-accent">{data.totalReferrals}</p>
          <p className="text-xs text-foreground/50">Referidos</p>
        </div>
        <div className="rounded-lg bg-background/50 p-3 text-center">
          <p className="text-2xl font-black text-accent">{data.activeReferrals}</p>
          <p className="text-xs text-foreground/50">Activos</p>
        </div>
        <div className="rounded-lg bg-background/50 p-3 text-center">
          <p className="text-2xl font-black text-gold">{data.totalBengalas}</p>
          <p className="text-xs text-foreground/50">Bengalas</p>
        </div>
        <div className="rounded-lg bg-background/50 p-3 text-center">
          <p className="text-2xl font-black text-foreground/80">#{data.rankPosition}</p>
          <p className="text-xs text-foreground/50">Ranking</p>
        </div>
      </div>

      {/* Code */}
      <div className="rounded-lg bg-background/50 p-3">
        <p className="mb-1 text-xs font-bold uppercase text-foreground/40">Tu código</p>
        <p className="font-mono text-lg font-black text-accent">{data.referralCode}</p>
      </div>

      {/* Share */}
      <ShareButtons referralCode={data.referralCode} />

      {/* Bengala history */}
      {data.bengalas.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-bold text-foreground/50">Historial de bengalas</h3>
          <div className="max-h-60 space-y-1 overflow-y-auto">
            {data.bengalas.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between rounded-lg bg-background/50 px-3 py-2 text-sm"
              >
                <div>
                  <span className="font-bold text-accent">+{b.amount}</span>
                  <span className="ml-2 text-foreground/60">
                    {REASON_LABELS[b.reason] ?? b.reason}
                  </span>
                  {b.referredUsername && (
                    <span className="ml-1 text-foreground/40">({b.referredUsername})</span>
                  )}
                </div>
                <span className="text-xs text-foreground/30">
                  {new Date(b.createdAt).toLocaleDateString("es-AR")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
