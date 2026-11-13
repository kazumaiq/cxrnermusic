import React from "react";

export default function LinkLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen w-full bg-[#050407] text-white selection:bg-[#8737FF] selection:text-white isolate overflow-x-hidden">
      {/* 100% Solid viewport backdrop */}
      <div className="fixed inset-0 bg-[#050407] -z-50 pointer-events-none" aria-hidden="true" />
      {children}
    </div>
  );
}
