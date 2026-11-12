"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Eye,
  MousePointerClick,
  Users,
  Sparkles,
  TrendingUp,
  Smartphone,
  Globe,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

interface AnalyticsData {
  totalViews: number;
  uniqueVisitors: number;
  totalClicks: number;
  totalPresaves: number;
  conversionRate: number;
  platformCounts: Record<string, number>;
  deviceCounts: Record<string, number>;
  countryCounts: Record<string, number>;
  dailyTimeline: Array<{ date: string; views: number; clicks: number; presaves: number }>;
}

export default function LinkAnalyticsClient({
  linkId,
  linkTitle,
  linkSlug,
}: {
  linkId: string;
  linkTitle: string;
  linkSlug: string;
}) {
  const [range, setRange] = useState<"today" | "7d" | "30d" | "90d" | "all">("30d");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/link/${linkId}/analytics?range=${range}`);
      const json = await res.json();
      if (json.success && json.stats) {
        setData(json.stats);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [linkId, range]);

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/links"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#D9D9E2] transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-heavy text-2xl sm:text-3xl uppercase tracking-tight text-white truncate max-w-md">
              Аналитика: {linkTitle}
            </h1>
            <div className="flex items-center gap-2 font-mono text-xs text-[#B46BFF] mt-0.5">
              <span>link.cxrnermusic.com/{linkSlug}</span>
              <a
                href={`/link/${linkSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Timeframe Selector Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/40 border border-white/10 font-mono text-xs">
          {[
            { id: "today", label: "Сегодня" },
            { id: "7d", label: "7 Дней" },
            { id: "30d", label: "30 Дней" },
            { id: "90d", label: "90 Дней" },
            { id: "all", label: "Всё время" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setRange(item.id as any)}
              className={`px-3 py-1.5 rounded-xl uppercase tracking-wider transition ${
                range === item.id ? "bg-[#8737FF] text-white font-bold shadow-md" : "text-[#D9D9E2]/60 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && !data ? (
        <div className="p-16 text-center font-mono text-xs text-[#D9D9E2]/60 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-[#B46BFF]" />
          <span>Загрузка аналитических данных...</span>
        </div>
      ) : data ? (
        <>
          {/* Main KPI Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
            <div className="p-5 rounded-2xl border border-white/10 bg-[#090611]/80 backdrop-blur-md">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#D9D9E2]/60">
                  Просмотры
                </span>
                <Eye className="w-3.5 h-3.5 text-[#B46BFF]" />
              </div>
              <p className="font-heavy text-3xl text-white">
                {data.totalViews.toLocaleString("ru-RU")}
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-white/10 bg-[#090611]/80 backdrop-blur-md">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#D9D9E2]/60">
                  Уникальные
                </span>
                <Users className="w-3.5 h-3.5 text-[#00F0FF]" />
              </div>
              <p className="font-heavy text-3xl text-[#00F0FF]">
                {data.uniqueVisitors.toLocaleString("ru-RU")}
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-white/10 bg-[#090611]/80 backdrop-blur-md">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#D9D9E2]/60">
                  Клики по площадкам
                </span>
                <MousePointerClick className="w-3.5 h-3.5 text-[#8737FF]" />
              </div>
              <p className="font-heavy text-3xl text-[#B46BFF]">
                {data.totalClicks.toLocaleString("ru-RU")}
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-white/10 bg-[#090611]/80 backdrop-blur-md">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#D9D9E2]/60">
                  Pre-save подписки
                </span>
                <Sparkles className="w-3.5 h-3.5 text-[#FF2E93]" />
              </div>
              <p className="font-heavy text-3xl text-white">
                {data.totalPresaves.toLocaleString("ru-RU")}
              </p>
            </div>

            <div className="col-span-2 md:col-span-1 p-5 rounded-2xl border border-[#00F0FF]/30 bg-[#00F0FF]/10 backdrop-blur-md">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#00F0FF]">
                  Конверсия (CTR)
                </span>
                <TrendingUp className="w-3.5 h-3.5 text-[#00F0FF]" />
              </div>
              <p className="font-heavy text-3xl text-white">{data.conversionRate}%</p>
            </div>
          </div>

          {/* Breakdown Rows: Platforms & Devices */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Platform Clicks Breakdown */}
            <div className="p-6 rounded-3xl border border-white/10 bg-[#090611]/80 space-y-4">
              <h3 className="font-heavy text-lg uppercase text-white flex items-center justify-between">
                <span>Клики по музыкальным платформам</span>
                <span className="font-mono text-xs text-[#B46BFF]">
                  {data.totalClicks} переходов
                </span>
              </h3>

              {Object.keys(data.platformCounts).length === 0 ? (
                <p className="font-mono text-xs text-[#D9D9E2]/50 py-6 text-center">
                  Пока нет зарегистрированных кликов за выбранный период
                </p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(data.platformCounts).map(([key, count]) => {
                    const pct = data.totalClicks > 0 ? Math.round((count / data.totalClicks) * 100) : 0;
                    return (
                      <div key={key} className="space-y-1.5">
                        <div className="flex items-center justify-between font-mono text-xs text-white">
                          <span className="uppercase font-bold">{key}</span>
                          <span className="text-[#D9D9E2]/70">
                            {count} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#8737FF] to-[#00F0FF] rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Devices & Geography Breakdown */}
            <div className="p-6 rounded-3xl border border-white/10 bg-[#090611]/80 space-y-6">
              <div>
                <h3 className="font-heavy text-lg uppercase text-white mb-4">
                  Устройства слушателей
                </h3>
                <div className="grid grid-cols-3 gap-3 font-mono text-center">
                  <div className="p-3 rounded-xl border border-white/10 bg-black/40">
                    <Smartphone className="w-4 h-4 mx-auto mb-1 text-[#00F0FF]" />
                    <p className="font-heavy text-lg text-white">
                      {data.deviceCounts.mobile || 0}
                    </p>
                    <p className="text-[9px] uppercase tracking-wider text-[#D9D9E2]/60">
                      Смартфоны
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-white/10 bg-black/40">
                    <Globe className="w-4 h-4 mx-auto mb-1 text-[#B46BFF]" />
                    <p className="font-heavy text-lg text-white">
                      {data.deviceCounts.desktop || 0}
                    </p>
                    <p className="text-[9px] uppercase tracking-wider text-[#D9D9E2]/60">
                      Десктоп
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-white/10 bg-black/40">
                    <Eye className="w-4 h-4 mx-auto mb-1 text-white/50" />
                    <p className="font-heavy text-lg text-white">
                      {data.deviceCounts.tablet || 0}
                    </p>
                    <p className="text-[9px] uppercase tracking-wider text-[#D9D9E2]/60">
                      Планшеты
                    </p>
                  </div>
                </div>
              </div>

              {/* Top Countries */}
              <div>
                <h4 className="font-heavy text-base uppercase text-white mb-2">
                  География переходов
                </h4>
                {Object.keys(data.countryCounts).length === 0 ? (
                  <p className="font-mono text-xs text-[#D9D9E2]/50">Данные собираются</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(data.countryCounts).map(([code, count]) => (
                      <span
                        key={code}
                        className="px-3 py-1 rounded-full bg-white/5 border border-white/10 font-mono text-xs text-white"
                      >
                        {code}: <span className="font-bold text-[#B46BFF]">{count}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
