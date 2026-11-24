import type { Config } from "tailwindcss";

// Semua warna undangan dibaca dari CSS variable yang diisi oleh tema aktif (lihat src/lib/theme.ts).
const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: v("c-primary"),
        secondary: v("c-secondary"),
        accent: v("c-accent"),
        bg: v("c-background"),
        surface: v("c-surface"),
        ink: v("c-text"),
        admin: {
          bg: "#F6F5F1",
          line: "#E4E1D8",
          ink: "#24261F",
          muted: "#5F6357",
          brand: "#454B40",
          danger: "#A23B2A",
          ok: "#3D6B45",
        },
      },
      fontFamily: {
        heading: ["var(--font-heading)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        script: ["var(--font-accent)", "cursive"],
        admin: ["var(--font-admin)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        theme: "var(--radius)",
      },
      transitionTimingFunction: {
        silk: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
