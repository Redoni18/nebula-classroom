// The <html> of the admin (/admin…): Albanian, the site's fonts, tooltips and
// toasts. Never indexed (also sent as an X-Robots-Tag header, next.config.ts).

import type { Metadata, Viewport } from "next";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { fontStackStyle } from "@/lib/fonts";
import { copy } from "@/features/admin/copy";
import "../globals.css";

export const metadata: Metadata = {
  title: { template: `%s · ${copy.title}`, default: copy.title },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#fbfbf7",
  colorScheme: "light",
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sq" style={fontStackStyle}>
      <body className="bg-background">
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
