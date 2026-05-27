import { getInfluencersAdmin } from "@/lib/actions/admin";
import { InfluencerManager } from "@/components/admin/InfluencerManager";

export default async function AdminInfluencersPage() {
  const influencers = await getInfluencersAdmin();

  const serialized = influencers.map((i) => ({
    ...i,
    createdAt: i.createdAt.toISOString(),
  }));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Influencers</h1>
      <InfluencerManager influencers={serialized} />
    </div>
  );
}
