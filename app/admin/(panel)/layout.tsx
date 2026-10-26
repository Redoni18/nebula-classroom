// The signed-in admin's frame (shadcn dashboard-01): the sidebar on the left,
// the page on the right. Anyone not signed in is sent to /admin/login.

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { requireAdmin } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { pendingCount } from "@/features/admin/queries";
import { AdminSidebar } from "@/features/admin/shell/admin-sidebar";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const pending = await pendingCount(getDb());
  return (
    <SidebarProvider>
      <AdminSidebar user={{ name: user.name, email: user.email }} pending={pending} />
      <SidebarInset className="bg-background">{children}</SidebarInset>
    </SidebarProvider>
  );
}
