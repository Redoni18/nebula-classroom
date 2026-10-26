// English copy for the whole site. This file also defines the shape every
// language must follow: sq.ts and mk.ts are typed `Dictionary`, so a missing
// key fails the type check. "{name}" marks a value filled in by the code.

export const en = {
  meta: {
    title: "Classroom for Rent in Tetovo",
    description:
      "A fully equipped classroom in the center of Tetovo: WiFi, A/C, TV and whiteboard. Book it by the day, week or month, or make it yours. See the free hours.",
    ogAlt: "Nebula Classroom in Tetovo: your class, your room.",
  },
  nav: {
    home: "Home",
    waysToBook: "Ways to book",
    calendar: "Calendar",
    location: "Location",
    menu: "Menu",
    close: "Close menu",
    skip: "Skip to content",
    language: "Language",
    call: "Call",
  },
  hero: {
    // One word per line, as in the design; the last two sit on the ink box.
    lines: ["Your", "class.", "Your", "room."],
    lead: "A fully equipped classroom in the center of Tetovo. Book it for a day, a week, a month, or make it entirely yours.",
    call: "Call {phone}",
    freeDays: "See free days",
    photoAlt: "The Nebula classroom in Tetovo: rows of desks, chairs, a whiteboard and a TV on the wall",
    features: [
      { title: "WiFi", note: "fast" },
      { title: "A/C", note: "always cool" },
      { title: "TV", note: "+ whiteboard" },
    ],
  },
  strip: ["Fully equipped", "City center", "City parking nearby", "Flexible booking"],
  teach: {
    title: ["What will you", "teach here?"],
    book: "Book the room for {activity}",
    items: {
      language: { title: "Language courses", text: "English, German, Albanian, Macedonian. Your students will feel at home." },
      tutoring: { title: "Private tutoring", text: "Quiet, bright and focused. Better than a kitchen table." },
      workshop: { title: "Workshops & trainings", text: "Whiteboard, TV and desks ready. Bring your slides." },
      online: { title: "Teach online", text: "Look professional on camera. No more teaching from the sofa." },
    },
  },
  plans: {
    title: ["Ways to", "book"],
    ask: "Ask for a quote",
    chosen: "Chosen",
    items: {
      day: { name: "Day pass", short: "Day", text: "Pop in for a day. One class, one workshop, no strings." },
      week: { name: "Week", short: "Week", text: "Running a short course? Pick your days and we fit around the free slots." },
      month: { name: "Month", short: "Month", text: "Your regular slot, every week. Shared room, shared rhythm." },
      exclusive: { name: "Exclusive month", short: "Exclusive", text: "The whole room, any day or hour. Your name on the door. Nobody else teaches here." },
    },
  },
  booking: {
    title: "Schedule booking",
    planLabel: "Plan",
    prevMonth: "Previous month",
    nextMonth: "Next month",
    loading: "Loading free hours…",
    loadError: "Couldn't load the free hours. Call us, or try again.",
    retry: "Try again",
    legendPartly: "Outlined",
    legendPartlyText: "some hours taken",
    legendChosen: "Lime",
    legendChosenText: "your chosen day. Tap a day, then pick your hours.",
    legendFull: "Ink",
    legendFullText: "fully booked",
    dayStatus: {
      free: "free",
      partly: "some hours taken",
      full: "fully booked",
      unavailable: "not bookable",
      chosen: "chosen",
    },
    pickHours: "Pick your hours",
    pickHoursHint: "Only the booked hours are taken. Every other hour of the day is yours.",
    pickDayFirst: "Tap a day in the calendar first.",
    hourTaken: "taken",
    hourTooSoon: "too soon",
    rangeBlocked: "That range crosses a booked hour. Pick hours next to each other.",
    weekSpan: "A week fits in 7 days: {from} to {to}.",
    yourPick: "Your pick",
    noPick: "Nothing picked yet",
    hours: { one: "{n} hour", other: "{n} hours" },
    total: "{hours} in total",
    removeDay: "Remove {day}",
    repeats: "Repeats every week, 4 times: {dates}",
    conflicts: "Already taken: {list}. Pick other hours or call us.",
    exclusiveRange: "{from} to {to}: the whole room, every day, every hour.",
    exclusivePick: "Tap the day your month starts.",
    exclusiveConflicts: "Some of these days already have bookings ({list}). Call us and we'll work it out.",
    minimum: {
      day: "A day pass starts at 1 hour.",
      week: "A week starts at 4 hours in total.",
      month: "A month starts at 16 hours in total (4 a week).",
      exclusive: "",
    },
    note: "Weekly and monthly plans fit around the booked hours. Exclusive monthly has no limits.",
    cancel: "Cancel",
    continue: "Continue",
    bookByPhone: "Book by phone",
    back: "Back",
    details: {
      title: "Your details",
      intro: "We'll call you to confirm and agree the price. Nothing to pay now.",
      name: "Full name",
      phone: "Phone",
      phoneHint: "We confirm every booking by phone.",
      email: "Email (optional)",
      activity: "What will you teach?",
      activityPlaceholder: "Choose one",
      activities: {
        language: "Language course",
        tutoring: "Private tutoring",
        workshop: "Workshop or training",
        online: "Online teaching",
        other: "Something else",
      },
      groupSize: "How many students? (optional)",
      message: "Anything we should know? (optional)",
      privacy: "We use these details only to arrange your booking.",
      privacyLink: "Privacy",
      submit: "Send request",
      sending: "Sending…",
    },
    errors: {
      name: "Write your name.",
      phone: "Write a phone number we can call.",
      email: "That email doesn't look right.",
      activity: "Choose what you'll teach.",
      groupSize: "Write a number from 1 to 60.",
      message: "Keep it under 1000 characters.",
      captcha: "Please complete the check above the button.",
      conflict: "Someone just booked some of these hours. The calendar is updated: pick again.",
      tooMany: "Too many requests from this connection. Call us instead.",
      generic: "Something went wrong. Call us, or try again.",
    },
    done: {
      title: "Request sent",
      code: "Your reference: {code}",
      text: "We'll call you on {phone} to confirm the booking and the price. Your hours are held for you until then.",
      another: "Book something else",
    },
  },
  included: {
    title: ["Everything", "included"],
    items: ["WiFi", "Whiteboard & TV", "Air conditioning", "Desks & chairs", "Bathroom & kitchen", "City parking nearby"],
  },
  location: {
    title: ["Find", "the room"],
    addressLabel: "Address",
    hoursLabel: "Hours",
    hours: "Every day, {opens}–{closes}",
    phoneLabel: "Phone",
    emailLabel: "Email",
    directions: "Open in Google Maps",
    instagram: "Instagram",
    entrance: "Look for the green Nebula sign.",
    entranceAlt: "The entrance of Nebula in Tetovo, with the green Nebula sign in the window",
  },
  footer: {
    tagline: "A fully equipped classroom in the center of Tetovo.",
    pages: "Pages",
    languages: "Languages",
    privacy: "Privacy",
    rights: "© {year} {name}",
  },
  privacy: {
    title: "Privacy",
    description: "What Nebula Classroom keeps when you book the room, why, and for how long.",
    updated: "Last updated: {date}",
    sections: [
      {
        heading: "What we keep",
        body: [
          "When you send a booking request we keep the hours you asked for, your name, your phone number, your email if you give it, what you'll teach, the group size and your note.",
          "To stop spam we also keep a scrambled (hashed) form of your internet address for a short time. We can't turn it back into the address.",
        ],
      },
      {
        heading: "Why",
        body: [
          "Only to arrange your booking: to call you, confirm the hours and the price, and keep a record of who used the room and when.",
          "We don't sell your details, share them for advertising, or send you newsletters.",
        ],
      },
      {
        heading: "Where it's stored",
        body: [
          "Bookings are stored in a database run by Cloudflare in the European Union. The spam check before sending is Cloudflare Turnstile, which doesn't use tracking cookies.",
          "This site sets no advertising or tracking cookies.",
        ],
      },
      {
        heading: "How long",
        body: ["We keep a booking for 24 months after its last day, then delete it. A declined request is deleted after 3 months."],
      },
      {
        heading: "Your rights",
        body: [
          "You can ask us what we keep about you, ask us to correct it, or ask us to delete it. Call {phone} or write to {email}.",
        ],
      },
    ],
  },
  notFound: {
    title: "This page isn't here",
    text: "The address may be old or mistyped. The room is still where it was.",
    home: "Back to the home page",
  },
  activityNames: {
    language: "a language course",
    tutoring: "private tutoring",
    workshop: "a workshop",
    online: "online teaching",
  },
};

type Widen<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? Widen<U>[]
    : T extends object
      ? { [K in keyof T]: Widen<T[K]> }
      : T;

export type Dictionary = Widen<typeof en>;
