import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { getInfluencers, getAllSpecialties } from "@/lib/actions/influencers";
import Link from "next/link";
import { InfluencerFilters } from "@/components/influencers/InfluencerFilters";

export const metadata: Metadata = {
  title: "Influencers",
  description: "Los mejores creadores de contenido de EA FC en español. Videos, streams y comunidad.",
};
import { CommentSection } from "@/components/influencers/CommentSection";

interface PageProps {
  searchParams: { specialty?: string };
}

export default async function InfluencersPage({ searchParams }: PageProps) {
  const [influencers, specialties] = await Promise.all([
    getInfluencers({ specialty: searchParams.specialty }),
    getAllSpecialties(),
  ]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Hub Influencers</h1>
          <p className="mt-1 text-foreground/60">
            Los mejores creadores de contenido de EA FC en español
          </p>
        </div>

        <InfluencerFilters
          specialties={specialties}
          current={searchParams.specialty}
        />

        {influencers.length === 0 ? (
          <div className="py-16 text-center text-foreground/40">
            No hay creadores registrados todavía
          </div>
        ) : (
          <div className="space-y-10">
            {influencers.map((influencer) => (
              <section key={influencer.id}>
                <Link
                  href={`/influencers/${influencer.slug}`}
                  className="mb-4 flex items-center gap-3 group"
                >
                  {influencer.avatarUrl ? (
                    <img
                      src={influencer.avatarUrl}
                      alt={influencer.name}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/20 text-lg font-bold text-accent">
                      {influencer.name[0]}
                    </div>
                  )}
                  <div>
                    <h2 className="font-bold group-hover:text-accent transition-colors">
                      {influencer.name}
                      {influencer.featured && (
                        <span className="ml-2 text-xs text-gold">★ Destacado</span>
                      )}
                    </h2>
                    <div className="flex items-center gap-2 text-xs text-foreground/50">
                      {influencer.subscribers && <span>{influencer.subscribers} subs</span>}
                      {influencer.country && (
                        <>
                          <span>·</span>
                          <span>{influencer.country}</span>
                        </>
                      )}
                      {influencer.specialty.length > 0 && (
                        <>
                          <span>·</span>
                          <span>{influencer.specialty.join(", ")}</span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>

                {influencer.videos.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {influencer.videos.map((video) => (
                      <a
                        key={video.id}
                        href={video.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Card className="cursor-pointer transition-colors hover:border-accent/50">
                          {video.thumbnailUrl ? (
                            <img
                              src={video.thumbnailUrl}
                              alt={video.title}
                              className="mb-3 aspect-video w-full rounded-lg object-cover"
                            />
                          ) : (
                            <div className="mb-3 flex aspect-video items-center justify-center rounded-lg bg-surface-light">
                              <span className="text-3xl text-foreground/20">▶</span>
                            </div>
                          )}
                          <h3 className="line-clamp-2 text-sm font-medium leading-tight">
                            {video.title}
                          </h3>
                          <div className="mt-2 flex items-center gap-2 text-xs text-foreground/50">
                            {video.views && <span>{video.views} vistas</span>}
                            <span>·</span>
                            <span>{timeAgo(video.publishedAt)}</span>
                          </div>
                        </Card>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-foreground/40">Sin videos recientes</p>
                )}

                <CommentSection influencerId={influencer.id} />
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function timeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "hoy";
  if (days === 1) return "ayer";
  if (days < 7) return `hace ${days} días`;
  if (days < 30) return `hace ${Math.floor(days / 7)} semanas`;
  return `hace ${Math.floor(days / 30)} meses`;
}
