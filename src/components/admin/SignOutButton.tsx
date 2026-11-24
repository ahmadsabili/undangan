"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";
import { getBrowserSupabase } from "@/lib/supabase/client";

export function SignOutButton({ compact }: { compact?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="ghost"
      size={compact ? "sm" : "md"}
      loading={busy}
      onClick={async () => {
        setBusy(true);
        await getBrowserSupabase().auth.signOut();
        router.replace("/admin/login");
        router.refresh();
      }}
    >
      <LogOut className="h-4 w-4" aria-hidden="true" />
      Keluar
    </Button>
  );
}
