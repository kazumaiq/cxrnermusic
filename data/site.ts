export type FaqItem = {
  question: string;
  answer: string;
  bullets?: string[];
  links?: { label: string; href: string }[];
};

export const stats = [
  { label: "Стримов", value: 240, suffix: "M+" },
  { label: "Артистов", value: 86, suffix: "+" },
  { label: "Релизов", value: 420, suffix: "+" },
  { label: "Стран", value: 64, suffix: "+" },
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

export const artists = [
  {
    name: "KAZUMAI",
    genre: "Future Bass",
    streams: "68M",
    avatar: "/images/artist-01.svg",
  },
  {
    name: "LUXEVOID",
    genre: "Synthwave",
    streams: "54M",
    avatar: "/images/artist-02.svg",
  },
  {
    name: "SYNTHR",
    genre: "Electro Pop",
    streams: "43M",
    avatar: "/images/artist-03.svg",
  },
  {
    name: "NEOFOX",
    genre: "Hyperpop",
    streams: "39M",
    avatar: "/images/artist-04.svg",
  },
  {
    name: "VOIDRAY",
    genre: "Dark EDM",
    streams: "29M",
    avatar: "/images/artist-05.svg",
  },
  {
    name: "NIRAH",
    genre: "Alt R&B",
    streams: "21M",
    avatar: "/images/artist-06.svg",
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
    answer: "Есть 2 варианта отгрузки релиза:",
    links: [
      { label: "Через Telegram-бот", href: "https://t.me/moder_cxrner_bot" },
      { label: "Через сайт", href: "https://cxrnerlink.ct.ws/login.php" },
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
  {
    question: "CXRNER LINK",
    answer: "Сайт для отгрузки, инструкций и создания мультиссылки по UPC:",
    links: [{ label: "cxrnerlink.ct.ws/login.php", href: "https://cxrnerlink.ct.ws/login.php" }],
  },
];
