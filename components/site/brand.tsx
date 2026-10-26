// The wordmark, "NEBULA CLASSROOM.", linking home.

import { cn } from "@/lib/utils";

export function Brand({ href, className }: { href: string; className?: string }) {
  return (
    <a href={href} className={cn("whitespace-nowrap text-[0.95rem] font-extrabold uppercase tracking-[0.06em] [font-stretch:115%] md:text-lg", className)}>
      Nebula Classroom.
    </a>
  );
}
