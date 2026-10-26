// Makes the site's generated images: the icons (favicon, Apple touch icon,
// manifest icons) and the share image for each language (public/og/<locale>.png,
// 1200×630, what WhatsApp, Facebook, X and LinkedIn show for a link).
// Run `corepack pnpm images` after changing the headline or the icon; the
// results are committed, so builds don't depend on this script or the network.
// Fonts are fetched from Google Fonts while it runs.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createElement as h } from "react";
import sharp from "sharp";
import { ImageResponse } from "next/og.js";
import { en } from "../lib/i18n/dictionaries/en.ts";
import { mk } from "../lib/i18n/dictionaries/mk.ts";
import { sq } from "../lib/i18n/dictionaries/sq.ts";

const LIME = "#c7e03c";
const INK = "#0b0b0b";

// --- Icons -----------------------------------------------------------------

/** An "N." lettermark: lime on ink. `rounded` for the browser tab, square where the system rounds it. */
function iconSvg({ rounded }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" ${rounded ? 'rx="112"' : ""} fill="${INK}"/>
  <path d="M106 136H170L266 278V136H330V376H266L170 234V376H106Z" fill="${LIME}"/>
  <circle cx="382" cy="352" r="24" fill="${LIME}"/>
</svg>
`;
}

/** A .ico holding PNGs (supported by every browser since IE Vista era). */
function ico(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  let offset = 6 + 16 * pngs.length;
  const entries = pngs.map(({ size, data }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    return entry;
  });
  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)]);
}

async function makeIcons() {
  const rounded = Buffer.from(iconSvg({ rounded: true }));
  const square = Buffer.from(iconSvg({ rounded: false }));
  await writeFile("app/icon.svg", iconSvg({ rounded: true }));
  const png = (svg, size) => sharp(svg, { density: 300 }).resize(size, size).png().toBuffer();
  await writeFile("app/apple-icon.png", await png(square, 180));
  await writeFile("public/icon-192.png", await png(rounded, 192));
  await writeFile("public/icon-512.png", await png(rounded, 512));
  await writeFile("public/icon-maskable-512.png", await png(square, 512));
  await writeFile("app/favicon.ico", ico([{ size: 32, data: await png(rounded, 32) }, { size: 48, data: await png(rounded, 48) }]));
  console.log("icons: app/icon.svg, app/apple-icon.png, app/favicon.ico, public/icon-*.png");
}

// --- Share images ------------------------------------------------------------

/** `query` is the part after fonts.googleapis.com/ ("css2?family=…"). */
async function googleFont(query) {
  // An old Safari user agent gets WOFF files, which the image renderer reads.
  const css = await (
    await fetch(`https://fonts.googleapis.com/${query}`, {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/534.59.8 (KHTML, like Gecko) Version/5.1.9 Safari/534.59.8" },
    })
  ).text();
  const url = /src: url\(([^)]+)\)/.exec(css)?.[1];
  if (!url) throw new Error(`No font file for ${query}`);
  return (await fetch(url)).arrayBuffer();
}

async function fontsource(family, subset, weight) {
  const url = `https://cdn.jsdelivr.net/npm/@fontsource/${family}@5/files/${family}-${subset}-${weight}-normal.woff`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`No font file at ${url}`);
  return response.arrayBuffer();
}

function shareImage(dict, photo) {
  const [a, b, c, d] = dict.hero.lines.map((line) => line.toLocaleUpperCase());
  const grid = `linear-gradient(to right, rgba(11,11,11,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(11,11,11,0.1) 1px, transparent 1px)`;
  const line = (text) => h("div", { style: { display: "flex" } }, text);
  return h(
    "div",
    {
      style: {
        width: 1200,
        height: 630,
        display: "flex",
        backgroundColor: LIME,
        backgroundImage: grid,
        backgroundSize: "60px 60px",
        padding: 56,
        color: INK,
      },
    },
    h(
      "div",
      { style: { display: "flex", flexDirection: "column", flex: 1 } },
      h(
        "div",
        { style: { display: "flex", flexDirection: "column", fontFamily: "Display", fontSize: 92, fontWeight: 900, lineHeight: 0.92, letterSpacing: -2 } },
        line(a),
        line(b),
        h(
          "div",
          { style: { display: "flex", flexDirection: "column", backgroundColor: INK, color: LIME, padding: "10px 40px 6px 14px", marginTop: 10, marginLeft: -12, transform: "rotate(-1.2deg)", alignSelf: "flex-start" } },
          line(c),
          line(d),
        ),
      ),
      h(
        "div",
        { style: { display: "flex", flexDirection: "column", marginTop: "auto" } },
        h("div", { style: { fontFamily: "Brand", fontSize: 30, fontWeight: 800, letterSpacing: 2 } }, "NEBULA CLASSROOM."),
        h(
          "div",
          { style: { display: "flex", fontSize: 24, fontWeight: 500, marginTop: 6 } },
          h("span", { style: { fontFamily: "Text" } }, dict.meta.title),
          h("span", { style: { fontFamily: "Brand", whiteSpace: "pre" } }, "  ·  075 281 813"),
        ),
      ),
    ),
    h("img", { src: photo, width: 470, height: 518, style: { borderRadius: 40, objectFit: "cover" } }),
  );
}

async function makeShareImages() {
  const [display, cyrillicDisplay, text, textBold, cyrillicText] = await Promise.all([
    googleFont("css2?family=Archivo:wdth,wght@112,900"),
    // Google serves Inter Tight as one variable file, which the renderer draws at
    // its thinnest; fontsource has a fixed file per weight.
    fontsource("inter-tight", "cyrillic", 900),
    googleFont("css2?family=Archivo:wght@500"),
    googleFont("css2?family=Archivo:wght@800"),
    fontsource("inter-tight", "cyrillic", 500),
  ]);
  // Each text element names a family that holds all of its letters: the
  // renderer's fallback between fonts is unreliable for mixed weights.
  // "Display" and "Text" are Archivo, or Inter Tight for Macedonian; "Brand"
  // (the wordmark and the phone number) is always Archivo.
  const fontsFor = (locale) => [
    { name: "Display", data: locale === "mk" ? cyrillicDisplay : display, weight: 900 },
    { name: "Text", data: locale === "mk" ? cyrillicText : text, weight: 500 },
    { name: "Brand", data: textBold, weight: 800 },
    { name: "Brand", data: text, weight: 500 },
  ];
  const photoJpeg = await sharp(await readFile("public/images/nebula-classroom-tetovo.jpg")).resize(940, 1036, { fit: "cover" }).jpeg({ quality: 82 }).toBuffer();
  const photo = `data:image/jpeg;base64,${photoJpeg.toString("base64")}`;
  await mkdir("public/og", { recursive: true });
  for (const [locale, dict] of Object.entries({ sq, mk, en })) {
    const response = new ImageResponse(shareImage(dict, photo), { width: 1200, height: 630, fonts: fontsFor(locale) });
    const png = Buffer.from(await response.arrayBuffer());
    // Re-encode smaller: share previews load on slow phones too.
    await writeFile(`public/og/${locale}.png`, await sharp(png).png({ compressionLevel: 9, palette: true, quality: 90 }).toBuffer());
    console.log(`share image: public/og/${locale}.png`);
  }
}

await makeIcons();
await makeShareImages();
