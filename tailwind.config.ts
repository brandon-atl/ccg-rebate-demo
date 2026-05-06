import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "'Segoe UI'",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "'Helvetica Neue'",
          "Arial",
          "sans-serif",
        ],
        mono: ["'Cascadia Mono'", "'SF Mono'", "Menlo", "Consolas", "monospace"],
      },
      colors: {
        canvas: "#F4F1EA",
        surface: "#FFFFFF",
        ink: {
          DEFAULT: "#1F2937",
          muted: "#475569",
          subtle: "#64748B",
          faint: "#94A3B8",
        },
        rule: {
          DEFAULT: "#E5E1D8",
          strong: "#D6D1C5",
        },
        chrome: "#1B2A4E",
        accent: {
          azure: "#0078D4",
          deep: "#003E7E",
        },
        owner: {
          anthony: "#C2410C",
          "anthony-bg": "#FFEDD5",
          "anthony-rule": "#FED7AA",
          georgiana: "#047857",
          "georgiana-bg": "#D1FAE5",
          "georgiana-rule": "#A7F3D0",
          leadership: "#6D28D9",
          "leadership-bg": "#EDE9FE",
          "leadership-rule": "#DDD6FE",
          biteam: "#1D4ED8",
          "biteam-bg": "#DBEAFE",
          "biteam-rule": "#BFDBFE",
        },
        priority: {
          p1: "#B91C1C",
          "p1-bg": "#FEE2E2",
          p2: "#B45309",
          "p2-bg": "#FEF3C7",
          p3: "#166534",
          "p3-bg": "#DCFCE7",
        },
        trend: {
          open: "#DC2626",
          recovered: "#16A34A",
        },
      },
      boxShadow: {
        tile: "0 1px 0 rgba(15,23,42,0.04), 0 1px 2px rgba(15,23,42,0.04)",
        panel: "0 1px 0 rgba(15,23,42,0.04), 0 2px 6px rgba(15,23,42,0.05)",
      },
      letterSpacing: {
        meta: "0.06em",
      },
    },
  },
  plugins: [],
};

export default config;
