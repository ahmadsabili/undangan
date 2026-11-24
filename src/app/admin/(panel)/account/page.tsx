"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button, Card, Field, Input, PageHeader, useToast } from "@/components/ui";
import { db } from "@/services/admin";
import { passwordSchema } from "@/validation/admin";

type Form = z.infer<typeof passwordSchema>;

export default function AccountPage() {
  const toast = useToast();
  const { register, handleSubmit, formState, reset, setError } = useForm<Form>({ resolver: zodResolver(passwordSchema) });

  async function onSubmit(v: Form) {
    const { data } = await db().auth.getUser();
    const email = data.user?.email;
    if (!email) return toast("error", "Sesi berakhir. Silakan masuk lagi.");
    // Verifikasi password lama sebelum mengganti.
    const check = await db().auth.signInWithPassword({ email, password: v.current });
    if (check.error) return setError("current", { message: "Password saat ini salah." });
    const { error } = await db().auth.updateUser({ password: v.next });
    if (error) return toast("error", error.message);
    reset();
    toast("ok", "Password berhasil diganti.");
  }

  return (
    <>
      <PageHeader title="Akun" />
      <Card title="Ganti password" className="max-w-lg">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <Field label="Password saat ini" htmlFor="cur" error={formState.errors.current?.message}>
            <Input id="cur" type="password" autoComplete="current-password" aria-invalid={Boolean(formState.errors.current)} {...register("current")} />
          </Field>
          <Field label="Password baru" htmlFor="new" error={formState.errors.next?.message} help="Minimal 10 karakter.">
            <Input id="new" type="password" autoComplete="new-password" aria-invalid={Boolean(formState.errors.next)} {...register("next")} />
          </Field>
          <Field label="Ulangi password baru" htmlFor="conf" error={formState.errors.confirm?.message}>
            <Input id="conf" type="password" autoComplete="new-password" aria-invalid={Boolean(formState.errors.confirm)} {...register("confirm")} />
          </Field>
          <Button type="submit" variant="primary" loading={formState.isSubmitting}>
            Simpan password
          </Button>
        </form>
      </Card>
    </>
  );
}
