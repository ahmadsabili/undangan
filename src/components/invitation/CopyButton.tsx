"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { copyText } from "@/lib/utils";
import { InvButton } from "./InvButton";

export function CopyButton({ value, label, copiedLabel, variant = "outline" }: { value: string; label: string; copiedLabel: string; variant?: "outline" | "ghost" | "solid" | "underline" }) {
  const [done, setDone] = useState(false);
  return (
    <InvButton
      variant={variant}
      onClick={async () => {
        if (await copyText(value)) {
          setDone(true);
          setTimeout(() => setDone(false), 2200);
        }
      }}
    >
      {done ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
      <span aria-live="polite">{done ? copiedLabel : label}</span>
    </InvButton>
  );
}
