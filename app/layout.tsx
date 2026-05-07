import type { Metadata } from "next";
import { Toaster } from "@/components/Toaster";
import "./globals.css";

export const metadata: Metadata = {
  title: "CCG Rebate Recovery Command Center",
  description: "Synthetic NetSuite-style rebate leakage dashboard for CCG Data Engineer interview prep.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Toaster>{children}</Toaster>
      </body>
    </html>
  );
}
