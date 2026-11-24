import "server-only";
import { createHash } from "node:crypto";

/** Hash IP + salt agar rate limit bekerja tanpa menyimpan IP mentah. */
export function clientKey(headers: Headers, scope: string) {
  const ip = (headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || headers.get("x-real-ip") || "unknown";
  const salt = process.env.RATE_LIMIT_SALT ?? "undangan";
  return `${scope}:${createHash("sha256").update(salt + ip).digest("hex").slice(0, 32)}`;
}
