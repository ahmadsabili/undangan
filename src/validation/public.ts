import { z } from "zod";

// Dipakai di browser (React Hook Form) dan di server (route handler).

const name = z
  .string()
  .trim()
  .min(2, "Nama minimal 2 huruf.")
  .max(80, "Nama maksimal 80 karakter.");

export const rsvpSchema = z
  .object({
    name,
    attendance: z.enum(["hadir", "tidak_hadir", "ragu"], { message: "Pilih status kehadiran." }),
    pax: z.coerce.number().int().min(0).max(20),
    message: z.string().trim().max(500, "Pesan maksimal 500 karakter.").default(""),
    guestCode: z.string().trim().max(16).optional().nullable(),
    // anti-spam
    website: z.string().max(0).optional().default(""),
    startedAt: z.coerce.number().optional(),
  })
  .refine((v) => v.attendance === "tidak_hadir" || v.pax >= 1, {
    message: "Jumlah tamu minimal 1 orang.",
    path: ["pax"],
  });

export type RsvpInput = z.input<typeof rsvpSchema>;

export const wishSchema = z.object({
  name,
  message: z.string().trim().min(2, "Ucapan terlalu pendek.").max(600, "Ucapan maksimal 600 karakter."),
  guestCode: z.string().trim().max(16).optional().nullable(),
  website: z.string().max(0).optional().default(""),
  startedAt: z.coerce.number().optional(),
});

export type WishInput = z.input<typeof wishSchema>;
