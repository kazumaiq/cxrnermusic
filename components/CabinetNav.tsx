"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User,
  Disc,
  Radio,
  Boxes,
  ShieldCheck,
  Users,
  Sparkles,
} from "lucide-react";

export default function CabinetNav() {
  const pathname = usePathname();

  const links = [
    {
      href: "/dashboard",
      label: "Релизы",
      icon: Disc,
      active: pathname === "/dashboard",
    },
    {
      href: "/dashboard/links",
      label: "CXRNER LINK",
      icon: Radio,
      active: pathname.startsWith("/dashboard/links"),
      badge: "NEW",
    },
    {
      href: "/cabinet/profile",
      label: "CXRNER ID",
      icon: User,
      active: pathname.startsWith("/cabinet/profile"),
    },
    {
      href: "/cabinet/drop/inventory",
      label: "DROP & Коллекция",
      icon: Boxes,
      active: pathname.startsWith("/cabinet/drop"),
    },
    {
      href: "/cabinet/verification",
      label: "Верификация",
      icon: ShieldCheck,
      active: pathname.startsWith("/cabinet/verification"),
    },
    {
      href: "/cabinet/referrals",
      label: "Рефералы",
      icon: Users,
      active: pathname.startsWith("/cabinet/referrals"),
    },
  ];

  return (
    <div className="w-full border-b border-white/10 bg-[#07050B]/90 backdrop-blur-xl sticky top-[57px] sm:top-[68px] z-30">
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
                {item.badge && (
                  <span className="px-1.5 py-0.2 rounded-full bg-[#00F0FF] text-black text-[9px] font-black tracking-wider">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
