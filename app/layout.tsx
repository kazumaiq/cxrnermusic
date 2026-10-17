import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import "./globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Providers from "./providers";
import BackgroundFX from "../components/BackgroundFX";

const SITE_URL = "https://cxrnermusic.vercel.app";

export const viewport: Viewport = {
  themeColor: "#050505",
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
    <html lang="ru" className="dark scroll-smooth bg-[#020204]">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600;700&family=Oswald:wght@600;700&family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Unbounded:wght@700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-transparent text-[#EAEAEA] antialiased selection:bg-white selection:text-black">
        <Script
          id="json-ld-org"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <div className="relative min-h-screen flex flex-col justify-between overflow-x-hidden">
          <BackgroundFX />
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
