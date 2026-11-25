"use client";

import {
  Archive,
  Eye,
  Images,
  LayoutDashboard,
  Mail,
  MailCheck,
  Menu,
  MessageSquareHeart,
  Palette,
  PanelsTopLeft,
  ScanLine,
  Settings,
  UserCog,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { PublishBar } from "./PublishBar";
import { SignOutButton } from "./SignOutButton";

const NAV = [
  { group: "Undangan", items: [
    { href: "/admin", label: "Ringkasan", icon: LayoutDashboard },
    { href: "/admin/content", label: "Konten", icon: PanelsTopLeft },
    { href: "/admin/theme", label: "Tema", icon: Palette },
    { href: "/admin/media", label: "Media", icon: Images },
    { href: "/admin/preview", label: "Preview", icon: Eye },
  ] },
  { group: "Tamu", items: [
    { href: "/admin/guests", label: "Daftar Tamu", icon: Users },
    { href: "/admin/rsvp", label: "RSVP", icon: MailCheck },
    { href: "/admin/wishes", label: "Ucapan", icon: MessageSquareHeart },
    { href: "/admin/templates", label: "Template WhatsApp", icon: Mail },
    { href: "/checkin", label: "Check-in Hari H", icon: ScanLine },
  ] },
  { group: "Sistem", items: [
    { href: "/admin/settings", label: "Pengaturan", icon: Settings },
    { href: "/admin/backup", label: "Backup & Restore", icon: Archive },
    { href: "/admin/account", label: "Akun", icon: UserCog },
  ] },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Menu dashboard" className="space-y-6">
      {NAV.map((g) => (
        <div key={g.group}>
          <p className="px-3 text-[0.7rem] font-semibold tracking-[0.12em] text-admin-muted">{g.group.toUpperCase()}</p>
          <ul className="mt-2 space-y-0.5">
            {g.items.map((it) => {
              const active = it.href === "/admin" ? pathname === "/admin" : pathname.startsWith(it.href);
              const Icon = it.icon;
              return (
                <li key={it.href}>
                  <Link
                    href={it.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-[40px] items-center gap-3 rounded-md px-3 text-sm transition-colors",
                      active ? "bg-admin-brand text-white" : "text-admin-ink hover:bg-black/[0.05]",
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {it.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AdminShell({ children, email }: { children: React.ReactNode; email: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="sticky top-0 hidden h-[100dvh] flex-col border-r border-admin-line bg-white px-3 py-5 lg:flex">
        <Link href="/admin" className="px-3 text-2xl" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
          Undangan Digital
        </Link>
        <div className="mt-6 flex-1 overflow-y-auto">
          <NavList />
        </div>
        <div className="border-t border-admin-line pt-3">
          <p className="truncate px-3 text-xs text-admin-muted" title={email}>
            {email}
          </p>
          <SignOutButton compact />
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button type="button" aria-label="Tutup menu" className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[84%] max-w-xs flex-col bg-white px-3 py-5">
            <div className="flex items-center justify-between px-3">
              <span className="text-2xl" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                Undangan Digital
              </span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Tutup menu" className="grid h-10 w-10 place-items-center rounded-md hover:bg-black/5">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-6 flex-1 overflow-y-auto">
              <NavList onNavigate={() => setOpen(false)} />
            </div>
            <div className="border-t border-admin-line pt-3">
              <SignOutButton compact />
            </div>
          </div>
        </div>
      )}

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-admin-line bg-admin-bg/95 px-4 py-3 backdrop-blur sm:px-6">
          <button type="button" onClick={() => setOpen(true)} aria-label="Buka menu" className="grid h-10 w-10 place-items-center rounded-md border border-admin-line bg-white lg:hidden">
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <a href="/" target="_blank" rel="noopener noreferrer" className="hidden text-sm text-admin-muted underline-offset-4 hover:underline sm:inline">
            Lihat undangan publik
          </a>
          <PublishBar />
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
