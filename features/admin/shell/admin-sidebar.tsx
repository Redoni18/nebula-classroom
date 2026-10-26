"use client";

// The admin's left sidebar (shadcn sidebar, dashboard-01 frame): the pages as
// rows, with the number of pending requests next to "Rezervimet", and the
// signed-in person with "Dil" at the bottom. It folds down to icons.

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, CalendarOff, ExternalLink, Inbox, LogOut } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth/client";
import { copy } from "../copy";

const PAGES = [
  { href: "/admin", label: copy.nav.bookings, icon: Inbox },
  { href: "/admin/calendar", label: copy.nav.calendar, icon: CalendarDays },
  { href: "/admin/closed-days", label: copy.nav.closedDays, icon: CalendarOff },
];

export function AdminSidebar({ user, pending }: { user: { name: string; email: string }; pending: number }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await authClient.signOut();
    router.replace("/admin/login");
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip="Nebula Classroom">
              <Link href="/admin">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-ink text-sm font-black text-lime">N.</span>
                <span className="truncate text-sm font-extrabold uppercase tracking-[0.06em]">Nebula Classroom</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {PAGES.map((page) => (
                <SidebarMenuItem key={page.href}>
                  <SidebarMenuButton asChild isActive={pathname === page.href} tooltip={page.label}>
                    <Link href={page.href}>
                      <page.icon />
                      <span>{page.label}</span>
                    </Link>
                  </SidebarMenuButton>
                  {page.href === "/admin" && pending > 0 && <SidebarMenuBadge className="bg-lime text-ink">{pending}</SidebarMenuBadge>}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={copy.nav.site}>
              <a href="/" target="_blank" rel="noopener">
                <ExternalLink />
                <span>{copy.nav.site}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut} tooltip={copy.nav.signOut} className="h-auto py-2">
              <LogOut />
              <span className="flex min-w-0 flex-col text-left leading-tight">
                <span className="truncate text-sm font-semibold">{user.name}</span>
                <span className="truncate text-xs text-muted-ink">
                  {user.email} · {copy.nav.signOut}
                </span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
