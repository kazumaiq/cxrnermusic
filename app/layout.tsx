import type { Metadata } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import { Exo_2, Orbitron } from "next/font/google";
import "./globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Providers from "./providers";
import BackgroundFX from "../components/BackgroundFX";

const SITE_URL = "https://cxrnermusic.vercel.app";

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const exo = Exo_2({
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "CXRNER MUSIC — независимый лейбл и дистрибуция",
    template: "%s — CXRNER MUSIC",
  },
  description:
    "CXRNER MUSIC — независимый музыкальный лейбл и дистрибуция. Релизы, плейлистинг, маркетинг и монетизация для артистов нового звучания.",
  keywords: [
    "CXRNER MUSIC",
    "cxrner",
    "музыкальный лейбл",
    "дистрибуция",
    "релизы",
    "плейлистинг",
    "музыкальный маркетинг",
    "промо",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "CXRNER MUSIC — независимый лейбл и дистрибуция",
    description:
      "Независимый музыкальный лейбл и дистрибуция. Релизы, плейлистинг и маркетинг для артистов.",
    type: "website",
    url: SITE_URL,
    siteName: "CXRNER MUSIC",
    locale: "ru_RU",
    images: [
      {
        url: "/images/og.svg",
        width: 1200,
        height: 630,
        alt: "CXRNER MUSIC",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CXRNER MUSIC — независимый лейбл и дистрибуция",
    description:
      "Независимый музыкальный лейбл и дистрибуция. Релизы, плейлистинг и маркетинг для артистов.",
    images: ["/images/og.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "CXRNER MUSIC",
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  email: "cxrner.label@gmail.com",
  sameAs: ["https://t.me/kazumaiq", "https://t.me/moder_cxrner_bot"],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className={`${orbitron.variable} ${exo.variable}`}>
      <body className="min-h-screen bg-night">
        <Script
          id="json-ld-org"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <div className="relative min-h-screen">
          <BackgroundFX />
          <Header />
          <Providers>{children}</Providers>
          <Footer />
        </div>
      </body>
    </html>
  );
}
