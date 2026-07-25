export type FaqItem = {
  question: string;
  answer: string;
  bullets?: string[];
  links?: { label: string; href: string }[];
};

export type StatItem = { label: string; value: number; suffix?: string; display?: string };

export const stats: StatItem[] = [
  { label: "Стримов", value: 900, suffix: "к+" },
  { label: "Артистов", value: 280, suffix: "+" },
  { label: "Релизов", value: 350 },
  { label: "Стран мира", value: 256 },
];

export type WhyItem = { title: string; description: string };

export const whyUs: WhyItem[] = [
  { title: "Быстрый релиз", description: "Оперативная модерация и отгрузка с контролем каждого этапа." },
  { title: "Поддержка 24/7", description: "Всегда на связи в Telegram и помогаем на каждом шаге." },
  { title: "Плейлисты", description: "Редакционный и жанровый питчинг, чтобы вас услышали." },
  { title: "Прозрачные роялти", description: "Понятная модель 70/30 и прозрачные отчёты по выплатам." },
];

export const releases = [
  { title: "Neon Drift", artist: "KAZUMAI", cover: "/images/album-01.svg", links: [{ label: "Spotify", href: "https://open.spotify.com" }, { label: "Apple Music", href: "https://music.apple.com" }, { label: "Яндекс Музыка", href: "https://music.yandex.ru" }] },
  { title: "Midnight Pulse", artist: "LUXEVOID", cover: "/images/album-02.svg", links: [{ label: "Spotify", href: "https://open.spotify.com" }, { label: "Apple Music", href: "https://music.apple.com" }, { label: "VK Music", href: "https://vk.com/music" }] },
  { title: "Crystal Echo", artist: "SYNTHR", cover: "/images/album-03.svg", links: [{ label: "Spotify", href: "https://open.spotify.com" }, { label: "Apple Music", href: "https://music.apple.com" }, { label: "Deezer", href: "https://www.deezer.com" }] },
  { title: "Velocity", artist: "NEOFOX", cover: "/images/album-04.svg", links: [{ label: "Spotify", href: "https://open.spotify.com" }, { label: "Apple Music", href: "https://music.apple.com" }, { label: "Tidal", href: "https://tidal.com" }] },
  { title: "Signal Bloom", artist: "VOIDRAY", cover: "/images/album-05.svg", links: [{ label: "Spotify", href: "https://open.spotify.com" }, { label: "Apple Music", href: "https://music.apple.com" }, { label: "YouTube Music", href: "https://music.youtube.com" }] },
  { title: "Aurora Tape", artist: "NIRAH", cover: "/images/album-06.svg", links: [{ label: "Spotify", href: "https://open.spotify.com" }, { label: "Apple Music", href: "https://music.apple.com" }, { label: "Amazon Music", href: "https://music.amazon.com" }] },
];

export const services = [
  { title: "Дистрибуция", description: "Мировой релиз на всех ключевых DSP и региональных платформах." },
  { title: "Питчинг плейлистов", description: "Редакционный и независимый плейлистинг с фокусом на рост." },
  { title: "Маркетинг", description: "Стратегия продвижения, таргет и контент-поддержка релиза." },
  { title: "Обложки", description: "Футуристичный арт-дирекшн и дизайн под эстетику артиста." },
  { title: "Content ID", description: "Монетизация UGC-контента и защита авторских прав." },
  { title: "Монетизация TikTok", description: "Постановка треков в библиотеку TikTok и Shorts." },
];

export type LabelArtist = { name: string; listeners: string; avatar: string };
export const artists: LabelArtist[] = [
  { name: "Balekajon", listeners: "259 760", avatar: "/artist/balekajon.png" },
  { name: "Cerrera D'Ark", listeners: "77 254", avatar: "/artist/cerrera-dark.png" },
  { name: "Hxlkart", listeners: "191 340", avatar: "/artist/hxlkart.png" },
  { name: "MC LONE", listeners: "348 861", avatar: "/artist/mc-lone.png" },
  { name: "MVRTX", listeners: "389 622", avatar: "/artist/mvrtx.png" },
  { name: "STAROX", listeners: "139 396", avatar: "/artist/starox.png" },
  { name: "TendyOne", listeners: "257 991", avatar: "/artist/tendyone.png" },
];

export type Testimonial = { name: string; quote: string; avatar: string };
export const testimonials: Testimonial[] = [
  { name: "FOXMxHNAxm", quote: "Лейбл довольно хороший, модерация проходит очень быстро, а главное — тебя всегда держат в курсе. Любовь к этому лейблу безгранична.", avatar: "/testimonials/foxmxhnaxm.svg" },
  { name: "PhonkNeo", quote: "Очень легко выпускать музыку и работать с этим лейблом. CXRNER MUSIC — лучший.", avatar: "/testimonials/phonkneo.svg" },
  { name: "Cerrera D'Ark", quote: "Терпеливые и вежливые менеджеры, всё загружают быстро и своевременно. Меня пока всё устраивает.", avatar: "/testimonials/cerrera-dark.svg" },
  { name: "RxyxnOr", quote: "Отличный лейбл с хорошей поддержкой артистов и быстрой, качественной работой. Минусов не вижу.", avatar: "/testimonials/rxyxnor.svg" },
];

export const faqItems: FaqItem[] = [
  { question: "Какой процент роялти?", answer: "Работаем по системе 70/30 в пользу артиста." },
  { question: "С какими жанрами вы работаете?", answer: "Работаем с артистами всех жанров." },
  { question: "Можно ли выпускаться через другой лейбл?", answer: "Да. Наш контракт не запрещает выпускать треки через другие лейблы." },
  { question: "Как выпустить трек через CXRNER MUSIC?", answer: "Отправьте релиз через Telegram-бота — команда проверит материалы и вернётся с ответом.", links: [{ label: "Открыть Telegram-бота", href: "https://t.me/moder_cxrner_bot" }] },
  { question: "Сколько длится модерация и отгрузка?", answer: "Модерация обычных релизов — до 3 дней. Отгрузка релиза — от 12 часов." },
  { question: "За сколько дней отправлять релиз?", answer: "Минимум за 3 дня до даты выхода. Для промо рекомендуем планировать релиз за 3–4 недели." },
  { question: "Требования к отгрузке", answer: "Перед отправкой убедитесь, что:", bullets: ["трек полностью завершён", "есть скриншот проекта (DAW)", "анкета заполнена корректно"] },
  { question: "Есть ли промо-поддержка?", answer: "Да, бесплатная промо-поддержка предоставляется при соблюдении условий релиза.", bullets: ["релиз запланирован минимум за 3–4 недели", "качественная обложка", "высокий уровень звучания трека"] },
  { question: "Куда отправляется промо?", answer: "Промо отправляется редакторам VK Music, Яндекс Музыки, Звука и других сервисов." },
  { question: "Какие есть дополнительные возможности?", answer: "Для артистов доступны статистика по трекам, усиленное промо, редактирование релизов и оформление карточек." },
  { question: "YouTube и TikTok", answer: "Помогаем с Official Artist Channel на YouTube и верификацией в TikTok. По вопросам пишите @kazumaiq." },
  { question: "Когда выплачиваются роялти?", answer: "Выплаты происходят по квартальному графику: 15 марта, 15 июня, 15 сентября и 15 декабря." },
  { question: "Личный кабинет артиста", answer: "Для создания личного кабинета напишите @kazumaiq." },
];
