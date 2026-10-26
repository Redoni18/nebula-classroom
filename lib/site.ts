// The business facts every page, the footer, the structured data (JSON-LD) and
// llms.txt read from. Change a phone number or the hours here, nowhere else:
// search engines compare name, address and phone across the web, so they must
// be identical everywhere (SPEC §2).

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");

export const site = {
  name: "Nebula Classroom",
  /** The old site's name: kept in the structured data so searches for it still find us. */
  alternateName: "Nebula Co-Working Space",
  phones: [
    { display: "075 281 813", tel: "+38975281813", international: "+389 75 281 813" },
    { display: "070 470 555", tel: "+38970470555", international: "+389 70 470 555" },
  ],
  email: "nebulacoworkinspace@gmail.com",
  /** Where new booking requests are emailed, and the sender they come from. */
  notifications: {
    to: "nebulacoworkinspace@gmail.com",
    from: { name: "Nebula Classroom", email: "bookings@nebulaclassroom.com" },
  },
  instagram: "https://www.instagram.com/nebulacowork_te/",
  address: {
    street: { sq: "Rr. 19 Nëntori, Kompleksi Lovec", mk: "Ул. 19 Ноември, Комплекс Ловец", en: "19 Nëntori St., Lovec Complex" },
    city: { sq: "Tetovë", mk: "Тетово", en: "Tetovo" },
    postalCode: "1200",
    country: { sq: "Maqedonia e Veriut", mk: "Северна Македонија", en: "North Macedonia" },
    countryCode: "MK",
    region: "Polog",
  },
  /** The room's pin on Google Maps (from the owner, 2026-10-26) and its coordinates. */
  mapUrl: "https://www.google.com/maps?cid=11055459592570318201",
  geo: { latitude: 42.0110776, longitude: 20.9717364 },
  /** Open every day; these are also the bookable hours (features/booking/model/rules.ts). */
  hours: { opens: "08:00", closes: "22:00" },
  photos: {
    hero: { src: "/images/nebula-classroom-tetovo.jpg", width: 1600, height: 900 },
    front: { src: "/images/nebula-classroom-desks.jpg", width: 1600, height: 900 },
    whiteboard: { src: "/images/nebula-classroom-whiteboard.jpg", width: 1600, height: 900 },
    entrance: { src: "/images/nebula-classroom-entrance.jpg", width: 1600, height: 900 },
  },
} as const;

export const mainPhone = site.phones[0];
