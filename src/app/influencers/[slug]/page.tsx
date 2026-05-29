import Image from "next/image";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { getInfluencerBySlug } from "@/lib/actions/influencers";
import Link from "next/link";

interface PageProps {
  params: { slug: string };
}

export default async function InfluencerDetailPage({ params }: PageProps) {
  const influencer = await getInfluencerBySlug(params.slug);

  if (!influencer) {
    notFound();
  }

  const socials = [
    { key: "youtube", url: influencer.youtubeChannelId ? `https://youtube.com/channel/${influencer.youtubeChannelId}` : null, label: "YouTube" },
    { key: "twitch", url: influencer.twitchUsername ? `https://twitch.tv/${influencer.twitchUsername}` : null, label: "Twitch" },
    { key: "twitter", url: influencer.twitterHandle ? `https://twitter.com/${influencer.twitterHandle}` : null, label: "Twitter" },
    { key: "instagram", url: influencer.instagramHandle ? `https://instagram.com/${influencer.instagramHandle}` : null, label: "Instagram" },
    { key: "tiktok", url: influencer.tiktokHandle ? `https://tiktok.com/@${influencer.tiktokHandle}` : null, label: "TikTok" },
  ].filter((s) => s.url);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Link
          href="/influencers"
          className="mb-6 inline-flex items-center text-sm text-foreground/50 hover:text-accent"
        >
          ← Volver a Streamers
        </Link>

        {/* Banner + Avatar */}
        <div className="relative mb-8 overflow-hidden rounded-xl">
          {influencer.bannerUrl ? (
            <div className="relative h-40 w-full sm:h-56">
              <Image
                src={influencer.bannerUrl}
                alt=""
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="h-40 w-full bg-gradient-to-r from-accent/20 to-gold/20 sm:h-56" />
          )}
          <div className="absolute -bottom-8 left-6">
            {influencer.avatarUrl ? (
              <Image
                src={influencer.avatarUrl}
                alt={influencer.name}
                width={80}
                height={80}
                className="h-20 w-20 rounded-full border-4 border-background object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-background bg-accent/20 text-2xl font-bold text-accent">
                {influencer.name[0]}
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="mt-10 mb-8">
          <h1 className="text-2xl font-bold">
            {influencer.name}
            {influencer.featured && (
              <span className="ml-2 text-sm text-gold">★ Destacado</span>
            )}
          </h1>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-foreground/60">
            {influencer.subscribers && <span>{influencer.subscribers} suscriptores</span>}
            {influencer.country && <span>· {influencer.country}</span>}
            {influencer.platforms.length > 0 && (
              <span>· {influencer.platforms.join(", ")}</span>
            )}
          </div>

          {influencer.description && (
            <p className="mt-4 text-sm text-foreground/70 leading-relaxed">
              {influencer.description}
            </p>
          )}

          {/* Specialties */}
          {influencer.specialty.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {influencer.specialty.map((s) => (
                <span
                  key={s}
                  className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent"
                >
                  {s}
                </span>
              ))}
            </div>
          )}

          {/* Social links */}
          {socials.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3">
              {socials.map((s) => (
                <a
                  key={s.key}
                  href={s.url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-surface-light px-3 py-1.5 text-xs font-medium text-foreground/70 transition-colors hover:border-accent hover:text-accent"
                >
                  {s.label}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Videos grid */}
        <h2 className="mb-4 text-lg font-bold">Videos recientes</h2>
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
                    <div className="relative mb-3 aspect-video w-full overflow-hidden rounded-lg">
                      <Image
                        src={video.thumbnailUrl}
                        alt={video.title}
                        fill
                        className="object-cover"
                      />
                    </div>
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
          <p className="py-8 text-center text-foreground/40">
            Sin videos cargados. Se actualizan automáticamente cada 6 horas.
          </p>
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
