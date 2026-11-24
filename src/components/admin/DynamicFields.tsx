"use client";

import { Field, Input, Select, Switch, Textarea } from "@/components/ui";
import type { FieldDef } from "@/config/sections";
import { utcToZonedInput, zonedInputToIso } from "@/lib/date";
import { MediaField } from "./MediaPicker";

type Values = Record<string, unknown>;

/** Render form dari definisi field (lihat src/config/sections.ts). */
export function DynamicFields({ fields, values, onChange, timezone, prefix }: { fields: FieldDef[]; values: Values; onChange: (v: Values) => void; timezone: string; prefix: string }) {
  const set = (name: string, v: unknown) => onChange({ ...values, [name]: v });
  return (
    <div className="grid gap-5">
      {fields.map((f) => {
        if (f.showIf && !f.showIf.equals.includes(String(values[f.showIf.field] ?? ""))) return null;
        const id = `${prefix}-${f.name}`;
        const v = values[f.name];
        switch (f.type) {
          case "switch":
            return <Switch key={f.name} label={f.label} description={f.help} checked={Boolean(v)} onChange={(x) => set(f.name, x)} />;
          case "media":
            return (
              <Field key={f.name} label={f.label} help={f.help}>
                <MediaField id={id} label={f.label} value={(v as string) ?? null} kind={f.mediaKind} onChange={(x) => set(f.name, x)} />
              </Field>
            );
          case "textarea":
            return (
              <Field key={f.name} label={f.label} htmlFor={id} help={f.help}>
                <Textarea id={id} dir={f.dir} rows={f.rows ?? 3} value={(v as string) ?? ""} placeholder={f.placeholder} onChange={(e) => set(f.name, e.target.value)} className={f.dir === "rtl" ? "text-lg" : ""} />
              </Field>
            );
          case "select":
            return (
              <Field key={f.name} label={f.label} htmlFor={id} help={f.help}>
                <Select id={id} value={(v as string) ?? ""} onChange={(e) => set(f.name, e.target.value)}>
                  {f.options?.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </Field>
            );
          case "number":
            return (
              <Field key={f.name} label={f.label} htmlFor={id} help={f.help}>
                <Input id={id} type="number" inputMode="numeric" value={v === undefined || v === null ? "" : String(v)} onChange={(e) => set(f.name, e.target.value === "" ? null : Number(e.target.value))} />
              </Field>
            );
          case "datetime":
            return (
              <Field key={f.name} label={f.label} htmlFor={id} help={f.help ?? `Zona waktu: ${timezone}`}>
                <Input id={id} type="datetime-local" value={utcToZonedInput(v as string, timezone)} onChange={(e) => set(f.name, zonedInputToIso(e.target.value, timezone))} />
              </Field>
            );
          case "date":
          case "time":
            return (
              <Field key={f.name} label={f.label} htmlFor={id} help={f.help}>
                <Input id={id} type={f.type} value={((v as string) ?? "").slice(0, f.type === "time" ? 5 : 10)} onChange={(e) => set(f.name, e.target.value || null)} />
              </Field>
            );
          default:
            return (
              <Field key={f.name} label={f.label} htmlFor={id} help={f.help}>
                <Input id={id} type={f.type === "url" ? "url" : "text"} value={(v as string) ?? ""} placeholder={f.placeholder} onChange={(e) => set(f.name, e.target.value)} />
              </Field>
            );
        }
      })}
    </div>
  );
}
