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
    <nav className="-mb-px flex flex-nowrap items-end gap-x-1 gap-y-1 px-1 text-[12.5px] md:flex-wrap md:px-0">
      {items.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              "whitespace-nowrap rounded-t-md border-b-2 px-3 py-2 font-medium transition-colors md:px-3.5 " +
              (active
                ? "border-white bg-white/15 text-white"
                : "border-transparent text-white/70 hover:bg-white/5 hover:text-white")
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
