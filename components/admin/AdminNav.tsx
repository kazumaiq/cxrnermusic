"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldCheck,
  Disc,
  Radio,
  Users,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";

export default function AdminNav() {
  const pathname = usePathname();

  const links = [
    {
      href: "/admin",
      label: "Модерация Релизов",
      icon: Disc,
      active: pathname === "/admin",
    },
    {
      href: "/admin/links",
      label: "CXRNER LINK",
      icon: Radio,
      active: pathname === "/admin/links",
    },
    {
      href: "/admin/users",
      label: "Все Пользователи",
      icon: Users,
      active: pathname.startsWith("/admin/users"),
    },
    {
      href: "/admin/verifications",
      label: "Центр Верификации",
      icon: ShieldCheck,
      active: pathname.startsWith("/admin/verifications"),
    },
    {
      href: "/admin/referrals",
      label: "Контроль Рефералов",
      icon: TrendingUp,
      active: pathname.startsWith("/admin/referrals"),
    },
  ];

  return (
    <div className="w-full border-b border-white/10 bg-[#07050B]/95 backdrop-blur-xl sticky top-[57px] sm:top-[68px] z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-2.5 sm:py-3">
          {links.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono whitespace-nowrap transition duration-200 shrink-0 ${
                  item.active
                    ? "bg-[#8737FF] text-white shadow-[0_0_16px_rgba(135,55,255,0.45)] font-bold"
                    : "text-[#D9D9E2]/70 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${item.active ? "text-white" : "text-[#B46BFF]"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
