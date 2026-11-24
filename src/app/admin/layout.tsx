import type { Metadata, Viewport } from "next";
import { AdminProviders } from "@/components/ui";

export const metadata: Metadata = {
  title: { default: "Dashboard Undangan", template: "%s · Dashboard Undangan" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#454B40" };

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin min-h-[100dvh] bg-admin-bg font-admin text-admin-ink">
      {/* App Router: link stylesheet di layout berlaku untuk seluruh /admin. */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=DM+Sans:wght@400;500;600&display=swap"
        precedence="default"
      />
      <AdminProviders>{children}</AdminProviders>
    </div>
  );
}
