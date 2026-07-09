import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getUserProfile } from "@/lib/supabase/server";
import { getUserShops, requireUser } from "@/lib/supabase/shops";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const profile = await getUserProfile();
  const shops = await getUserShops();

  const displayName =
    profile?.full_name?.trim() ||
    user.email?.split("@")[0] ||
    "User";

  return (
    <DashboardShell
      email={user.email ?? ""}
      displayName={displayName}
      shops={shops}
    >
      {children}
    </DashboardShell>
  );
}
