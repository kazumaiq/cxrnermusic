"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, User, Radio, Box } from "lucide-react";

const CABINET_LINKS = [
  {
    href: "/dashboard",
    label: "Мои релизы",
    icon: LayoutDashboard,
    match: (p: string) =>
      p === "/dashboard" || p.startsWith("/dashboard/release"),
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
    match: (p: string) =>
      p === "/drop" || p.startsWith("/cabinet/drop"),
  },
  {
    href: "/cabinet/profile",
    label: "Профиль",
    icon: User,
    match: (p: string) =>
      p.startsWith("/cabinet/profile") ||
      p.startsWith("/cabinet/verification") ||
      p.startsWith("/cabinet/referrals"),
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
    <div className="sticky top-16 sm:top-[72px] z-30 border-b border-white/12 bg-[#0E0922]/92 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
        {CABINET_LINKS.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-sans text-xs sm:text-[13px] font-bold whitespace-nowrap transition-all shrink-0 ${
                active
                  ? "bg-white text-[#0C071A] shadow-[0_4px_16px_rgba(255,255,255,0.22)]"
                  : "text-[#E6E1FA] bg-white/[0.05] hover:text-white hover:bg-white/[0.12] border border-white/[0.08]"
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
