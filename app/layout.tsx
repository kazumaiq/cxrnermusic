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
  themeColor: "#08040f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "CXRNER MUSIC 2.0 — Международный музыкальный лейбл & дистрибуция",
    template: "%s — CXRNER MUSIC",
  },
  description:
    "CXRNER MUSIC — международный независимый музыкальный лейбл и цифровая дистрибуция. Релизы на 150+ стриминговых платформах, промо-питчинг редакторам, прозрачные роялти 70/30 и защита авторских прав.",
  keywords: [
    "CXRNER MUSIC",
    "музыкальный лейбл",
    "дистрибуция музыки",
    "выпустить трек",
    "питчинг плейлистов",
    "музыкальное промо",
    "phonk",
    "hip-hop",
    "electronic",
    "роялти",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "CXRNER MUSIC 2.0 — Музыкальный лейбл нового поколения",
    description: "Глобальная дистрибуция, сильный арт-дирекшн и монетизация для артистов нового звучания.",
    type: "website",
    url: SITE_URL,
    siteName: "CXRNER MUSIC",
    locale: "ru_RU",
    images: [{ url: "/images/og.svg", width: 1200, height: 630, alt: "CXRNER MUSIC" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "CXRNER MUSIC 2.0 — Музыкальный лейбл",
    description: "Глобальная дистрибуция и развитие артистов.",
    images: ["/images/og.svg"],
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
  email: "cxrner.label@gmail.com",
  sameAs: ["https://t.me/kazumaiq", "https://t.me/moder_cxrner_bot"],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className="dark scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Exo+2:ital,wght@0,300..900;1,300..900&family=Orbitron:wght@500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&family=Syne:wght@700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-night font-body text-white antialiased selection:bg-neon/30 selection:text-white">
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
