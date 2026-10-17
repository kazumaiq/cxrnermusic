import { FileText, Headphones, Globe2, Radio, TrendingUp, CheckCircle2 } from "lucide-react";

const steps = [
  {
    step: "01",
    title: "Подача заявки",
    badge: "2 минуты",
    description:
      "Заполните форму на сайте или отправьте трек через Telegram-бота. Укажите название, жанр и ссылку на аудио в высоком качестве (WAV/FLAC).",
    icon: FileText,
  },
  {
    step: "02",
    title: "Модерация",
    badge: "до 3 дней",
    description:
      "Команда оценивает качество сведения, мастеринг, отсутствие неавторизованных сэмплов и соответствие техническим требованиям витрин.",
    icon: Headphones,
  },
  {
    step: "03",
    title: "Отгрузка на 150+ платформ",
    badge: "Мировой охват",
    description:
      "Присваиваем официальные UPC и ISRC коды. Релиз отправляется в Яндекс Музыку, Spotify, Apple Music, VK Музыку, TikTok и другие сервисы.",
    icon: Globe2,
  },
  {
    step: "04",
    title: "Плейлисты и промо",
    badge: "Питчинг",
    description:
      "Питчим треки редакторам площадок. Помогаем попасть в официальные жанровые подборки («Громкие новинки», «Моя волна», плейлисты редакций).",
    icon: Radio,
  },
  {
    step: "05",
    title: "Роялти 70/30",
    badge: "Ежеквартально",
    description:
      "Честное распределение роялти в пользу артиста (70%). Прозрачные финансовые отчеты и вывод средств удобным для вас способом.",
    icon: TrendingUp,
  },
];

export default function WorkflowSection() {
  return (
    <div className="relative">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
        {steps.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.step}
              className="group rounded-2xl p-6 border border-purple-500/20 hover:border-purple-500/45 transition-all duration-300 flex flex-col justify-between bg-[#0c0c18]/70 backdrop-blur-md hover:shadow-[0_0_25px_rgba(168,85,247,0.15)] hover:-translate-y-1"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs font-bold tracking-widest text-purple-400 group-hover:text-purple-300 transition">
                    [{item.step}]
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-wider bg-purple-500/10 border border-purple-500/30 text-purple-300">
                    {item.badge}
                  </span>
                </div>

                <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center mb-4 text-purple-300 group-hover:scale-105 group-hover:bg-purple-600/30 group-hover:text-white transition duration-300 shadow-[0_0_15px_rgba(168,85,247,0.25)]">
                  <Icon className="w-6 h-6 text-purple-400 group-hover:text-purple-300" />
                </div>

                <h3 className="font-gothic text-lg font-bold text-white mb-2 group-hover:text-purple-300 transition">{item.title}</h3>
                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-sans">{item.description}</p>
              </div>

              <div className="mt-5 pt-3.5 border-t border-purple-500/15 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-purple-400 group-hover:text-purple-300 transition">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                <span>Гарантия лейбла</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
