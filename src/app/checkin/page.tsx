import type { Metadata, Viewport } from "next";
import { redirect } from "next/navigation";
import { CheckinApp } from "@/components/checkin/CheckinApp";
import { AdminProviders } from "@/components/ui";
import { isSupabaseConfigured } from "@/lib/env";
import { getServerSupabase } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Check-in Tamu", robots: { index: false, follow: false } };
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#454B40" };
export const dynamic = "force-dynamic";

// Halaman penerima tamu di hari H. Bisa dibuka admin atau akun berperan "checkin".
export default async function CheckinPage() {
  if (!isSupabaseConfigured()) redirect("/admin/login");
  const supabase = await getServerSupabase();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/admin/login");
  const { data: role } = await supabase.rpc("my_role");
  const allowed = role === "admin" || role === "checkin";
  return (
    <div className="admin min-h-[100dvh] bg-admin-bg font-admin text-admin-ink">
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=DM+Sans:wght@400;500;600&display=swap" precedence="default" />
      <AdminProviders>
        {allowed ? (
          <CheckinApp isAdmin={role === "admin"} email={data.user.email ?? ""} />
        ) : (
          <main className="grid min-h-[100dvh] place-items-center px-6 text-center">
            <div className="max-w-sm">
              <h1 className="text-3xl" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                Akun ini belum punya akses check-in
              </h1>
              <p className="mt-3 text-sm text-admin-muted">Minta admin menjalankan <code>npm run create-admin -- {data.user.email} &quot;password&quot; checkin</code>.</p>
            </div>
          </main>
        )}
      </AdminProviders>
    </div>
  );
}
