import { getAllGroupPredictionsForProde, getRealGroupStandings } from "@/lib/actions/prode";
import { GroupPredictionsTable } from "./GroupPredictionsTable";

export async function GroupPredictionsSection({ prodeId }: { prodeId: string }) {
  const [predictions, realStandings] = await Promise.all([
    getAllGroupPredictionsForProde(prodeId),
    getRealGroupStandings(),
  ]);

  const hasAny = Object.keys(predictions).length > 0;
  if (!hasAny) return null;

  return <GroupPredictionsTable predictions={predictions} realStandings={realStandings} />;
}
