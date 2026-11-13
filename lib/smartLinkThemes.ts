export type SmartLinkTemplateId =
  | "CYBER"
  | "CINEMATIC"
  | "AUTUMN"
  | "WINTER"
  | "MINIMAL"
  | "SAKURA"
  | "BRUTAL";

export interface SmartLinkThemeSpec {
  id: SmartLinkTemplateId;
  name: string;
  vibeTag: string;
  desc: string;
  accentHex: string;
  secondaryHex: string;
  previewGradient: string;
  swatchColors: [string, string, string];
  backdropOverlayClass: string;
  backdropBlurOpacity: string;
  cardClass: string;
  coverFrameClass: string;
  titleClass: string;
  artistClass: string;
  buttonClass: string;
  actionPillClass: string;
  countdownCardClass: string;
  presaveBtnClass: string;
  mockupBgClass: string;
  mockupButtonClass: string;
}

export const SMART_LINK_THEMES: SmartLinkThemeSpec[] = [
  {
    id: "CYBER",
    name: "STMPD // CYBER NEON",
    vibeTag: "NEON AURORA · GLOW",
    desc: "Эстетика Martin Garrix и STMPD RCRDS: парящие неоновые сферы, кибер-сетка и стеклянные кнопки с фиолетово-бирюзовым свечением.",
    accentHex: "#8737FF",
    secondaryHex: "#00F0FF",
    previewGradient: "from-[#1a0b38] via-[#090612] to-[#040308]",
    swatchColors: ["#8737FF", "#00F0FF", "#090612"],
    backdropOverlayClass:
      "bg-gradient-to-b from-[#0f0624]/70 via-[#06030d]/90 to-[#040208]",
    backdropBlurOpacity: "opacity-35",
    cardClass:
      "border border-[#8737FF]/35 bg-[#0a0614]/75 backdrop-blur-2xl shadow-[0_0_90px_rgba(135,55,255,0.28)]",
    coverFrameClass:
      "rounded-2xl border border-[#00F0FF]/25 shadow-[0_14px_40px_rgba(135,55,255,0.35)]",
    titleClass: "font-heavy tracking-tight text-white uppercase",
    artistClass: "font-mono text-[#D9D9E2]/90 tracking-[0.18em] uppercase",
    buttonClass:
      "rounded-2xl border border-white/10 bg-[#0d071a]/80 hover:bg-[#190c32]/90 hover:border-[#00F0FF]/55 hover:shadow-[0_0_24px_rgba(0,240,255,0.18)]",
    actionPillClass:
      "bg-white/10 text-[#00F0FF] group-hover:bg-[#8737FF] group-hover:text-white",
    countdownCardClass: "border-[#8737FF]/35 bg-[#8737FF]/10",
    presaveBtnClass:
      "bg-gradient-to-r from-[#8737FF] to-[#5B21B6] hover:from-[#9D5CFF] hover:to-[#7C3AED] text-white shadow-[0_0_25px_rgba(135,55,255,0.45)]",
    mockupBgClass: "bg-gradient-to-b from-[#170933] via-[#0b0617] to-[#05030a]",
    mockupButtonClass:
      "rounded-xl bg-[#8737FF]/15 border border-[#8737FF]/45 text-white shadow-[0_0_10px_rgba(135,55,255,0.15)]",
  },
  {
    id: "CINEMATIC",
    name: "NARVENT // ATMOSPHERE",
    vibeTag: "FULL-BLEED BLUR · DUST",
    desc: "Кинематографичный вайб Narvent: глубокое дышащее размытие обложки на весь экран, парящие частицы света и матовое стекло.",
    accentHex: "#C084FC",
    secondaryHex: "#E9D5FF",
    previewGradient: "from-[#22103f] via-[#0c0716] to-[#050309]",
    swatchColors: ["#C084FC", "#3B0764", "#090512"],
    backdropOverlayClass:
      "bg-gradient-to-b from-black/45 via-[#07050c]/80 to-[#040307]",
    backdropBlurOpacity: "opacity-55",
    cardClass:
      "border border-white/15 bg-black/45 backdrop-blur-3xl shadow-[0_24px_90px_rgba(0,0,0,0.85)]",
    coverFrameClass:
      "rounded-2xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.75)]",
    titleClass: "font-heavy tracking-tight text-white",
    artistClass: "font-sans font-medium text-white/80 tracking-wide",
    buttonClass:
      "rounded-2xl border border-white/15 bg-white/[0.06] hover:bg-white/[0.14] hover:border-white/35 backdrop-blur-xl",
    actionPillClass:
      "bg-white/15 text-white group-hover:bg-white group-hover:text-black",
    countdownCardClass: "border-white/20 bg-white/[0.06]",
    presaveBtnClass:
      "bg-white text-black hover:bg-white/90 shadow-[0_0_25px_rgba(255,255,255,0.25)]",
    mockupBgClass: "bg-[#0c0714]",
    mockupButtonClass:
      "rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white",
  },
  {
    id: "AUTUMN",
    name: "AUTUMN // GOLDEN NOSTALGIA",
    vibeTag: "WARM AMBER · FALLING LEAVES",
    desc: "Тёплый осенний вайб: янтарно-медное сияние, плавно падающие осенние листья на фоне, журнальная типографика и тёплое стекло.",
    accentHex: "#F59E0B",
    secondaryHex: "#EA580C",
    previewGradient: "from-[#3b1c0a] via-[#1c0c06] to-[#0c0503]",
    swatchColors: ["#F59E0B", "#EA580C", "#291208"],
    backdropOverlayClass:
      "bg-gradient-to-b from-[#2b1206]/65 via-[#170904]/88 to-[#0b0402]",
    backdropBlurOpacity: "opacity-40",
    cardClass:
      "border border-amber-400/25 bg-[#190b05]/75 backdrop-blur-2xl shadow-[0_20px_80px_rgba(234,88,12,0.22)]",
    coverFrameClass:
      "rounded-2xl border border-amber-300/30 shadow-[0_14px_40px_rgba(245,158,11,0.25)]",
    titleClass: "font-serif tracking-normal text-amber-50 font-bold",
    artistClass: "font-sans text-amber-200/80 tracking-[0.14em] uppercase",
    buttonClass:
      "rounded-2xl border border-amber-400/20 bg-[#2a1308]/75 hover:bg-[#3f1c0b]/90 hover:border-amber-400/55 hover:shadow-[0_0_20px_rgba(245,158,11,0.18)]",
    actionPillClass:
      "bg-amber-500/15 text-amber-300 group-hover:bg-amber-500 group-hover:text-black",
    countdownCardClass: "border-amber-400/30 bg-amber-500/10",
    presaveBtnClass:
      "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-bold shadow-[0_0_24px_rgba(245,158,11,0.35)]",
    mockupBgClass: "bg-gradient-to-b from-[#331608] via-[#1b0b04] to-[#0c0502]",
    mockupButtonClass:
      "rounded-xl bg-amber-500/10 border border-amber-400/30 text-amber-50",
  },
  {
    id: "WINTER",
    name: "WINTER // FROST AURORA",
    vibeTag: "ICE CRYSTAL · SNOWFALL",
    desc: "Зимняя атмосфера: арктическое северное сияние, плавный снегопад на фоне, кристаллическое ледяное стекло и холодный сапфировый блеск.",
    accentHex: "#38BDF8",
    secondaryHex: "#BAE6FD",
    previewGradient: "from-[#0c2742] via-[#071424] to-[#030812]",
    swatchColors: ["#38BDF8", "#E0F2FE", "#07172b"],
    backdropOverlayClass:
      "bg-gradient-to-b from-[#0b233b]/65 via-[#061322]/88 to-[#030912]",
    backdropBlurOpacity: "opacity-35",
    cardClass:
      "border border-sky-200/25 bg-[#081728]/70 backdrop-blur-2xl shadow-[0_20px_80px_rgba(56,189,248,0.2)]",
    coverFrameClass:
      "rounded-2xl border border-sky-200/35 shadow-[0_14px_45px_rgba(125,211,252,0.25)]",
    titleClass: "font-heavy tracking-tight text-sky-50",
    artistClass: "font-mono text-sky-200/80 tracking-[0.2em] uppercase",
    buttonClass:
      "rounded-2xl border border-sky-200/15 bg-sky-950/50 hover:bg-sky-900/60 hover:border-sky-300/50 hover:shadow-[0_0_22px_rgba(56,189,248,0.2)]",
    actionPillClass:
      "bg-sky-400/15 text-sky-200 group-hover:bg-sky-300 group-hover:text-slate-950",
    countdownCardClass: "border-sky-300/30 bg-sky-400/10",
    presaveBtnClass:
      "bg-gradient-to-r from-sky-400 to-cyan-300 hover:from-sky-300 hover:to-cyan-200 text-slate-950 font-bold shadow-[0_0_24px_rgba(56,189,248,0.35)]",
    mockupBgClass: "bg-gradient-to-b from-[#0e2a47] via-[#071526] to-[#030913]",
    mockupButtonClass:
      "rounded-xl bg-sky-300/10 border border-sky-200/25 text-sky-50",
  },
  {
    id: "MINIMAL",
    name: "SWISS // STRICT EDITORIAL",
    vibeTag: "OBSIDIAN · HI-FI GRID",
    desc: "Строгий премиальный минимализм уровня Apple & Teenage Engineering: угольный обсидиан, 1px рамки, чистая типографика и тонкий световой блик.",
    accentHex: "#FFFFFF",
    secondaryHex: "#A1A1AA",
    previewGradient: "from-[#18181b] via-[#09090b] to-[#000000]",
    swatchColors: ["#FFFFFF", "#52525B", "#09090B"],
    backdropOverlayClass:
      "bg-gradient-to-b from-[#09090b]/85 via-[#060608]/95 to-[#000000]",
    backdropBlurOpacity: "opacity-20",
    cardClass:
      "border border-white/15 bg-[#09090b]/92 backdrop-blur-xl shadow-[0_25px_70px_rgba(0,0,0,0.95)]",
    coverFrameClass:
      "rounded-xl border border-white/15 shadow-[0_12px_35px_rgba(0,0,0,0.8)]",
    titleClass: "font-sans font-extrabold tracking-tight text-white",
    artistClass: "font-mono text-zinc-400 tracking-[0.22em] uppercase",
    buttonClass:
      "rounded-xl border border-white/12 bg-zinc-900/70 hover:bg-zinc-800/90 hover:border-white/40",
    actionPillClass:
      "bg-white/10 text-zinc-200 group-hover:bg-white group-hover:text-black",
    countdownCardClass: "border-white/15 bg-white/[0.03]",
    presaveBtnClass: "bg-white hover:bg-zinc-200 text-black font-bold",
    mockupBgClass: "bg-[#09090b]",
    mockupButtonClass:
      "rounded-lg bg-zinc-900/90 border border-white/20 text-white",
  },
  {
    id: "SAKURA",
    name: "TOKYO // NIGHT LO-FI",
    vibeTag: "VIOLET DUSK · PETALS",
    desc: "Атмосфера ночного Токио и Lo-Fi битов: сливово-индиго градиент, мягкий розовый неон и плавно кружащиеся лепестки сакуры.",
    accentHex: "#F472B6",
    secondaryHex: "#A78BFA",
    previewGradient: "from-[#2d1035] via-[#13071d] to-[#07030c]",
    swatchColors: ["#F472B6", "#A78BFA", "#180824"],
    backdropOverlayClass:
      "bg-gradient-to-b from-[#240b2e]/65 via-[#12061b]/88 to-[#08030d]",
    backdropBlurOpacity: "opacity-40",
    cardClass:
      "border border-pink-300/25 bg-[#150820]/75 backdrop-blur-2xl shadow-[0_20px_80px_rgba(244,114,182,0.22)]",
    coverFrameClass:
      "rounded-2xl border border-pink-300/30 shadow-[0_14px_40px_rgba(244,114,182,0.28)]",
    titleClass: "font-heavy tracking-tight text-pink-50",
    artistClass: "font-mono text-pink-200/85 tracking-[0.16em] uppercase",
    buttonClass:
      "rounded-2xl border border-pink-300/15 bg-[#210d30]/75 hover:bg-[#311347]/90 hover:border-pink-400/50 hover:shadow-[0_0_22px_rgba(244,114,182,0.2)]",
    actionPillClass:
      "bg-pink-400/15 text-pink-200 group-hover:bg-pink-400 group-hover:text-black",
    countdownCardClass: "border-pink-400/30 bg-pink-500/10",
    presaveBtnClass:
      "bg-gradient-to-r from-pink-400 to-purple-500 hover:from-pink-300 hover:to-purple-400 text-white font-bold shadow-[0_0_24px_rgba(244,114,182,0.35)]",
    mockupBgClass: "bg-gradient-to-b from-[#2c0e38] via-[#13061d] to-[#07030b]",
    mockupButtonClass:
      "rounded-xl bg-pink-400/10 border border-pink-300/25 text-pink-50",
  },
  {
    id: "BRUTAL",
    name: "UNDERGROUND // RAVE",
    vibeTag: "INDUSTRIAL · ACID MONOLITH",
    desc: "Энергия подпольных рейв-афиш: монолитные контрастные блоки, кислотно-бирюзовый акцент и жёсткая индустриальная геометрия.",
    accentHex: "#00F0FF",
    secondaryHex: "#FFFFFF",
    previewGradient: "from-[#06282b] via-[#05080a] to-[#000000]",
    swatchColors: ["#00F0FF", "#FFFFFF", "#050505"],
    backdropOverlayClass:
      "bg-gradient-to-b from-[#04181a]/75 via-[#030507]/92 to-[#000000]",
    backdropBlurOpacity: "opacity-25",
    cardClass:
      "border-2 border-white bg-[#050608]/95 shadow-[8px_8px_0px_#00F0FF]",
    coverFrameClass:
      "rounded-none border-2 border-white shadow-[4px_4px_0px_#00F0FF]",
    titleClass: "font-heavy tracking-wider text-white uppercase",
    artistClass: "font-mono text-[#00F0FF] tracking-[0.24em] uppercase font-bold",
    buttonClass:
      "rounded-none border-2 border-white/80 bg-black hover:bg-[#00F0FF]/15 hover:border-[#00F0FF] hover:translate-x-0.5 hover:-translate-y-0.5",
    actionPillClass:
      "bg-white text-black group-hover:bg-[#00F0FF] group-hover:text-black rounded-none",
    countdownCardClass: "border-2 border-[#00F0FF] bg-black rounded-none",
    presaveBtnClass:
      "bg-[#00F0FF] hover:bg-white text-black font-black rounded-none",
    mockupBgClass: "bg-[#050608]",
    mockupButtonClass:
      "rounded-none bg-black border-2 border-white/80 text-white font-bold",
  },
];

export function getSmartLinkTheme(templateId?: string | null): SmartLinkThemeSpec {
  const upper = (templateId || "CYBER").toUpperCase();
  return (
    SMART_LINK_THEMES.find((t) => t.id === upper) || SMART_LINK_THEMES[0]
  );
}
