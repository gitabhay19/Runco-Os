import { redirect } from "next/navigation";
import { Topbar } from "@/components/app-shell/topbar";
import { AnalyticsView } from "@/components/analytics/analytics-view";
import { requireUser } from "@/lib/session";
import { canViewResource, getResourceAccess, firstAllowedRoute } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const user = await requireUser();
  if (!(await canViewResource(user.id, user.role, "analytics"))) {
    redirect(firstAllowedRoute(await getResourceAccess(user.id, user.role)));
  }
  return (
    <>
      <Topbar
        title="Analytics"
        subtitle={user.role === "ADMIN" ? "Workspace overview" : "Your overview"}
      />
      <AnalyticsView />
    </>
  );
}
