"use client";

import React from "react";
import { usePathname } from "next/navigation";

export default function ChromeShell({
  header,
  footer,
  children,
}: {
  header: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "";
  const isStandaloneSmartLink = /^\/link\/[^/]+/.test(pathname);
  const isMiniApp = pathname.startsWith("/miniapp");

  if (isStandaloneSmartLink || isMiniApp) {
    return (
      <div className="relative min-h-screen flex flex-col justify-between overflow-x-hidden">
        <main className="flex-1">{children}</main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-x-hidden">
      {header}
      <main className="flex-1">{children}</main>
      {footer}
    </div>
  );
}
