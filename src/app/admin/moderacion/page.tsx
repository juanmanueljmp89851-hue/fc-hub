import { getModerationData } from "@/lib/actions/admin";
import { ModerationPanel } from "@/components/admin/ModerationPanel";

export default async function ModeracionPage() {
  const data = await getModerationData();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Moderación</h1>
      <ModerationPanel
        tournaments={data.tournaments}
        deletedTournaments={data.deletedTournaments}
        prodes={data.prodes}
        deletedProdes={data.deletedProdes}
        messages={data.recentMessages}
      />
    </div>
  );
}
