import { redirect } from "next/navigation";

export default async function CaseInitialCheckRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/dashboard/start/history?caseId=${id}`);
}
