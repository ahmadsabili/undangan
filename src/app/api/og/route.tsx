import { ImageResponse } from "next/og";
import { formatLongDate } from "@/lib/date";
import { orderedCouple } from "@/services/normalize";
import { getPublishedInvitation } from "@/services/invitation";

export const runtime = "nodejs";

// Gambar share cadangan bila belum ada foto (JPG/PNG/WebP) untuk Open Graph.
export async function GET() {
  const res = await getPublishedInvitation();
  const data = res.status === "ok" ? res.data : null;
  const c = data?.settings.theme.colors ?? { primary: "#454B40", background: "#FAF8F3", accent: "#B49A73" };
  const [p1, p2] = data ? orderedCouple(data.settings.couple) : [{ nickname: "" }, { nickname: "" }];
  const date = data ? formatLongDate(data.settings.wedding_date, data.settings.timezone, data.settings.language) : "";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: c.primary, color: c.background }}>
        <div style={{ fontSize: 26, letterSpacing: 8 }}>THE WEDDING OF</div>
        <div style={{ marginTop: 28, fontSize: 92, display: "flex" }}>
          {p1.nickname} &amp; {p2.nickname}
        </div>
        <div style={{ marginTop: 28, width: 80, height: 2, background: c.accent }} />
        <div style={{ marginTop: 28, fontSize: 32 }}>{date}</div>
      </div>
    ),
    { width: 1200, height: 630, headers: { "Cache-Control": "public, max-age=600" } },
  );
}
