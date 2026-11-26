import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

// Backup otomatis disimpan di bucket privat "backups" (hanya service role).
export const BACKUP_BUCKET = "backups";
const FOLDER = "auto";
/** Jumlah file backup yang disimpan; yang lebih lama dihapus. */
export const BACKUP_KEEP = 8;
/** Backup baru dibuat bila yang terakhir berumur lebih dari ini. */
const MIN_AGE_MS = 6.5 * 24 * 60 * 60 * 1000;

export type BackupFile = { name: string; created_at: string; size: number };

export async function listBackups(db: SupabaseClient): Promise<BackupFile[]> {
  const { data, error } = await db.storage.from(BACKUP_BUCKET).list(FOLDER, { limit: 100, sortBy: { column: "name", order: "desc" } });
  if (error) throw new Error(error.message);
  return (data ?? [])
    .filter((f) => f.name.endsWith(".json"))
    .map((f) => ({ name: f.name, created_at: f.created_at ?? "", size: Number((f.metadata as { size?: number } | null)?.size ?? 0) }));
}

/** Buat satu file backup sekarang, lalu hapus yang melebihi BACKUP_KEEP. */
export async function createBackup(db: SupabaseClient): Promise<BackupFile> {
  const { data, error } = await db.rpc("backup_snapshot");
  if (error) throw new Error(error.message);
  const body = JSON.stringify(data, null, 1);
  const name = `backup-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`;
  const up = await db.storage.from(BACKUP_BUCKET).upload(`${FOLDER}/${name}`, new Blob([body], { type: "application/json" }), { contentType: "application/json", upsert: true });
  if (up.error) throw new Error(up.error.message);
  const all = await listBackups(db);
  const old = all.slice(BACKUP_KEEP).map((f) => `${FOLDER}/${f.name}`);
  if (old.length) await db.storage.from(BACKUP_BUCKET).remove(old);
  return { name, created_at: new Date().toISOString(), size: body.length };
}

/** Dipanggil cron harian: backup hanya bila yang terakhir sudah lewat sekitar seminggu. */
export async function backupIfDue(db: SupabaseClient) {
  const all = await listBackups(db);
  const last = all[0] ? Date.parse(all[0].created_at) : 0;
  if (last && Date.now() - last < MIN_AGE_MS) return { created: false as const, last: all[0].name };
  const f = await createBackup(db);
  return { created: true as const, last: f.name };
}

export async function readBackup(db: SupabaseClient, name: string) {
  if (!/^backup-[\d-]+\.json$/.test(name)) throw new Error("Nama file tidak valid.");
  const { data, error } = await db.storage.from(BACKUP_BUCKET).download(`${FOLDER}/${name}`);
  if (error) throw new Error(error.message);
  return await data.text();
}
