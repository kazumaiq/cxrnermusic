"use client";

import { Suspense, useEffect, useRef, useState, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function getRouteLabel(href: string): string {
  if (href.startsWith("/drop") || href.startsWith("/cabinet/drop")) return "CXRNER DROP // ARCHIVE";
  if (href.startsWith("/profile")) return "CXRNER ID // ПРОФИЛЬ";
  if (href.startsWith("/cabinet/profile")) return "РЕДАКТОР ПРОФИЛЯ";
  if (href.startsWith("/cabinet/verification")) return "ВЕРИФИКАЦИЯ АРТИСТА";
  if (href.startsWith("/cabinet/referrals")) return "РЕФЕРАЛЬНАЯ СЕТЬ";
  if (href.startsWith("/dashboard/links/new")) return "СОЗДАНИЕ SMART LINK";
  if (href.startsWith("/dashboard/links")) return "CXRNER LINK // ССЫЛКИ";
  if (href.startsWith("/dashboard")) return "КАБИНЕТ АРТИСТА";
  if (href.startsWith("/link")) return "CXRNER LINK";
  if (href.startsWith("/admin/drop")) return "ADMIN // DROP ARCHIVE";
  if (href.startsWith("/admin")) return "ADMIN CONTROL CENTER";
  if (href.startsWith("/submit-release")) return "ПОДАЧА РЕЛИЗА";
  if (href.startsWith("/artists")) return "РОСТЕР АРТИСТОВ";
  if (href.startsWith("/contact")) return "КОНТАКТЫ";
  if (href.startsWith("/auth")) return "CXRNER ID // ВХОД";
  return "СИНХРОНИЗАЦИЯ";
}

function NavigationProgressInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showHudPill, setShowHudPill] = useState(false);
  const [routeLabel, setRouteLabel] = useState("ЗАГРУЗКА СТРАНИЦЫ");

  const trickleTimerRef = useRef<number | null>(null);
  const hudTimerRef = useRef<number | null>(null);
  const safetyTimerRef = useRef<number | null>(null);
  const completeTimerRef = useRef<number | null>(null);
  const currentUrlRef = useRef<string>("");

  const clearTimers = useCallback(() => {
    if (trickleTimerRef.current) {
      window.clearInterval(trickleTimerRef.current);
      trickleTimerRef.current = null;
    }
    if (hudTimerRef.current) {
      window.clearTimeout(hudTimerRef.current);
      hudTimerRef.current = null;
    }
    if (safetyTimerRef.current) {
      window.clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
    if (completeTimerRef.current) {
      window.clearTimeout(completeTimerRef.current);
      completeTimerRef.current = null;
    }
  }, []);

  const finishProgress = useCallback(() => {
    clearTimers();
    setProgress(100);
    setShowHudPill(false);

    completeTimerRef.current = window.setTimeout(() => {
      setIsNavigating(false);
      setProgress(0);
    }, 280);
  }, [clearTimers]);

  const startProgress = useCallback(
    (targetPath?: string) => {
      clearTimers();
      setRouteLabel(targetPath ? getRouteLabel(targetPath) : "ЗАГРУЗКА СТРАНИЦЫ");
      setIsNavigating(true);
      setProgress(14);
      setShowHudPill(false);

      // Show sleek HUD pill only if navigation takes longer than 260ms
      hudTimerRef.current = window.setTimeout(() => {
        setShowHudPill(true);
      }, 260);

      // Smooth asymptotic trickle towards 92%
      trickleTimerRef.current = window.setInterval(() => {
        setProgress((prev) => {
          if (prev >= 92) return prev;
          const step = prev < 45 ? 11 : prev < 75 ? 5 : 1.8;
          return Math.min(92, Number((prev + step).toFixed(1)));
        });
      }, 180);

      // Safety timeout so bar never stays stuck indefinitely
      safetyTimerRef.current = window.setTimeout(() => {
        finishProgress();
      }, 10000);
    },
    [clearTimers, finishProgress]
  );

  // Complete progress whenever pathname or searchParams changes
  useEffect(() => {
    const nextUrl = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`;
    if (currentUrlRef.current && currentUrlRef.current !== nextUrl) {
      finishProgress();
    }
    currentUrlRef.current = nextUrl;
  }, [pathname, searchParams, finishProgress]);

  // Listen to internal link clicks, form submissions, and browser navigation
  useEffect(() => {
    currentUrlRef.current = `${window.location.pathname}${window.location.search}`;

    const handleClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const target = e.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;
      if (anchor.getAttribute("target") === "_blank" || anchor.hasAttribute("download")) return;
      if (href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) return;

      // Ignore pure same-page hash links
      if (href.startsWith("#")) return;

      try {
        const url = new URL(href, window.location.origin);
        if (url.origin !== window.location.origin) return;

        const currentFull = `${window.location.pathname}${window.location.search}`;
        const nextFull = `${url.pathname}${url.search}`;

        // Ignore same URL (e.g. /#about when already on /)
        if (currentFull === nextFull) return;

        startProgress(url.pathname);
      } catch {
        // Ignore malformed URLs
      }
    };

    const handlePopState = () => {
      startProgress(window.location.pathname);
    };

    // Wrap history.pushState so programmatic router.push() also triggers the bar
    const originalPushState = window.history.pushState.bind(window.history);
    window.history.pushState = function (data: any, unused: string, url?: string | URL | null) {
      if (url) {
        try {
          const parsed = new URL(String(url), window.location.origin);
          const currentFull = `${window.location.pathname}${window.location.search}`;
          const nextFull = `${parsed.pathname}${parsed.search}`;
          if (parsed.origin === window.location.origin && currentFull !== nextFull) {
            startProgress(parsed.pathname);
          }
        } catch {}
      }
      return originalPushState(data, unused, url);
    };

    document.addEventListener("click", handleClick, true);
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("popstate", handlePopState);
      window.history.pushState = originalPushState;
      clearTimers();
    };
  }, [startProgress, clearTimers]);

  if (!isNavigating && progress === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[9999]" aria-hidden="true">
      {/* Main Top Neon Laser Bar */}
      <div className="relative h-[3px] w-full bg-transparent overflow-visible">
        <div
          className="h-full relative transition-[width,opacity] duration-200 ease-out"
          style={{
            width: `${progress}%`,
            opacity: progress >= 100 ? 0 : 1,
            background:
              "linear-gradient(90deg, #8737FF 0%, #B46BFF 45%, #00F0FF 85%, #FFFFFF 100%)",
            boxShadow:
              "0 0 12px rgba(0, 240, 255, 0.85), 0 0 24px rgba(135, 55, 255, 0.75)",
          }}
        >
          {/* Leading Glowing Pulse Spark */}
          <span
            className="absolute right-0 top-1/2 -translate-y-1/2 w-24 h-[5px] rounded-full blur-[2px]"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, #00F0FF 60%, #FFFFFF 100%)",
            }}
          />
          <span className="absolute -right-1 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_14px_4px_#00F0FF]" />
        </div>
      </div>

      {/* Sleek Floating Cyber-HUD Pill for slower route transitions */}
      <div
        className={`flex justify-center transition-all duration-300 ${
          showHudPill
            ? "opacity-100 translate-y-3 sm:translate-y-20"
            : "opacity-0 -translate-y-2"
        }`}
      >
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-[#B46BFF]/40 bg-[#090611]/90 backdrop-blur-xl shadow-[0_8px_30px_rgba(135,55,255,0.35)]">
          {/* Mini Equalizer Bars */}
          <span className="flex items-end gap-[2px] h-3">
            <span className="w-[2px] bg-[#8737FF] rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-2" />
            <span className="w-[2px] bg-[#00F0FF] rounded-full animate-[pulse_0.5s_ease-in-out_0.15s_infinite] h-3" />
            <span className="w-[2px] bg-[#B46BFF] rounded-full animate-[pulse_0.7s_ease-in-out_0.3s_infinite] h-1.5" />
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white font-semibold">
            {routeLabel}
          </span>
          <span className="font-mono text-[10px] text-[#00F0FF] font-bold tabular-nums">
            {Math.round(progress)}%
          </span>
        </div>
      </div>
    </div>
  );
}

export default function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressInner />
    </Suspense>
  );
}
