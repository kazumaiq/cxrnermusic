import type { Metadata } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import { Orbitron, Sora } from "next/font/google";
import "./globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Providers from "./providers";

const SITE_URL = "https://cxrnermusic.vercel.app";

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "CXRNER MUSIC вЂ” РЅРµР·Р°РІРёСЃРёРјС‹Р№ Р»РµР№Р±Р» Рё РґРёСЃС‚СЂРёР±СѓС†РёСЏ",
    template: "%s вЂ” CXRNER MUSIC",
  },
  description:
    "CXRNER MUSIC вЂ” РЅРµР·Р°РІРёСЃРёРјС‹Р№ РјСѓР·С‹РєР°Р»СЊРЅС‹Р№ Р»РµР№Р±Р» Рё РґРёСЃС‚СЂРёР±СѓС†РёСЏ. Р РµР»РёР·С‹, РїР»РµР№Р»РёСЃС‚РёРЅРі, РјР°СЂРєРµС‚РёРЅРі Рё РјРѕРЅРµС‚РёР·Р°С†РёСЏ РґР»СЏ Р°СЂС‚РёСЃС‚РѕРІ РЅРѕРІРѕРіРѕ Р·РІСѓС‡Р°РЅРёСЏ.",
  keywords: [
    "CXRNER MUSIC",
    "cxrner",
    "РјСѓР·С‹РєР°Р»СЊРЅС‹Р№ Р»РµР№Р±Р»",
    "РґРёСЃС‚СЂРёР±СѓС†РёСЏ",
    "СЂРµР»РёР·С‹",
    "РїР»РµР№Р»РёСЃС‚РёРЅРі",
    "РјСѓР·С‹РєР°Р»СЊРЅС‹Р№ РјР°СЂРєРµС‚РёРЅРі",
    "РїСЂРѕРјРѕ",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "CXRNER MUSIC вЂ” РЅРµР·Р°РІРёСЃРёРјС‹Р№ Р»РµР№Р±Р» Рё РґРёСЃС‚СЂРёР±СѓС†РёСЏ",
    description:
      "РќРµР·Р°РІРёСЃРёРјС‹Р№ РјСѓР·С‹РєР°Р»СЊРЅС‹Р№ Р»РµР№Р±Р» Рё РґРёСЃС‚СЂРёР±СѓС†РёСЏ. Р РµР»РёР·С‹, РїР»РµР№Р»РёСЃС‚РёРЅРі Рё РјР°СЂРєРµС‚РёРЅРі РґР»СЏ Р°СЂС‚РёСЃС‚РѕРІ.",
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
    title: "CXRNER MUSIC вЂ” РЅРµР·Р°РІРёСЃРёРјС‹Р№ Р»РµР№Р±Р» Рё РґРёСЃС‚СЂРёР±СѓС†РёСЏ",
    description:
      "РќРµР·Р°РІРёСЃРёРјС‹Р№ РјСѓР·С‹РєР°Р»СЊРЅС‹Р№ Р»РµР№Р±Р» Рё РґРёСЃС‚СЂРёР±СѓС†РёСЏ. Р РµР»РёР·С‹, РїР»РµР№Р»РёСЃС‚РёРЅРі Рё РјР°СЂРєРµС‚РёРЅРі РґР»СЏ Р°СЂС‚РёСЃС‚РѕРІ.",
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
  logo: `${SITE_URL}/images/logo.png`,
  email: "cxrner.label@gmail.com",
  sameAs: ["https://t.me/kazumaiq", "https://t.me/moder_cxrner_bot"],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className={`${orbitron.variable} ${sora.variable}`}>
      <body className="min-h-screen bg-night">
        <Script
          id="json-ld-org"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <div className="relative min-h-screen">
          <Header />
          <Providers>{children}</Providers>
          <Footer />
        </div>
      </body>
    </html>
  );
}
