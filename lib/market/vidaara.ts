import data from "./data/vidaara-exams.json";

/** Free courses and exam-prep hubs published on vidaara.org (see data/vidaara-exams.json). Content stays on Vidaara; GrowQR lists and links to it. */
export type VidaaraSection = { name: string; desc: string; count?: number; path: string };
export type VidaaraTest = { name: string; desc: string; path: string };
export type VidaaraHub = { slug: string; learn?: string; mock?: string; studyMap?: Record<string, string>; title: string; kind: string; path: string; intro: string; unit: string; sections: VidaaraSection[]; tests: VidaaraTest[] };
export type VidaaraCard = { title: string; path?: string; url?: string; own?: string; group: string; hub?: string; comingSoon?: boolean };

export const VIDAARA_BASE = data.base;
export const vidaaraUrl = (path: string): string => VIDAARA_BASE + path;
export const hubs = (): VidaaraHub[] => data.hubs as unknown as VidaaraHub[];
export const hub = (slug: string): VidaaraHub | null => hubs().find((h) => h.slug === slug) ?? null;
export const catalogue = (): VidaaraCard[] => data.catalogue as unknown as VidaaraCard[];
export const cardUrl = (c: VidaaraCard): string | null => c.url ?? (c.path ? vidaaraUrl(c.path) : null);
export const totalUnits = (h: VidaaraHub): number => h.sections.reduce((n, s) => n + (s.count ?? 0), 0);
