import Link from "next/link";
import Image from "next/image";
import type { SbcSet } from "@/lib/futgg";
import { fmtCoins, timeLeft } from "@/lib/format";

export function HomeSbcs({ sbcs }: { sbcs: SbcSet[] }) {
  if (!sbcs.length) return null;

  return (
    <section className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">SBC del día</h2>
          <p className="text-xs text-foreground/40">
            Squad Building Challenges activos
          </p>
        </div>
        <Link
          href="/sbc"
          className="text-xs font-semibold text-accent hover:underline"
        >
          Ver todos &rarr;
        </Link>
      </div>

      <div className="relative">
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth scrollbar-thin scrollbar-track-transparent scrollbar-thumb-surface-light touch-pan-x">
          {sbcs.map((sbc) => (
            <Link
              key={sbc.id}
              href={`/sbc/${sbc.slug}`}
              className="group flex w-[200px] flex-shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-surface-light bg-surface/30 transition-colors hover:border-accent/40"
            >
              <div className="relative flex items-center justify-center bg-gradient-to-b from-surface-light/30 to-transparent px-3 pt-4 pb-2">
                {sbc.isNew && (
                  <span className="absolute left-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[9px] font-bold text-background">
                    NUEVO
                  </span>
                )}
                {sbc.imageUrl ?? sbc.iconUrl ? (
                  <Image
                    src={(sbc.imageUrl ?? sbc.iconUrl)!}
                    alt={sbc.rewardPlayer?.commonName ?? sbc.name}
                    width={112}
                    height={112}
                    className="h-28 w-auto object-contain drop-shadow-lg"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-28 w-20 items-center justify-center rounded-lg bg-surface-light text-2xl">
                    🎁
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col gap-1.5 p-3">
                <h3 className="text-xs font-bold leading-tight line-clamp-2">
                  {sbc.name}
                </h3>

                {sbc.rewardPlayer && (
                  <span className="text-[10px] font-bold text-accent">
                    {sbc.rewardPlayer.overall} OVR
                  </span>
                )}

                <div className="mt-auto grid grid-cols-2 gap-1.5 text-[10px]">
                  <div className="rounded-md bg-background/50 px-2 py-1">
                    <span className="block text-[9px] uppercase text-foreground/40">
                      Costo
                    </span>
                    <span className="font-bold text-gold">
                      {sbc.cheapestTotal != null
                        ? fmtCoins(sbc.cheapestTotal)
                        : fmtCoins(sbc.cost)}
                    </span>
                  </div>
                  <div className="rounded-md bg-background/50 px-2 py-1">
                    <span className="block text-[9px] uppercase text-foreground/40">
                      Vence
                    </span>
                    <span className="font-bold text-foreground/80">
                      {timeLeft(sbc.endTime)}
                    </span>
                  </div>
                </div>

                <span className="mt-1 rounded-md bg-accent/10 py-1 text-center text-[10px] font-bold text-accent transition-colors group-hover:bg-accent group-hover:text-background">
                  Ver SBC →
                </span>
              </div>
            </Link>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent" />
      </div>
    </section>
  );
}
