import Link from "next/link";
import {
  ArrowRight,
  Barcode,
  BarChart3,
  Clock,
  Palette,
  Radio,
  Sparkles,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import Container from "@/components/Container";
import { SMART_LINK_THEMES } from "@/lib/smartLinkThemes";
import RadarReleaseChart from "@/components/link/RadarReleaseChart";

export const metadata = {
  title: "CXRNER LINK — Смарт-ссылки для музыкантов",
  description:
    "Создавайте умные страницы релизов за 30 секунд по UPC. Аналитика переходов, Pre-save и 7 дизайнерских тем оформления.",
};

const FEATURES = [
  {
    code: "01",
    icon: Barcode,
    title: "Поиск по UPC и названию",
    desc: "Автоматически подтягиваем обложку высокого разрешения и ссылки на площадки по вашему штрихкоду или треку.",
  },
  {
    code: "02",
    icon: Clock,
    title: "Таймер Pre-save",
    desc: "Живой обратный отсчет до премьеры и сбор email-подписок фанатов с автоматическим переключением в режим Слушать.",
  },
  {
    code: "03",
    icon: Palette,
    title: "Визуальный конструктор (7 тем)",
    desc: "Полная кастомизация размытия обложки, акцентного цвета, формы кнопок, шрифтов и аудио-превью.",
  },
  {
    code: "04",
    icon: BarChart3,
    title: "Аналитика каждого клика",
    desc: "Графики просмотров, уникальных посетителей, CTR и точное распределение переходов между стриминг-сервисами.",
  },
];

export default function CxrnerLinkLandingPage() {
  const themeEntries = Object.values(SMART_LINK_THEMES);

  return (
    <div className="relative min-h-[100svh] bg-[#040307] text-white pt-28 pb-24 overflow-x-clip">
      <Container className="relative z-10 space-y-20">
        {/* Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/35 font-mono text-[10px] uppercase tracking-[0.24em] text-[#00F0FF]">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>CXRNER LINK // MUSIC SMART ROUTING</span>
            </div>

            <h1 className="font-display font-black text-4xl sm:text-6xl uppercase tracking-tight leading-[0.95] text-white">
              ОДНА ССЫЛКА ДЛЯ <span className="text-chrome-gradient">ВСЕХ ПЛОЩАДОК</span>
            </h1>

            <p className="text-sm sm:text-base text-[#D9D9E2]/75 max-w-xl leading-relaxed">
              Единая страница вашего трека или альбома за 30 секунд. Профессиональный дизайн,
              сбор Pre-save до дня релиза и подробная аналитика аудитории без подписок.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/dashboard/links/new"
                className="btn-void-primary px-8 py-4 text-xs"
              >
                <Sparkles className="w-4 h-4 text-[#8737FF]" />
                <span>Создать Smart Link</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/dashboard/links"
                className="btn-void-ghost px-7 py-4 text-xs"
              >
                <span>Мои ссылки</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 font-mono text-[11px] text-[#D9D9E2]/60">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00F0FF]" />
                <span>Бесплатно для артистов CXRNER</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00F0FF]" />
                <span>QR-код и кастомный slug</span>
              </span>
            </div>
          </div>

          {/* Interactive Spec Device Card */}
          <div className="lg:col-span-5">
            <div className="cxr-panel-chrome rounded-3xl p-6 space-y-5">
              <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-white/50 border-b border-white/10 pb-3">
                <span>RELEASE PREVIEW // LIVE</span>
                <span className="text-[#00F0FF]">150+ DSP</span>
              </div>

              <div className="flex items-center gap-4">
                <img
                  src="/covers/the-sadness-of-reality.jpg"
                  alt="Cover"
                  className="w-20 h-20 rounded-xl object-cover border border-white/20 shadow-lg"
                />
                <div>
                  <span className="font-mono text-[10px] uppercase text-[#00F0FF]">
                    NEIMEKS
                  </span>
                  <h3 className="font-display font-black text-lg text-white">
                    The Sadness of Reality
                  </h3>
                  <p className="font-mono text-[10px] text-white/50">
                    Electronic · CXRNER MUSIC
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {["Яндекс Музыка", "VK Музыка", "Spotify", "Apple Music"].map((dsp) => (
                  <div
                    key={dsp}
                    className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs"
                  >
                    <span className="font-bold text-white">{dsp}</span>
                    <span className="font-mono text-[10px] text-[#00F0FF]">СЛУШАТЬ →</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Capabilities Grid */}
        <RadarReleaseChart />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.code}
                className="cxr-panel rounded-2xl p-5 sm:p-6 space-y-3 hover:border-white/25 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#00F0FF]/10 border border-[#00F0FF]/25 flex items-center justify-center text-[#00F0FF]">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-[10px] text-white/40">// {f.code}</span>
                </div>
                <h2 className="font-display font-bold text-base text-white uppercase">
                  {f.title}
                </h2>
                <p className="text-xs text-[#D9D9E2]/65 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>

        {/* 7 Built-In Visual Themes */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#B46BFF]">
                // VISUAL STUDIO TEMPLATES
              </span>
              <h2 className="font-display font-black text-2xl sm:text-4xl uppercase tracking-tight text-white mt-1">
                {themeEntries.length} Авторских Тем Оформления
              </h2>
            </div>
            <Link
              href="/dashboard/links/new"
              className="font-mono text-xs text-[#00F0FF] hover:underline inline-flex items-center gap-1"
            >
              <span>Попробовать в конструкторе</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {themeEntries.map((t) => (
              <div
                key={t.id}
                className="cxr-panel rounded-2xl p-4 space-y-2.5 text-center"
              >
                <div
                  className="w-10 h-10 rounded-full mx-auto border border-white/20 shadow-lg"
                  style={{
                    backgroundColor: t.accentHex,
                    boxShadow: `0 0 24px ${t.accentHex}55`,
                  }}
                />
                <div className="font-display font-bold text-xs text-white uppercase">
                  {t.id}
                </div>
                <div className="font-mono text-[9px] text-white/50 line-clamp-1">
                  {t.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
}
