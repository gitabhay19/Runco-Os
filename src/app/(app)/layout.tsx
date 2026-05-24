import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/app-shell/sidebar";
import { RealtimeBridge } from "@/components/realtime-bridge";
import { getResourceAccess } from "@/lib/permissions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const access = await getResourceAccess(session.user.id, session.user.role);

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar
        user={{
          name: session.user.name ?? "User",
          email: session.user.email ?? "",
          role: session.user.role,
          avatarColor: session.user.avatarColor,
        }}
        access={access}
      />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      <RealtimeBridge enabled />
    </div>
  );
}
