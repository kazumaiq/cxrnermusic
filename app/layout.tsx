import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import { Inter, Oswald, Bebas_Neue, Space_Mono, Unbounded } from "next/font/google";
import "./globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Providers from "./providers";
import BackgroundFX from "../components/BackgroundFX";

const SITE_URL = "https://cxrnermusic.vercel.app";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-inter",
});

const oswald = Oswald({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-oswald",
});

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-bebas",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

const unbounded = Unbounded({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-unbounded",
});

export const viewport: Viewport = {
  themeColor: "#020204",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "CXRNER MUSIC — Independent Underground Record Label",
    template: "%s — CXRNER MUSIC",
  },
  description:
    "CXRNER MUSIC — независимый андеграундный лейбл и глобальная цифровая дистрибуция. Релизы на 150+ стриминговых платформах, жесткий визуальный арт-дирекшн и монетизация.",
  keywords: [
    "CXRNER MUSIC",
    "музыкальный лейбл",
    "дистрибуция",
    "underground",
    "phonk",
    "electronic",
    "industrial",
    "выпустить трек",
  ],
  icons: {
    icon: [
      { url: "/logo.png", sizes: "any" },
      { url: "/icon.png", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/logo.png"],
  },
  alternates: { canonical: "/" },
  openGraph: {
    title: "CXRNER MUSIC — Independent Underground Record Label",
    description: "Глобальная цифровая дистрибуция, бескомпромиссный арт-дирекшн и развитие независимых артистов.",
    type: "website",
    url: SITE_URL,
    siteName: "CXRNER MUSIC",
    locale: "ru_RU",
    images: [{ url: "/logo.png", width: 1024, height: 1024, alt: "CXRNER MUSIC" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "CXRNER MUSIC — Underground Record Label",
    description: "Глобальная дистрибуция и развитие артистов.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "MusicLabel",
  name: "CXRNER MUSIC",
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  image: `${SITE_URL}/logo.png`,
  description:
    "CXRNER MUSIC — независимый андеграундный лейбл и глобальная цифровая дистрибуция. Релизы на 150+ стриминговых платформах, жесткий визуальный арт-дирекшн и монетизация.",
  email: "cxrner.label@gmail.com",
  sameAs: ["https://t.me/kazumaiq", "https://t.me/moder_cxrner_bot", "https://music.yandex.ru/label/5978511"],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="ru"
      className={`dark scroll-smooth bg-[#020204] ${inter.variable} ${oswald.variable} ${bebasNeue.variable} ${spaceMono.variable} ${unbounded.variable}`}
    >
      <body className="min-h-screen bg-transparent text-[#EAEAEA] antialiased selection:bg-white selection:text-black">
        {/* Fullscreen 3D Starfield at Document Root */}
        <BackgroundFX />

        <Script
          id="json-ld-org"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <div className="relative min-h-screen flex flex-col justify-between overflow-x-hidden">
          <Header />
          <Providers>
            <main className="flex-1">{children}</main>
          </Providers>
          <Footer />
        </div>
      </body>
    </html>
  );
}
