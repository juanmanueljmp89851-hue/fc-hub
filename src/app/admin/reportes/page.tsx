import { getReports } from "@/lib/actions/report";
import { ReportsList } from "@/components/admin/ReportsList";

export default async function AdminReportesPage() {
  const reports = await getReports();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Reportes de usuarios</h1>
      <ReportsList initialReports={reports} />
    </div>
  );
}
