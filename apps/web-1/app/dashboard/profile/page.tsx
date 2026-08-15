import { redirect } from "next/navigation";

export default function LegacyProfilePage() {
  redirect("/dashboard/settings/profile");
}
