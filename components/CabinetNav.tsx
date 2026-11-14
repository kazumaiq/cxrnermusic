"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  User,
  Radio,
  Box,
  Layers,
  ShieldCheck,
  Users,
} from "lucide-react";

const CABINET_LINKS = [
  {
    href: "/dashboard",
    label: "Обзор",
    icon: LayoutDashboard,
    match: (p: string) => p === "/dashboard",
  },
  {
    href: "/cabinet/profile",
    label: "CXRNER ID",
    icon: User,
    match: (p: string) => p.startsWith("/cabinet/profile"),
  },
  {
    href: "/dashboard/links",
    label: "Smart Links",
    icon: Radio,
    match: (p: string) => p.startsWith("/dashboard/links"),
  },
  {
    href: "/drop",
    label: "CXRNER DROP",
    icon: Box,
    match: (p: string) => p === "/drop",
  },
  {
    href: "/cabinet/drop/inventory",
    label: "Инвентарь",
    icon: Layers,
    match: (p: string) => p.startsWith("/cabinet/drop/inventory"),
  },
  {
    href: "/cabinet/verification",
    label: "Верификация",
    icon: ShieldCheck,
    match: (p: string) => p.startsWith("/cabinet/verification"),
  },
  {
    href: "/cabinet/referrals",
    label: "Рефералы",
    icon: Users,
    match: (p: string) => p.startsWith("/cabinet/referrals"),
  },
];

export default function CabinetNav() {
  const pathname = usePathname() || "";

  // Reconcile any pending referral code captured from /join?ref=... in browser storage
  useEffect(() => {
    try {
      if (sessionStorage.getItem("cxrner_ref_checked") === "1") return;
      const stored = localStorage.getItem("cxrner_ref_code");
      const cookieMatch = document.cookie.match(/(?:^|; )cxrner_ref_code=([^;]+)/);
      const pendingCode = (stored || (cookieMatch ? decodeURIComponent(cookieMatch[1]) : "")).trim();
      if (!pendingCode) {
        sessionStorage.setItem("cxrner_ref_checked", "1");
        return;
      }

      fetch("/api/referral/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referralCode: pendingCode }),
      })
        .then((res) => res.json().catch(() => null))
        .then((data) => {
          sessionStorage.setItem("cxrner_ref_checked", "1");
          if (
            data &&
            (data.ok ||
              data.error === "ALREADY_ATTRIBUTED" ||
              data.error === "SELF_REFERRAL_FORBIDDEN" ||
              data.error === "REFERRER_NOT_FOUND")
          ) {
            localStorage.removeItem("cxrner_ref_code");
          }
        })
        .catch(() => {});
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className="sticky top-16 sm:top-[72px] z-30 border-b border-white/10 bg-[#050409]/92 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {CABINET_LINKS.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full font-mono text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-all shrink-0 ${
                active
                  ? "bg-white text-[#050407] shadow-[0_4px_16px_rgba(255,255,255,0.2)]"
                  : "text-[#D9D9E2]/65 hover:text-white hover:bg-white/[0.06]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
