import type { Metadata } from "next";
import { Toaster } from "@/components/Toaster";
import "./globals.css";

export const metadata: Metadata = {
  title: "CCG Rebate Leakage Dashboard",
  description: "Synthetic NetSuite-style rebate leakage dashboard. Bronze → silver → gold pipeline with a Power BI consumption surface.",
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
