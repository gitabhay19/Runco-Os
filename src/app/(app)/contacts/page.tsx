import { Topbar } from "@/components/app-shell/topbar";
import { ContactsView } from "@/components/contacts/contacts-view";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  const user = await requireUser();
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
