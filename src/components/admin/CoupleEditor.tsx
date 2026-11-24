"use client";

import { ArrowLeftRight } from "lucide-react";
import { Button, Field, Input, Textarea } from "@/components/ui";
import type { Couple, Person } from "@/types/invitation";
import { MediaField } from "./MediaPicker";

function PersonForm({ p, onChange, label, prefix }: { p: Person; onChange: (p: Person) => void; label: string; prefix: string }) {
  const set = (k: keyof Person, v: string | null) => onChange({ ...p, [k]: v });
  return (
    <fieldset className="space-y-4 rounded-md border border-admin-line p-4">
      <legend className="px-1 text-sm font-semibold">{label}</legend>
      <Field label="Foto profil">
        <MediaField label={`foto ${label}`} value={p.photo_id} onChange={(v) => set("photo_id", v)} />
      </Field>
      <Field label="Nama lengkap" htmlFor={`${prefix}-full`}>
        <Input id={`${prefix}-full`} value={p.full_name} onChange={(e) => set("full_name", e.target.value)} />
      </Field>
      <Field label="Nama panggilan" htmlFor={`${prefix}-nick`} help="Dipakai di cover, hero, dan monogram.">
        <Input id={`${prefix}-nick`} value={p.nickname} onChange={(e) => set("nickname", e.target.value)} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
        <Field label="Label orang tua" htmlFor={`${prefix}-pl`}>
          <Input id={`${prefix}-pl`} value={p.parent_label} placeholder="Putra dari" onChange={(e) => set("parent_label", e.target.value)} />
        </Field>
        <Field label="Nama kedua orang tua" htmlFor={`${prefix}-parents`}>
          <Input id={`${prefix}-parents`} value={p.parents} onChange={(e) => set("parents", e.target.value)} />
        </Field>
      </div>
      <Field label="Keterangan tambahan (opsional)" htmlFor={`${prefix}-bio`}>
        <Textarea id={`${prefix}-bio`} rows={2} value={p.bio} onChange={(e) => set("bio", e.target.value)} />
      </Field>
      <Field label="Instagram (opsional)" htmlFor={`${prefix}-ig`} help="Tanpa @, contoh: namaakun">
        <Input id={`${prefix}-ig`} value={p.instagram} onChange={(e) => set("instagram", e.target.value.replace(/^@/, "").trim())} />
      </Field>
    </fieldset>
  );
}

export function CoupleEditor({ couple, onChange }: { couple: Couple; onChange: (c: Couple) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-[#F3F2EE] px-4 py-3 text-sm">
        <span>
          Urutan tampil: <strong>{couple.order === "first_second" ? "Mempelai pertama lebih dulu" : "Mempelai kedua lebih dulu"}</strong>
        </span>
        <Button size="sm" onClick={() => onChange({ ...couple, order: couple.order === "first_second" ? "second_first" : "first_second" })}>
          <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
          Tukar urutan
        </Button>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <PersonForm label="Mempelai pertama" prefix="p1" p={couple.first} onChange={(first) => onChange({ ...couple, first })} />
        <PersonForm label="Mempelai kedua" prefix="p2" p={couple.second} onChange={(second) => onChange({ ...couple, second })} />
      </div>
    </div>
  );
}
