// The slim bar at the top of every admin page: the sidebar toggle, the page's
// name, and that page's own buttons on the right.

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { copy } from "../copy";

export function TopBar({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-cream-line bg-paper/90 px-3 backdrop-blur md:px-5">
      <SidebarTrigger className="-ml-1" aria-label={copy.nav.menu} />
      {/* Centred and 20px tall. shadcn's default (data-vertical:self-stretch) pinned it to the
          top, and only a class with the same data-vertical variant replaces it. */}
      <Separator orientation="vertical" className="mx-1 data-vertical:h-5 data-vertical:self-center" />
      <h1 className="truncate text-base font-bold">{title}</h1>
      <div className="ml-auto flex items-center gap-2">{children}</div>
    </header>
  );
}
