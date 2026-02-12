export type FaqItem = {
  question: string;
  answer: string;
  bullets?: string[];
  links?: { label: string; href: string }[];
};

export type StatItem = {
  label: string;
  value: number;
  suffix?: string;
  display?: string;
};

export const stats: StatItem[] = [
  { label: "Стримов", value: 900, suffix: "к+" },
  { label: "Артистов", value: 280, suffix: "+" },
  { label: "Релизов", value: 350 },
  { label: "Стран мира", value: 256 },
];

export const releases = [
  {
    title: "Neon Drift",
    artist: "KAZUMAI",
    cover: "/images/album-01.svg",
    links: [
      { label: "Spotify", href: "https://open.spotify.com" },
      { label: "Apple Music", href: "https://music.apple.com" },
      { label: "Yandex Music", href: "https://music.yandex.ru" },
    ],
  },
  {
    title: "Midnight Pulse",
    artist: "LUXEVOID",
    cover: "/images/album-02.svg",
    links: [
      { label: "Spotify", href: "https://open.spotify.com" },
      { label: "Apple Music", href: "https://music.apple.com" },
      { label: "VK Music", href: "https://vk.com/music" },
    ],
  },
  {
    title: "Crystal Echo",
    artist: "SYNTHR",
    cover: "/images/album-03.svg",
    links: [
      { label: "Spotify", href: "https://open.spotify.com" },
      { label: "Apple Music", href: "https://music.apple.com" },
      { label: "Deezer", href: "https://www.deezer.com" },
    ],
  },
  {
    title: "Velocity",
    artist: "NEOFOX",
    cover: "/images/album-04.svg",
    links: [
      { label: "Spotify", href: "https://open.spotify.com" },
      { label: "Apple Music", href: "https://music.apple.com" },
      { label: "Tidal", href: "https://tidal.com" },
    ],
  },
  {
    title: "Signal Bloom",
    artist: "VOIDRAY",
    cover: "/images/album-05.svg",
    links: [
      { label: "Spotify", href: "https://open.spotify.com" },
      { label: "Apple Music", href: "https://music.apple.com" },
      { label: "YouTube Music", href: "https://music.youtube.com" },
    ],
  },
  {
    title: "Aurora Tape",
    artist: "NIRAH",
    cover: "/images/album-06.svg",
    links: [
      { label: "Spotify", href: "https://open.spotify.com" },
      { label: "Apple Music", href: "https://music.apple.com" },
      { label: "Amazon Music", href: "https://music.amazon.com" },
    ],
  },
];

export const services = [
  {
    title: "Дистрибуция",
    description: "Мировой релиз на всех ключевых DSP и региональных платформах.",
  },
  {
    title: "Питчинг плейлистов",
    description: "Редакционный и независимый плейлистинг с фокусом на рост.",
  },
  {
    title: "Маркетинг",
    description: "Стратегия продвижения, таргет и контент-поддержка релиза.",
  },
  {
    title: "Обложки",
    description: "Футуристичный арт-дирекшн и дизайн под эстетику артиста.",
  },
  {
    title: "Content ID",
    description: "Монетизация UGC-контента и защита авторских прав.",
  },
  {
    title: "Монетизация TikTok",
    description: "Постановка треков в библиотеку TikTok и Shorts.",
  },
];

export type LabelArtist = {
  name: string;
  listeners: string;
  avatar: string;
};

export const artists: LabelArtist[] = [
  {
    name: "Balekajon",
    listeners: "259 760",
    avatar: "/artist/balekajon.png",
  },
  {
    name: "Cerrera D'Ark",
    listeners: "77 254",
    avatar: "/artist/cerrera-dark.png",
  },
  {
    name: "Hxlkart",
    listeners: "191 340",
    avatar: "/artist/hxlkart.png",
  },
  {
    name: "MC LONE",
    listeners: "348 861",
    avatar: "/artist/mc-lone.png",
  },
  {
    name: "MVRTX",
    listeners: "389 622",
    avatar: "/artist/mvrtx.png",
  },
  {
    name: "STAROX",
    listeners: "139 396",
    avatar: "/artist/starox.png",
  },
  {
    name: "TendyOne",
    listeners: "257 991",
    avatar: "/artist/tendyone.png",
  },
];

export type Testimonial = {
  name: string;
  quote: string;
  avatar: string;
};

export const testimonials: Testimonial[] = [
  {
    name: "FOXMxHNAxm",
    quote:
      "Лейбл довольно хороший, модераторов руки целовал — любовь к этому лейблу безгранична. Модерация проходит очень быстро, и главное, что тебя уведомляют — это прекрасно.",
    avatar: "/testimonials/foxmxhnaxm.svg",
  },
  {
    name: "PhonkNeo",
    quote:
      "Очень легко выпускать и работать с этим лейблом, CXRNER MUSIC лучший.",
    avatar: "/testimonials/phonkneo.svg",
  },
  {
    name: "Cerrera D'Ark",
    quote:
      "Нормальный лейбл, терпеливые и вежливые менеджеры, грузят быстро и своевременно, без нервов и мозгов. Меня пока что всё устраивает.",
    avatar: "/testimonials/cerrera-dark.svg",
  },
  {
    name: "RxyxnOr",
    quote:
      "CXRNER MUSIC это самый отличный, нет, ах#енный лейбл с хорошим админ составом, с хорошей поддержкой артистов. Особенно это быстрая и качественная работа. Так же в лейбле много музыкантов, которые помогут вам с той или этой проблемой. Минусов нет, так как их тут быть не может.",
    avatar: "/testimonials/rxyxnor.svg",
  },
];

export const faqItems: FaqItem[] = [
  {
    question: "Какой процент роялти?",
    answer: "Работаем по системе 70/30 в пользу артиста.",
  },
  {
    question: "С какими жанрами вы работаете?",
    answer: "Работаем с артистами всех жанров.",
  },
  {
    question: "Если я уже состою в другом лейбле?",
    answer: "Это не проблема. Наш контракт не запрещает выпускать треки через другие лейблы.",
  },
  {
    question: "Как выложить трек через CXRNER MUSIC?",
    answer: "Есть вариант отгрузки релиза:",
    links: [
      { label: "Через Telegram-бот", href: "https://t.me/moder_cxrner_bot" },
    ],
  },
  {
    question: "Сколько длится модерация и отгрузка?",
    answer: "Модерация обычных релизов — до 3 дней. Отгрузка релиза — от 12 часов.",
  },
  {
    question: "За сколько дней нужно отправлять релиз?",
    answer:
      "Минимум за 3 дня до даты выхода. Для промо рекомендуется планировать релиз за 3–4 недели.",
  },
  {
    question: "Требования к отгрузке",
    answer: "Перед отправкой убедитесь, что:",
    bullets: [
      "трек полностью завершён",
      "обязателен скриншот проекта (DAW)",
      "корректно заполненная анкета",
    ],
  },
  {
    question: "Есть ли промо-поддержка?",
    answer:
      "Да, бесплатная промо-поддержка предоставляется при соблюдении условий. Если трек им не соответствует, он не попадает под бесплатное промо.",
    bullets: [
      "релиз запланирован минимум за 3–4 недели",
      "качественная обложка",
      "высокий уровень звучания трека",
    ],
  },
  {
    question: "Куда отправляется промо?",
    answer:
      "Промо отправляется на каждую площадку отдельно, напрямую редакторам VK Music, Яндекс Музыки, Звука и других сервисов.",
  },
  {
    question: "Дополнительные возможности",
    answer: "Расширенные опции для артистов:",
    bullets: [
      "просмотр статистики по трекам",
      "усиленное промо",
      "редактирование релизов",
      "отправка треков в YouTube для получения нотки",
      "изменение карточек артистов",
    ],
  },
  {
    question: "YouTube и TikTok",
    answer:
      "Помогаем с Official Artist Channel на YouTube и верификацией в TikTok. По всем вопросам писать: @kazumaiq.",
  },
  {
    question: "Даты квартальных выплат роялти",
    answer: "Выплаты происходят по квартальному графику:",
    bullets: [
      "15 марта — за осень",
      "15 июня — за зиму",
      "15 сентября — за весну",
      "15 декабря — за лето",
    ],
  },
  {
    question: "Личный кабинет артиста",
    answer:
      "Для создания личного кабинета в формате групп нужно написать @kazumaiq.",
  },
];
