/* eslint-disable react/jsx-no-useless-fragment */
"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import {
  SessionContextProvider,
  useSessionContext,
} from "@supabase/auth-helpers-react";
import { getSupabaseBrowserClient } from "../lib/supabaseClient";

type ProvidersProps = {
  children: ReactNode;
};

function AnimatedMain({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.main
        key={pathname}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="pt-20"
      >
        {children}
      </motion.main>
    </AnimatePresence>
  );
}

export function useSupabaseSession() {
  return useSessionContext();
}

export default function Providers({ children }: ProvidersProps) {
  const supabaseClient = getSupabaseBrowserClient();

  return (
    <SessionContextProvider supabaseClient={supabaseClient}>
      <AnimatedMain>{children}</AnimatedMain>
    </SessionContextProvider>
  );
}

