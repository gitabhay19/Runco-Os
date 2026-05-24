import { redirect } from "next/navigation";
import { Topbar } from "@/components/app-shell/topbar";
import { ContactsView } from "@/components/contacts/contacts-view";
import { requireUser } from "@/lib/session";
import { canViewResource, getResourceAccess, firstAllowedRoute } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  const user = await requireUser();
  if (!(await canViewResource(user.id, user.role, "contacts"))) {
    redirect(firstAllowedRoute(await getResourceAccess(user.id, user.role)));
  }
  return (
    <>
      <Topbar
        title="Contacts"
        subtitle={user.role === "ADMIN" ? "All contacts in the workspace" : "Contacts you can see"}
      />
      <ContactsView />
    </>
  );
}
