import type { Couple, InvitationData, Person, Section, WeddingSettings } from "@/types/invitation";
import { normalizeTheme } from "@/lib/theme";

const emptyPerson: Person = {
  full_name: "",
  nickname: "",
  parent_label: "",
  parents: "",
  bio: "",
  instagram: "",
  photo_id: null,
};

export function normalizeCouple(c: Partial<Couple> | null | undefined): Couple {
  return {
    order: c?.order === "second_first" ? "second_first" : "first_second",
    first: { ...emptyPerson, ...(c?.first ?? {}) },
    second: { ...emptyPerson, ...(c?.second ?? {}) },
  };
}

/** Lengkapi dokumen dari database agar komponen tidak perlu cek null di mana-mana. */
export function normalizeInvitation(raw: unknown): InvitationData | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<InvitationData> & { settings?: Partial<WeddingSettings> };
  if (!r.settings || !Array.isArray(r.sections)) return null;
  const settings = {
    ...r.settings,
    couple: normalizeCouple(r.settings.couple),
    theme: normalizeTheme(r.settings.theme),
    timezone: r.settings.timezone || "Asia/Jakarta",
    language: r.settings.language === "en" ? "en" : "id",
  } as WeddingSettings;
  return {
    version: 1,
    settings,
    sections: (r.sections as Section[]).map((s) => ({ ...s, content: s.content ?? {} })).sort((a, b) => a.sort_order - b.sort_order),
    events: r.events ?? [],
    stories: r.stories ?? [],
    gallery: r.gallery ?? [],
    gifts: r.gifts ?? [],
    media: r.media ?? {},
    published_at: r.published_at ?? null,
  };
}

export function orderedCouple(c: Couple): [Person, Person] {
  return c.order === "second_first" ? [c.second, c.first] : [c.first, c.second];
}
