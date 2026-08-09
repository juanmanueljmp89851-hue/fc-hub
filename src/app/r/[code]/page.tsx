import { redirect } from "next/navigation";
import { getAmbassadorByCode } from "@/lib/actions/ambassador";

export default async function ReferralRedirect({
  params,
}: {
  params: { code: string };
}) {
  const ambassador = await getAmbassadorByCode(params.code);

  if (ambassador) {
    redirect(`/auth/register?ref=${encodeURIComponent(params.code.toUpperCase())}`);
  }

  redirect("/auth/register");
}
