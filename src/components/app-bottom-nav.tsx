"use client";

import { Compass, House } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "My Routines", icon: House },
  { href: "/explore", label: "Explore", icon: Compass },
];

export function AppBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 mx-auto flex w-full max-w-[440px] border-t border-slate-200 bg-white/95 px-3 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:bottom-5 sm:rounded-b-[2rem]"
      aria-label="Primary navigation"
    >
      {items.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/" ? pathname === href : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-16 flex-1 flex-col items-center justify-center gap-1 rounded-2xl text-xs font-bold transition ${
              active ? "text-[var(--brand)]" : "text-slate-400"
            }`}
          >
            <Icon
              className={`size-6 ${active ? "fill-sky-100" : ""}`}
              strokeWidth={active ? 2.5 : 2}
              aria-hidden="true"
            />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
