import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { isSupabaseConfigured } from "@/lib/env";
import { getServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) redirect("/admin/login");
  const supabase = await getServerSupabase();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/admin/login");
  const { data: profile } = await supabase.from("profiles").select("role, email").eq("id", data.user.id).maybeSingle();

  if (profile?.role === "checkin") redirect("/checkin");
  if (profile?.role !== "admin") {
    return (
      <main className="grid min-h-[100dvh] place-items-center px-6">
        <div className="max-w-md text-center">
          <h1 className="text-3xl" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            Akun ini bukan admin
          </h1>
          <p className="mt-3 text-sm text-admin-muted">
            {data.user.email} sudah masuk, tetapi belum memiliki peran admin. Jalankan <code>npm run create-admin</code> atau ubah kolom <code>role</code> di tabel <code>profiles</code> menjadi <code>admin</code>.
          </p>
          <div className="mt-6">
            <SignOutButton />
          </div>
        </div>
      </main>
    );
  }
  return <AdminShell email={data.user.email ?? ""}>{children}</AdminShell>;
}
