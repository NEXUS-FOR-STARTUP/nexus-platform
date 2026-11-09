import { redirect } from "next/navigation";

/** Old free-check screen: the start flow replaces it, links and bookmarks still work. */
export default function TeamFitRedirect() {
  redirect("/dashboard/start");
}
