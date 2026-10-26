// The site's fonts, shared by the public pages and the admin. Archivo (the
// design's typeface) has no Cyrillic, so Macedonian letters come from Inter
// Tight; that file only downloads on pages that contain Cyrillic.
//
// The browser picks a font per letter, in fontStack's order. next/font's own
// Archivo fallback (Arial) would also catch Cyrillic letters, so it's left
// out; the "Archivo Latin Fallback" in app/globals.css stands in for Latin
// letters only. Set it on <html> as the --font-stack variable.

import { Archivo, Inter_Tight } from "next/font/google";

// Only the basic Latin file is preloaded (Albanian's ë and ç are in it); the
// extended Latin file still loads by itself if a page ever needs it.
const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], display: "swap" });
const cyrillic = Inter_Tight({ subsets: ["cyrillic"], display: "swap", preload: false });

export const fontStack = [
  archivo.style.fontFamily.split(",")[0],
  '"Archivo Latin Fallback"',
  cyrillic.style.fontFamily,
  "ui-sans-serif, system-ui, sans-serif",
].join(", ");

export const fontStackStyle = { "--font-stack": fontStack } as React.CSSProperties;
