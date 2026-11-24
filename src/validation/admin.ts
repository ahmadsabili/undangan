import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Format email tidak valid."),
  password: z.string().min(6, "Password minimal 6 karakter."),
});

export const passwordSchema = z
  .object({
    current: z.string().min(1, "Isi password saat ini."),
    next: z.string().min(10, "Gunakan minimal 10 karakter."),
    confirm: z.string(),
  })
  .refine((v) => v.next === v.confirm, { message: "Konfirmasi password tidak sama.", path: ["confirm"] });

export const guestSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi.").max(120),
  category: z.string().trim().max(60).default("Umum"),
  whatsapp: z
    .string()
    .trim()
    .transform((v) => v.replace(/[^0-9]/g, ""))
    .refine((v) => v === "" || /^[0-9]{8,16}$/.test(v), "Nomor WhatsApp 8 sampai 16 digit.")
    .default(""),
  max_pax: z.coerce.number().int().min(1, "Minimal 1").max(20, "Maksimal 20"),
  notes: z.string().max(500).default(""),
  invitation_status: z.enum(["belum_dikirim", "terkirim"]).default("belum_dikirim"),
});

export type GuestForm = z.input<typeof guestSchema>;

export const rsvpAdminSchema = z.object({
  name: z.string().trim().min(1).max(120),
  attendance: z.enum(["hadir", "tidak_hadir", "ragu"]),
  pax: z.coerce.number().int().min(0).max(20),
  message: z.string().max(500).default(""),
});

// Validasi struktur file backup sebelum dikirim ke restore_config.
export const backupSchema = z
  .object({
    version: z.literal(1),
    settings: z.record(z.string(), z.unknown()),
    sections: z.array(z.object({ key: z.string() }).passthrough()).min(1),
    events: z.array(z.record(z.string(), z.unknown())).optional(),
    stories: z.array(z.record(z.string(), z.unknown())).optional(),
    gallery: z.array(z.record(z.string(), z.unknown())).optional(),
    gifts: z.array(z.record(z.string(), z.unknown())).optional(),
    media: z.record(z.string(), z.unknown()).optional(),
    themes: z.array(z.record(z.string(), z.unknown())).optional(),
    templates: z.array(z.record(z.string(), z.unknown())).optional(),
  })
  .passthrough();
