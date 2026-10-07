/**
 * Community page data source.
 *
 * The Community Finder UI is generated entirely from `COMMUNITIES`, so adding a
 * new state — or an entirely new country — is a pure data change: append an
 * object here and the cards + search update. QR images are placeholders for
 * now; swap the `qrCode` path once real codes exist.
 *
 * Icons are Iconify names (Solar duotone set) to match the rest of the site.
 */

export type CommunityCategory = "Students" | "Professionals" | "Entrepreneurs";

export interface Community {
  id: string;
  /** ISO country code — drives the country filter. */
  country: string;
  /** Region label shown on the card, e.g. "Andhra Pradesh". */
  state: string;
  /** Short label used on the map. */
  mapLabel: string;
  /** Uppercase location label shown above the name on the card. */
  locationLabel: string;
  /** Full branded community name. */
  communityName: string;
  /** One clean sentence shown under the name on the card. */
  tagline: string;
  /** Square (1:1) cover image for the card, e.g. a city landmark. */
  image: string;
  /** Accessible alt text for the cover image. */
  imageAlt: string;
  /** WhatsApp invite URL — opened directly on "Join Community". */
  joinLink: string;
  /** Placeholder QR image path (replace with real QR later). */
  qrCode: string;
  /** Display-only member count placeholder. */
  memberCount: string;
  categories: CommunityCategory[];
  /** Geographic coordinates for map projection. */
  lat: number;
  lng: number;
}

const ALL_CATEGORIES: CommunityCategory[] = [
  "Students",
  "Professionals",
  "Entrepreneurs",
];

// const QR_PLACEHOLDER = "/community/qr/placeholder.svg";

export const COMMUNITIES: Community[] = [
  {
    id: "andhra-pradesh",
    country: "IN",
    state: "Andhra Pradesh",
    mapLabel: "Vizag",
    locationLabel: "Andhra Pradesh",
    communityName: "GrowQR Mana Network",
    tagline:
      "Connect, learn, and grow with ambitious students and professionals across Andhra Pradesh.",
    image: "/community/places/ANDHRA.jpg",
    imageAlt: "Visakhapatnam coastline, Andhra Pradesh",
    joinLink: "https://chat.whatsapp.com/J1XrdXkA6Jc1eo1Awmhd4J",
    qrCode: "/community/qr/aandhra.png",
    memberCount: "500+",
    categories: ALL_CATEGORIES,
    lat: 17.6868,
    lng: 83.2185,
  },
  {
    id: "karnataka",
    country: "IN",
    state: "Karnataka",
    mapLabel: "Bengaluru",
    locationLabel: "Karnataka",
    communityName: "GrowQR Namma Network",
    tagline:
      "Connect, learn, and grow with Bengaluru's most ambitious students and professionals.",
    image: "/community/places/KARNATAKA.jpg",
    imageAlt: "Bengaluru city skyline at dusk",
    joinLink: "https://chat.whatsapp.com/IJo37aRJsXQL1cuNcIGw1P",
    qrCode: "/community/qr/karnataka.png",
    memberCount: "850+",
    categories: ALL_CATEGORIES,
    lat: 12.9716,
    lng: 77.5946,
  },
  {
    id: "delhi-ncr",
    country: "IN",
    state: "Delhi",
    mapLabel: "Delhi",
    locationLabel: "Delhi",
    communityName: "GrowQR Dilli Dil Se Network",
    tagline:
      "Connect, learn, and grow with ambitious students and professionals across Delhi NCR.",
    image: "/community/places/DELHI.jpg",
    imageAlt: "India Gate, New Delhi",
    joinLink: "https://chat.whatsapp.com/JgYw6p36zZA0IwAnfVCCr7",
    qrCode: "/community/qr/dehli.png",
    memberCount: "720+",
    categories: ALL_CATEGORIES,
    lat: 28.6139,
    lng: 77.209,
  },
  {
    id: "rajasthan",
    country: "IN",
    state: "Rajasthan",
    mapLabel: "Jaipur",
    locationLabel: "Rajasthan",
    communityName: "GrowQR Padharo Network",
    tagline:
      "Connect, learn, and grow with ambitious students and professionals across Rajasthan.",
    image: "/community/places/RAJASTHAN.jpg",
    imageAlt: "Jaipur heritage architecture, Rajasthan",
    joinLink: "https://chat.whatsapp.com/DVBpnm9HgWY6E15vVk3edB",
    qrCode: "/community/qr/rajsthan.png",
    memberCount: "400+",
    categories: ALL_CATEGORIES,
    lat: 26.9124,
    lng: 75.7873,
  },
  {
    id: "punjab",
    country: "IN",
    state: "Punjab",
    mapLabel: "Punjab",
    locationLabel: "Punjab",
    communityName: "GrowQR Chardi Kala Network",
    tagline:
      "Connect, learn, and grow with ambitious students and professionals across Punjab.",
    image: "/community/places/PUNJAB.jpg",
    imageAlt: "Golden Temple, Amritsar",
    joinLink: "https://chat.whatsapp.com/BZ77PSjpBl3HVMF6p9WcUv",
    qrCode: "/community/qr/punjab.png",
    memberCount: "350+",
    categories: ALL_CATEGORIES,
    lat: 30.7333,
    lng: 76.7794,
  },
  {
    id: "growth-circle",
    country: "IN",
    state: "Pan India",
    mapLabel: "Growth Circle",
    locationLabel: "Pan India",
    communityName: "GrowQR Growth Circle",
    tagline:
      "A pan-India circle where professionals and entrepreneurs build what's next, together.",
    image: "/community/places/growth.jpg",
    imageAlt: "GrowQR members on a virtual networking call",
    joinLink: "https://chat.whatsapp.com/LFVF2DrO7HcITKmh2FBlHt",
    qrCode: "/community/qr/growth-circle.png",
    memberCount: "250+",
    categories: ["Professionals", "Entrepreneurs"],
    lat: 20.5937,
    lng: 78.9629,
  },
  // TODO: add Maharashtra (and future states/countries) once an invite link is provided.
];

/* ── Section 4: Community Journey ──────────────────────────────────────────── */

export interface JourneyStep {
  /** Iconify icon name (Solar duotone). */
  icon: string;
  label: string;
}

export const JOURNEY_STEPS: JourneyStep[] = [
  { icon: "solar:user-plus-bold-duotone", label: "Join" },
  { icon: "solar:users-group-two-rounded-bold-duotone", label: "Connect" },
  { icon: "solar:square-academic-cap-bold-duotone", label: "Learn" },
  { icon: "solar:target-bold-duotone", label: "Prepare" },
  { icon: "solar:widget-add-bold-duotone", label: "Build" },
  { icon: "solar:graph-up-bold-duotone", label: "Grow" },
];

/* ── Section 5: Community in Action (Unsplash) ─────────────────────────────── */

export interface GalleryImage {
  src: string;
  alt: string;
  /** Tailwind span classes for the asymmetric grid. */
  span: string;
}

export const GALLERY: GalleryImage[] = [
  {
    src: "/community/c0.webp",
    alt: "GrowQR community members collaborating",
    span: "",
  },
  {
    src: "/events/hero/hero2.webp",
    alt: "GrowQR live event",
    span: "",
  },
];

/* ── Section 6: Community Impact ───────────────────────────────────────────── */

export interface Stat {
  value: string;
  label: string;
}

export const STATS: Stat[] = [
  { value: "5+", label: "Active Communities" },
  { value: "100+", label: "Colleges" },
  { value: "1000+", label: "Members" },
  { value: "2,000+", label: "Every Week" },
];

/* ── Live activity pulse ───────────────────────────────────────────────────
   A rotating "what's happening right now" feed shown under the impact stats.
   `icon` is an Iconify name (Solar duotone) matching the rest of the site. */
export interface PulseActivity {
  /** Iconify icon name (Solar duotone). */
  icon: string;
  /** The activity line shown in the feed. */
  text: string;
}

export const PULSE_ACTIVITY: PulseActivity[] = [
  { icon: "solar:graph-up-bold-duotone", text: "Riya from Jaipur just boosted her RQ-Score by 18 points this week" },
  { icon: "solar:microphone-large-bold-duotone", text: "Arjun completed his 7th mock interview roleplay today" },
  { icon: "solar:medal-ribbon-star-bold-duotone", text: "Sneha from Vijayawada just earned her Resume Ready badge" },
  { icon: "solar:fire-bold-duotone", text: "Karan crossed a 21-day learning streak. Consistency unlocked." },
  { icon: "solar:user-id-bold-duotone", text: "Manpreet from Ludhiana just published her Digital Skill Identity" },
  { icon: "solar:lightbulb-bolt-bold-duotone", text: "Aditya finished the Critical Thinking Day 1 challenge in under 10 minutes" },
  { icon: "solar:users-group-rounded-bold-duotone", text: "43 members are practicing roleplay scenarios right now" },
  { icon: "solar:videocamera-record-bold-duotone", text: "12 mock interviews in progress at this moment" },
  { icon: "solar:document-text-bold-duotone", text: "67 resumes refined by the community this week" },
  { icon: "solar:user-plus-bold-duotone", text: "5 new members joined from Karnataka in the last hour" },
  { icon: "solar:users-group-two-rounded-bold-duotone", text: "230+ members active across India today" },
  { icon: "solar:videocamera-bold-duotone", text: "The Delhi NCR circle is live: tonight's topic is Decision Intelligence" },
  { icon: "solar:chat-round-line-bold-duotone", text: "Priya just answered a peer's question on interview anxiety" },
  { icon: "solar:notebook-bold-duotone", text: "21 members shared their Day 1 Decision Journals today" },
  { icon: "solar:like-bold-duotone", text: "Rohit's LinkedIn headline got 9 community upvotes" },
  { icon: "solar:chat-square-like-bold-duotone", text: "New discussion trending: “What skill are you learning this month?”" },
  { icon: "solar:hand-shake-bold-duotone", text: "Tanvi from Visakhapatnam just welcomed 3 new members" },
  { icon: "solar:bolt-circle-bold-duotone", text: "The community crossed 5,000 practice sessions this month" },
  { icon: "solar:chart-square-bold-duotone", text: "89% of active members improved their RQ-Score in 30 days" },
  { icon: "solar:square-academic-cap-bold-duotone", text: "150+ skills are being learned across the community right now" },
  { icon: "solar:rocket-2-bold-duotone", text: "Someone just started their Day 1. Tomorrow, that could be you." },
];
