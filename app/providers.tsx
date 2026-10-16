"use client";

import type { ReactNode } from "react";

type ProvidersProps = {
  children: ReactNode;
};

export default function Providers({ children }: ProvidersProps) {
  // Do NOT wrap children in opacity: 0 motion.main or page transitions that block SSR
  // This was the exact cause of the blank mobile page on iPhone!
  return <>{children}</>;
}
