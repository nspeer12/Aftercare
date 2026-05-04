"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const items: NavItem[] = [
  {
    href: "/",
    label: "Today",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <path
          d="M4 7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7Z"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <path d="M8 3v3M16 3v3M4 10h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/meds",
    label: "Meds",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <rect x="3" y="9" width="18" height="6" rx="3" stroke="currentColor" strokeWidth="1.6" />
        <path d="M12 9v6" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    href: "/scan",
    label: "Scan",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7">
        <path
          d="M4 8V6a2 2 0 0 1 2-2h2M4 16v2a2 2 0 0 0 2 2h2M20 8V6a2 2 0 0 0-2-2h-2M20 16v2a2 2 0 0 1-2 2h-2"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <rect x="8" y="9" width="8" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    href: "/streaks",
    label: "Streaks",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <path
          d="M12 3s4 4.5 4 8a4 4 0 0 1-8 0c0-1.5.5-2.5 1-3.5 0 0 .5 1 1.5 1 0-2 1.5-5.5 1.5-5.5Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "Me",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.6" />
        <path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 pointer-events-none">
      <div className="mx-auto max-w-md px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 pointer-events-auto">
        <div className="flex items-center justify-between rounded-2xl border border-card-border bg-card/95 backdrop-blur shadow-lg shadow-black/5 px-2 py-1.5">
          {items.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(item.href);
            const isScan = item.href === "/scan";
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  isScan
                    ? "flex flex-col items-center justify-center -mt-6 size-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                    : `flex flex-col items-center justify-center px-3 py-1.5 rounded-xl text-[11px] font-medium transition ${
                        active
                          ? "text-primary"
                          : "text-muted hover:text-foreground"
                      }`
                }
              >
                {item.icon}
                {!isScan && <span className="mt-0.5">{item.label}</span>}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
