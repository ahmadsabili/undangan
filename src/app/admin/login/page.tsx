"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button, Field, Input } from "@/components/ui";
import { isSupabaseConfigured } from "@/lib/env";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { loginSchema } from "@/validation/admin";

type Form = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const configured = isSupabaseConfigured();
  const { register, handleSubmit, formState } = useForm<Form>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(v: Form) {
    setError(null);
    const { error } = await getBrowserSupabase().auth.signInWithPassword(v);
    if (error) {
      setError(error.message === "Invalid login credentials" ? "Email atau password salah." : error.message);
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  return (
    <main className="grid min-h-[100dvh] place-items-center px-5 py-10">
      <div className="w-full max-w-sm">
        <p className="text-center text-xs font-medium tracking-[0.2em] text-admin-muted">DASHBOARD</p>
        <h1 className="mt-2 text-center text-4xl text-admin-ink" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
          Undangan Digital
        </h1>
        {!configured ? (
          <div role="alert" className="mt-8 rounded-lg border border-admin-line bg-white p-5 text-sm leading-relaxed">
            Supabase belum dikonfigurasi. Isi <code>NEXT_PUBLIC_SUPABASE_URL</code> dan <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> di <code>.env.local</code>, lalu jalankan ulang server. Lihat README bagian Instalasi.
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-4 rounded-lg border border-admin-line bg-white p-6">
            <Field label="Email" htmlFor="email" error={formState.errors.email?.message}>
              <Input id="email" type="email" autoComplete="username" aria-invalid={Boolean(formState.errors.email)} {...register("email")} />
            </Field>
            <Field label="Password" htmlFor="password" error={formState.errors.password?.message}>
              <Input id="password" type="password" autoComplete="current-password" aria-invalid={Boolean(formState.errors.password)} {...register("password")} />
            </Field>
            {error && (
              <p role="alert" className="text-sm text-admin-danger">
                {error}
              </p>
            )}
            <Button type="submit" variant="primary" className="w-full" loading={formState.isSubmitting}>
              Masuk
            </Button>
            <p className="text-xs leading-relaxed text-admin-muted">Tidak ada pendaftaran publik. Akun admin dibuat oleh pemilik melalui skrip <code>npm run create-admin</code>.</p>
          </form>
        )}
      </div>
    </main>
  );
}
