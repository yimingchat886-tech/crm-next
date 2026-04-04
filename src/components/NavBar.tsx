"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/orders", label: "Orders" },
  { href: "/costs", label: "Costs" },
  { href: "/analytics", label: "Analytics" },
  { href: "/settings", label: "Settings" },
];

export default function NavBar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/costs") return pathname.startsWith("/costs");
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <nav className="glass-nav shadow-sm sticky top-0 z-50 w-full">
      <div className="flex items-center justify-between h-16 w-full px-6 max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-10">
          <Link
            href="/orders"
            className="text-xl font-extrabold tracking-tight text-on-surface"
            style={{ fontFamily: "var(--font-manrope, Manrope)" }}
          >
            CRM Next
          </Link>
          <div className="flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={[
                  "text-sm font-medium pb-1 transition-all active:scale-95",
                  isActive(link.href)
                    ? "text-primary border-b-2 border-primary font-semibold"
                    : "text-on-surface-variant hover:text-on-surface",
                ].join(" ")}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="relative w-full max-w-xs group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-outline group-focus-within:text-primary transition-colors text-xl">
              search
            </span>
          </div>
          <input
            type="text"
            placeholder="Search..."
            className="block w-full pl-10 pr-4 py-2 glass-search rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline text-on-surface"
          />
        </div>
      </div>
    </nav>
  );
}
