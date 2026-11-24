"use client";

import { Eye, Send } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Badge, Button, useConfirm, useToast } from "@/components/ui";
import { errMessage, fetchPublishState, publishNow, type PublishState } from "@/services/admin";

export function PublishBar() {
  const [state, setState] = useState<PublishState | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();
  const pathname = usePathname();

  const refresh = useCallback(() => {
    fetchPublishState()
      .then((s) => {
        setState(s);
        setFailed(false);
      })
      .catch(() => setFailed(true));
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener("draft:changed", refresh);
    return () => window.removeEventListener("draft:changed", refresh);
  }, [refresh, pathname]);

  async function publish() {
    const ok = await confirm({
      title: "Publikasikan perubahan?",
      body: "Semua perubahan draft akan tampil di undangan publik. Tamu yang sedang membuka undangan akan melihat versi baru setelah memuat ulang.",
      confirmLabel: "Publish sekarang",
    });
    if (!ok) return;
    setBusy(true);
    try {
      await publishNow();
      toast("ok", "Perubahan berhasil dipublikasikan.");
    } catch (e) {
      toast("error", `Publish gagal: ${errMessage(e)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="mr-1 hidden items-center gap-2 sm:flex" aria-live="polite">
        {failed && <Badge tone="danger">Status tidak terbaca</Badge>}
        {state && <Badge tone={state.isPublished ? "ok" : "warn"}>{state.isPublished ? "Situs online" : "Situs offline"}</Badge>}
        {state && (state.hasDraftChanges ? <Badge tone="info">Ada perubahan belum dipublish</Badge> : <Badge>Draft sama dengan versi tayang</Badge>)}
      </div>
      <Link href="/admin/preview" className="inline-flex min-h-[40px] items-center gap-2 rounded-md border border-admin-line bg-white px-3 text-sm font-medium hover:bg-[#F0EEE8]">
        <Eye className="h-4 w-4" aria-hidden="true" />
        Preview
      </Link>
      <Button variant="primary" onClick={publish} loading={busy} disabled={state ? !state.hasDraftChanges : false}>
        <Send className="h-4 w-4" aria-hidden="true" />
        Publish
      </Button>
    </div>
  );
}
