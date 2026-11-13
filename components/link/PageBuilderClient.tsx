"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Paintbrush,
  Smartphone,
  Monitor,
  Save,
  RotateCcw,
  ExternalLink,
  ArrowLeft,
  Check,
  Eye,
  Sparkles,
  Sliders,
  Type,
  Layout,
  Palette,
} from "lucide-react";
import PublicSmartLink, { SmartLinkData, PlatformItem } from "./PublicSmartLink";

const TEMPLATE_PRESETS = {
  CYBER: {
    theme: "CYBER",
    background_type: "blur",
    background_color: "#090611",
    accent_color: "#8737FF",
    cover_blur: 64,
    button_radius: "full",
    button_style: "glass",
    font_family: "sans",
    show_countdown: true,
    show_socials: true,
    show_audio_preview: true,
  },
  CINEMATIC: {
    theme: "CINEMATIC",
    background_type: "blur",
    background_color: "#050407",
    accent_color: "#B46BFF",
    cover_blur: 84,
    button_radius: "xl",
    button_style: "glass",
    font_family: "sans",
    show_countdown: true,
    show_socials: true,
    show_audio_preview: true,
  },
  MINIMAL: {
    theme: "MINIMAL",
    background_type: "solid",
    background_color: "#050407",
    accent_color: "#FFFFFF",
    cover_blur: 0,
    button_radius: "lg",
    button_style: "solid",
    font_family: "sans",
    show_countdown: true,
    show_socials: true,
    show_audio_preview: true,
  },
  BRUTAL: {
    theme: "BRUTAL",
    background_type: "mesh",
    background_color: "#000000",
    accent_color: "#00F0FF",
    cover_blur: 32,
    button_radius: "none",
    button_style: "outline",
    font_family: "mono",
    show_countdown: true,
    show_socials: true,
    show_audio_preview: true,
  },
  AUTUMN: {
    theme: "AUTUMN",
    background_type: "blur",
    background_color: "#190b05",
    accent_color: "#F59E0B",
    cover_blur: 72,
    button_radius: "xl",
    button_style: "glass",
    font_family: "serif",
    show_countdown: true,
    show_socials: true,
    show_audio_preview: true,
  },
  WINTER: {
    theme: "WINTER",
    background_type: "blur",
    background_color: "#081728",
    accent_color: "#38BDF8",
    cover_blur: 72,
    button_radius: "xl",
    button_style: "glass",
    font_family: "sans",
    show_countdown: true,
    show_socials: true,
    show_audio_preview: true,
  },
  SAKURA: {
    theme: "SAKURA",
    background_type: "blur",
    background_color: "#150820",
    accent_color: "#F472B6",
    cover_blur: 72,
    button_radius: "xl",
    button_style: "glass",
    font_family: "sans",
    show_countdown: true,
    show_socials: true,
    show_audio_preview: true,
  },
};

export default function PageBuilderClient({
  initialLink,
  initialPlatforms,
}: {
  initialLink: SmartLinkData;
  platforms: PlatformItem[];
  initialPlatforms: PlatformItem[];
}) {
  const [template, setTemplate] = useState<string>(initialLink.template || "CYBER");
  const [designConfig, setDesignConfig] = useState<any>(() => {
    return (
      initialLink.design_config ||
      TEMPLATE_PRESETS[initialLink.template as keyof typeof TEMPLATE_PRESETS] ||
      TEMPLATE_PRESETS.CYBER
    );
  });

  const [previewMode, setPreviewMode] = useState<"mobile" | "desktop">("mobile");
  const [activeTab, setActiveTab] = useState<"presets" | "colors" | "layout" | "blocks">("presets");

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  const updateConfig = (key: string, value: any) => {
    setDesignConfig((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleApplyPreset = (key: keyof typeof TEMPLATE_PRESETS) => {
    setTemplate(key);
    setDesignConfig(TEMPLATE_PRESETS[key]);
  };

  const handleSaveDesign = async () => {
    setIsSaving(true);
    setSaveError("");
    setSaveSuccess(false);

    try {
      const res = await fetch(`/api/link/${initialLink.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template,
          design_config: designConfig,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setSaveError(data.error || "Ошибка сохранения");
      } else {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    } catch {
      setSaveError("Сбой сети при сохранении");
    } finally {
      setIsSaving(false);
    }
  };

  // Live updated link object for the preview component
  const liveLink: SmartLinkData = {
    ...initialLink,
    template,
    design_config: designConfig,
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-80px)] border-t border-white/10 select-none">
      {/* ===================================================================
          LEFT COLUMN: SETTINGS PANEL
          =================================================================== */}
      <div className="w-full lg:w-[420px] bg-[#090611] border-r border-white/10 flex flex-col justify-between flex-shrink-0">
        <div>
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link
                href={`/dashboard/links/${initialLink.id}/edit`}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#D9D9E2] transition"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <h2 className="font-heavy text-base uppercase tracking-tight text-white">
                  Page Builder
                </h2>
                <p className="font-mono text-[10px] text-[#B46BFF] truncate max-w-[200px]">
                  {initialLink.title}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveDesign}
                disabled={isSaving}
                className="btn-energy px-4 py-1.5 rounded-full font-mono text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 shadow-[0_0_15px_rgba(135,55,255,0.4)] disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? "Сохранение..." : "Сохранить"}</span>
              </button>
            </div>
          </div>

          {saveSuccess && (
            <div className="p-2.5 mx-4 mt-3 rounded-xl border border-[#00F0FF]/40 bg-[#00F0FF]/10 text-[11px] text-white flex items-center gap-2 font-mono">
              <Check className="w-3.5 h-3.5 text-[#00F0FF]" />
              <span>Оформление успешно опубликовано!</span>
            </div>
          )}

          {/* Builder Sub-Tabs */}
          <div className="grid grid-cols-4 p-2 gap-1 border-b border-white/10 font-mono text-[10px] uppercase tracking-wider text-center">
            <button
              onClick={() => setActiveTab("presets")}
              className={`py-2 rounded-lg transition ${
                activeTab === "presets" ? "bg-white/15 text-white font-bold" : "text-white/50 hover:text-white"
              }`}
            >
              Шаблоны
            </button>
            <button
              onClick={() => setActiveTab("colors")}
              className={`py-2 rounded-lg transition ${
                activeTab === "colors" ? "bg-white/15 text-white font-bold" : "text-white/50 hover:text-white"
              }`}
            >
              Цвета
            </button>
            <button
              onClick={() => setActiveTab("layout")}
              className={`py-2 rounded-lg transition ${
                activeTab === "layout" ? "bg-white/15 text-white font-bold" : "text-white/50 hover:text-white"
              }`}
            >
              Стили
            </button>
            <button
              onClick={() => setActiveTab("blocks")}
              className={`py-2 rounded-lg transition ${
                activeTab === "blocks" ? "bg-white/15 text-white font-bold" : "text-white/50 hover:text-white"
              }`}
            >
              Блоки
            </button>
          </div>

          {/* Panel Content based on Active Tab */}
          <div className="p-5 space-y-6 max-h-[calc(100vh-230px)] overflow-y-auto">
            {/* TAB 1: PRESETS */}
            {activeTab === "presets" && (
              <div className="space-y-4">
                <p className="font-mono text-xs uppercase tracking-wider text-[#D9D9E2]/70">
                  Готовые визуальные концепции:
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {(Object.keys(TEMPLATE_PRESETS) as Array<keyof typeof TEMPLATE_PRESETS>).map((key) => (
                    <button
                      key={key}
                      onClick={() => handleApplyPreset(key)}
                      className={`p-3.5 rounded-2xl border text-left space-y-1 transition ${
                        template === key
                          ? "border-[#B46BFF] bg-[#8737FF]/20 shadow-[0_0_15px_rgba(135,55,255,0.3)]"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-heavy text-sm uppercase text-white">{key}</span>
                        {template === key && <Check className="w-3.5 h-3.5 text-[#00F0FF]" />}
                      </div>
                      <p className="text-[10px] text-[#D9D9E2]/60 line-clamp-2">
                        {key === "CYBER" && "Неон, фирменный фиолетовый акцент"}
                        {key === "CINEMATIC" && "Глубокий виньетинг и сильное размытие"}
                        {key === "MINIMAL" && "Чистая монохромная классика"}
                        {key === "BRUTAL" && "Контрастные резкие углы и границы"}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: COLORS */}
            {activeTab === "colors" && (
              <div className="space-y-5">
                <div>
                  <label className="font-mono text-xs uppercase tracking-wider text-[#D9D9E2]/70 block mb-2">
                    Акцентный цвет:
                  </label>
                  <div className="flex items-center gap-2">
                    {[
                      { label: "Violet", color: "#8737FF" },
                      { label: "Neon", color: "#B46BFF" },
                      { label: "Cyan", color: "#00F0FF" },
                      { label: "Pink", color: "#FF2E93" },
                      { label: "White", color: "#FFFFFF" },
                    ].map((c) => (
                      <button
                        key={c.color}
                        onClick={() => updateConfig("accent_color", c.color)}
                        style={{ backgroundColor: c.color }}
                        className={`w-8 h-8 rounded-full border-2 transition ${
                          designConfig.accent_color === c.color ? "border-white scale-110 shadow-lg" : "border-transparent"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-mono text-xs uppercase tracking-wider text-[#D9D9E2]/70 block mb-2">
                    Размытие фона (Cover Blur): {designConfig.cover_blur || 64}px
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={designConfig.cover_blur || 64}
                    onChange={(e) => updateConfig("cover_blur", Number(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#B46BFF]"
                  />
                </div>
              </div>
            )}

            {/* TAB 3: STYLES */}
            {activeTab === "layout" && (
              <div className="space-y-5">
                <div>
                  <label className="font-mono text-xs uppercase tracking-wider text-[#D9D9E2]/70 block mb-2">
                    Скругление кнопок:
                  </label>
                  <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                    {["none", "lg", "full"].map((rad) => (
                      <button
                        key={rad}
                        onClick={() => updateConfig("button_radius", rad)}
                        className={`py-2 rounded-xl border uppercase tracking-wider transition ${
                          designConfig.button_radius === rad
                            ? "border-[#B46BFF] bg-[#8737FF]/20 text-white"
                            : "border-white/10 text-white/60 hover:text-white"
                        }`}
                      >
                        {rad === "none" && "Прямые"}
                        {rad === "lg" && "Скруглённые"}
                        {rad === "full" && "Pill"}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-mono text-xs uppercase tracking-wider text-[#D9D9E2]/70 block mb-2">
                    Шрифт страницы:
                  </label>
                  <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                    {["sans", "mono"].map((font) => (
                      <button
                        key={font}
                        onClick={() => updateConfig("font_family", font)}
                        className={`py-2 rounded-xl border uppercase tracking-wider transition ${
                          designConfig.font_family === font
                            ? "border-[#B46BFF] bg-[#8737FF]/20 text-white"
                            : "border-white/10 text-white/60 hover:text-white"
                        }`}
                      >
                        {font === "sans" ? "Sans Grotesque" : "Monospace Tech"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: BLOCKS VISIBILITY */}
            {activeTab === "blocks" && (
              <div className="space-y-3">
                <p className="font-mono text-xs uppercase tracking-wider text-[#D9D9E2]/70 mb-2">
                  Отображение секций:
                </p>

                <label className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/5 cursor-pointer">
                  <span className="font-mono text-xs uppercase text-white">Таймер обратного отсчета</span>
                  <input
                    type="checkbox"
                    checked={designConfig.show_countdown !== false}
                    onChange={(e) => updateConfig("show_countdown", e.target.checked)}
                    className="accent-[#8737FF] w-4 h-4 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/5 cursor-pointer">
                  <span className="font-mono text-xs uppercase text-white">Аудио-превью плеер</span>
                  <input
                    type="checkbox"
                    checked={designConfig.show_audio_preview !== false}
                    onChange={(e) => updateConfig("show_audio_preview", e.target.checked)}
                    className="accent-[#8737FF] w-4 h-4 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/5 cursor-pointer">
                  <span className="font-mono text-xs uppercase text-white">Социальные сети</span>
                  <input
                    type="checkbox"
                    checked={designConfig.show_socials !== false}
                    onChange={(e) => updateConfig("show_socials", e.target.checked)}
                    className="accent-[#8737FF] w-4 h-4 rounded"
                  />
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Footer Actions */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between">
          <button
            onClick={() => handleApplyPreset("CYBER")}
            className="text-xs font-mono uppercase text-[#D9D9E2]/60 hover:text-white flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Сбросить стиль</span>
          </button>

          <a
            href={`/link/${initialLink.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono uppercase text-[#B46BFF] hover:text-white flex items-center gap-1.5"
          >
            <span>В новой вкладке</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* ===================================================================
          RIGHT COLUMN: LIVE PREVIEW CANVAS
          =================================================================== */}
      <div className="flex-1 bg-[#050407] flex flex-col justify-between items-center p-4 sm:p-8 relative overflow-hidden">
        {/* Viewport Mode Switcher */}
        <div className="relative z-20 flex items-center gap-2 p-1.5 rounded-full bg-[#090611]/90 border border-white/15 backdrop-blur-md mb-4 shadow-xl">
          <button
            onClick={() => setPreviewMode("mobile")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-mono text-xs uppercase tracking-wider transition ${
              previewMode === "mobile" ? "bg-[#8737FF] text-white shadow-md font-bold" : "text-[#D9D9E2]/70 hover:text-white"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile</span>
          </button>

          <button
            onClick={() => setPreviewMode("desktop")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-mono text-xs uppercase tracking-wider transition ${
              previewMode === "desktop" ? "bg-[#8737FF] text-white shadow-md font-bold" : "text-[#D9D9E2]/70 hover:text-white"
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop</span>
          </button>
        </div>

        {/* The Live Simulated Frame */}
        <div
          className={`relative transition-all duration-300 overflow-y-auto rounded-3xl border border-white/20 shadow-[0_20px_80px_rgba(0,0,0,0.9)] bg-[#050407] ${
            previewMode === "mobile"
              ? "w-[380px] h-[780px] max-h-[85vh] ring-8 ring-black/80"
              : "w-full max-w-4xl h-[85vh]"
          }`}
        >
          <PublicSmartLink link={liveLink} platforms={initialPlatforms} />
        </div>
      </div>
    </div>
  );
}
