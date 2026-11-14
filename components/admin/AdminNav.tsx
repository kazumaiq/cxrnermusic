"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Disc3,
  Layers,
  Box,
  Radio,
  Users,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

export default function AdminNav() {
  const pathname = usePathname() || "";

  const links = [
    {
      href: "/admin",
      label: "Модерация",
      icon: Disc3,
      active: pathname === "/admin",
    },
    {
      href: "/admin/distribution",
      label: "CMS Релизы",
      icon: Layers,
      active: pathname.startsWith("/admin/distribution"),
    },
    {
      href: "/admin/drop",
      label: "DROP Archive",
      icon: Box,
      active: pathname.startsWith("/admin/drop"),
    },
    {
      href: "/admin/links",
      label: "Smart Links",
      icon: Radio,
      active: pathname.startsWith("/admin/links"),
    },
    {
      href: "/admin/users",
      label: "Пользователи",
      icon: Users,
      active: pathname.startsWith("/admin/users"),
    },
    {
      href: "/admin/verifications",
      label: "Верификации",
      icon: ShieldCheck,
      active: pathname.startsWith("/admin/verifications"),
    },
    {
      href: "/admin/referrals",
      label: "Рефералы",
      icon: TrendingUp,
      active: pathname.startsWith("/admin/referrals"),
    },
  ];

  return (
    <div className="sticky top-16 sm:top-[72px] z-30 border-b border-white/10 bg-[#050409]/94 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
        <div className="hidden lg:flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[#00F0FF] shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF] animate-pulse" />
          <span>COMMAND CENTER</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {links.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full font-mono text-[11px] font-bold uppercase tracking-wider whitespace-nowrap transition-all shrink-0 ${
                  item.active
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
    </div>
  );
}
