"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Card, EmptyState, ErrorState, LoadingBlock, PageHeader } from "@/components/ui";
import { relativeTime } from "@/lib/date";
import { db } from "@/services/admin";

type Stats = {
  guests_total: number;
  invitations_sent: number;
  rsvp_total: number;
  hadir: number;
  tidak_hadir: number;
  ragu: number;
  belum_konfirmasi: number;
  pax_hadir: number;
  pax_ragu: number;
  wishes_total: number;
  wishes_pending: number;
  by_category: { category: string; guests: number; hadir: number }[];
};
type Activity = { kind: "rsvp" | "wish"; id: string; name: string; detail: string; at: string };

function Tile({ label, value, note, href }: { label: string; value: number | string; note?: string; href?: string }) {
  const body = (
    <>
      <p className="text-xs text-admin-muted">{label}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums text-admin-ink">{value}</p>
      {note && <p className="mt-1 text-xs text-admin-muted">{note}</p>}
    </>
  );
  return href ? (
    <Link href={href} className="block rounded-lg border border-admin-line bg-white p-4 hover:border-admin-muted">
      {body}
    </Link>
  ) : (
    <div className="rounded-lg border border-admin-line bg-white p-4">{body}</div>
  );
}

// Batang horizontal: satu warna per status, label & angka ditulis langsung (tanpa legenda terpisah).
function Bars({ rows, total }: { rows: { label: string; value: number; color: string }[]; total: number }) {
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex justify-between text-sm">
            <span>{r.label}</span>
            <span className="tabular-nums text-admin-muted">
              {r.value}
              {total > 0 && ` · ${Math.round((r.value / total) * 100)}%`}
            </span>
          </div>
          <div className="mt-1 h-2.5 rounded-full bg-[#EEECE6]" role="presentation">
            <div className="h-full rounded-full" style={{ width: total ? `${(r.value / total) * 100}%` : 0, background: r.color }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function OverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [activity, setActivity] = useState<Activity[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const [s, r, w] = await Promise.all([
      db().rpc("dashboard_stats"),
      db().from("rsvps").select("id, name, attendance, pax, updated_at").order("updated_at", { ascending: false }).limit(8),
      db().from("wedding_wishes").select("id, name, message, status, created_at").order("created_at", { ascending: false }).limit(8),
    ]);
    const err = s.error ?? r.error ?? w.error;
    if (err) return setError(err.message);
    setStats(s.data as Stats);
    const label = { hadir: "Hadir", tidak_hadir: "Tidak hadir", ragu: "Masih ragu" } as Record<string, string>;
    const items: Activity[] = [
      ...(r.data ?? []).map((x) => ({ kind: "rsvp" as const, id: x.id, name: x.name, detail: `RSVP: ${label[x.attendance]}${x.attendance !== "tidak_hadir" ? `, ${x.pax} orang` : ""}`, at: x.updated_at })),
      ...(w.data ?? []).map((x) => ({ kind: "wish" as const, id: x.id, name: x.name, detail: `Ucapan${x.status === "pending" ? " (menunggu moderasi)" : ""}: ${x.message.slice(0, 80)}`, at: x.created_at })),
    ].sort((a, b) => b.at.localeCompare(a.at));
    setActivity(items.slice(0, 10));
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!stats || !activity) return <LoadingBlock rows={6} />;

  const responded = stats.hadir + stats.ragu + stats.tidak_hadir;
  return (
    <>
      <PageHeader title="Ringkasan" description="Angka dihitung langsung dari daftar tamu, RSVP, dan ucapan." />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile label="Tamu terdaftar" value={stats.guests_total} note={`${stats.invitations_sent} undangan terkirim`} href="/admin/guests" />
        <Tile label="Total konfirmasi RSVP" value={stats.rsvp_total} note={`${stats.belum_konfirmasi} tamu terdaftar belum konfirmasi`} href="/admin/rsvp" />
        <Tile label="Estimasi orang hadir" value={stats.pax_hadir} note={stats.pax_ragu ? `+${stats.pax_ragu} dari yang masih ragu` : undefined} />
        <Tile label="Total ucapan" value={stats.wishes_total} note={stats.wishes_pending ? `${stats.wishes_pending} menunggu moderasi` : undefined} href="/admin/wishes" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Status kehadiran" description={`${responded} tamu sudah merespons`}>
          {responded === 0 ? (
            <EmptyState title="Belum ada RSVP" />
          ) : (
            <Bars
              total={responded}
              rows={[
                { label: "Hadir", value: stats.hadir, color: "#3D6B45" },
                { label: "Masih ragu", value: stats.ragu, color: "#B8862E" },
                { label: "Tidak hadir", value: stats.tidak_hadir, color: "#A23B2A" },
              ]}
            />
          )}
          {stats.guests_total > 0 && <p className="mt-4 text-xs text-admin-muted">Belum mengonfirmasi (tamu terdaftar): {stats.belum_konfirmasi}</p>}
        </Card>

        <Card title="Per kategori tamu" description="Jumlah tamu terdaftar dan yang menyatakan hadir">
          {stats.by_category.length === 0 ? (
            <EmptyState title="Belum ada tamu terdaftar" />
          ) : (
            <ul className="space-y-3">
              {stats.by_category.slice(0, 8).map((c) => (
                <li key={c.category}>
                  <div className="flex justify-between text-sm">
                    <span>{c.category}</span>
                    <span className="tabular-nums text-admin-muted">
                      {c.hadir} hadir / {c.guests}
                    </span>
                  </div>
                  <div className="mt-1 h-2.5 rounded-full bg-[#EEECE6]">
                    <div className="h-full rounded-full bg-admin-brand" style={{ width: `${(c.hadir / c.guests) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Aktivitas terbaru" className="mt-6">
        {activity.length === 0 ? (
          <EmptyState title="Belum ada aktivitas" body="RSVP dan ucapan dari tamu akan muncul di sini." />
        ) : (
          <ul className="divide-y divide-admin-line">
            {activity.map((a) => (
              <li key={a.kind + a.id} className="flex items-start justify-between gap-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium">{a.name}</p>
                  <p className="truncate text-admin-muted">{a.detail}</p>
                </div>
                <time dateTime={a.at} className="shrink-0 text-xs text-admin-muted">
                  {relativeTime(a.at)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
