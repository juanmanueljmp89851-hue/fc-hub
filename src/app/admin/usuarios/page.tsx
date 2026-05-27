import { getUsers } from "@/lib/actions/admin";
import { UserManager } from "@/components/admin/UserManager";

interface PageProps {
  searchParams: { q?: string };
}

export default async function AdminUsuariosPage({ searchParams }: PageProps) {
  const users = await getUsers(searchParams.q);

  const serialized = users.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Usuarios</h1>
      <UserManager users={serialized} search={searchParams.q} />
    </div>
  );
}
