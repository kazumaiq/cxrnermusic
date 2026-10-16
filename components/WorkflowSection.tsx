import { FileText, Headphones, Globe2, Radio, TrendingUp, CheckCircle2 } from "lucide-react";

const steps = [
  {
    step: "01",
    title: "Подача заявки",
    badge: "2 минуты",
    description:
      "Заполните удобную веб-форму или напишите в Telegram-бот. Укажите название, жанр, ссылки на аудиофайлы (WAV/FLAC) и скриншот проекта DAW.",
    icon: FileText,
    accent: "neon",
  },
  {
    step: "02",
    title: "A&R Модерация",
    badge: "до 3 дней",
    description:
      "Команда оценивает сведение, мастеринг, отсутствие неавторизованных сэмплов и соответствие техническим стандартам стримингов.",
    icon: Headphones,
    accent: "aqua",
  },
  {
    step: "03",
    title: "Мировая отгрузка",
    badge: "150+ DSP",
    description:
      "Присваиваем официальные UPC и ISRC коды. Релиз доставляется в Spotify, Apple Music, VK Музыку, Яндекс, Deezer, TikTok и другие сервисы.",
    icon: Globe2,
    accent: "magenta",
  },
  {
    step: "04",
    title: "Питчинг и промо",
    badge: "Плейлисты",
    description:
      "Питчим треки редакторам ключевых стриминговых площадок. Помогаем попасть в официальные жанровые подборки и плейлисты новинок.",
    icon: Radio,
    accent: "aqua",
  },
  {
    step: "05",
    title: "Выплаты 70/30",
    badge: "Прозрачно",
    description:
      "Честное разделение роялти в пользу артиста. Ежеквартальные прозрачные финансовые отчеты и вывод средств удобным способом.",
    icon: TrendingUp,
    accent: "neon",
  },
];

export default function WorkflowSection() {
  return (
    <div className="relative">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {steps.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.step}
              className="group dark-panel rounded-xl p-5 border border-white/10 hover:border-white/25 transition-all duration-300 flex flex-col justify-between bg-[#0a0a0a]"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs font-bold tracking-widest text-neutral-500 group-hover:text-white transition">
                    [{item.step}]
                  </span>
                  <span className="px-2 py-0.5 rounded font-mono text-[9px] uppercase tracking-wider bg-white/5 border border-white/10 text-neutral-400">
                    {item.badge}
                  </span>
                </div>

                <div className="w-10 h-10 rounded-lg bg-black border border-white/15 flex items-center justify-center mb-4 text-white group-hover:scale-105 group-hover:border-white/30 transition duration-300">
                  <Icon className="w-5 h-5 text-neutral-300 group-hover:text-white" />
                </div>

                <h3 className="font-gothic text-base font-bold text-white mb-2">{item.title}</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">{item.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-neutral-500 group-hover:text-neutral-300 transition">
                <CheckCircle2 className="w-3.5 h-3.5 text-neutral-400" />
                <span>VERIFIED STEP</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
