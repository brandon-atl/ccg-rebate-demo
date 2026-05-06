"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Executive Summary" },
  { href: "/action-list", label: "BI Action List" },
  { href: "/data-quality", label: "Data Quality" },
  { href: "/cohort-preview", label: "Cohort Preview" },
  { href: "/architecture", label: "Architecture" },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="-mb-px flex flex-wrap items-end gap-x-1 gap-y-1 text-[12.5px]">
      {items.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              "rounded-t-md border-b-2 px-3.5 py-2 font-medium transition-colors " +
              (active
                ? "border-white bg-white/10 text-white"
                : "border-transparent text-white/65 hover:bg-white/5 hover:text-white")
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
