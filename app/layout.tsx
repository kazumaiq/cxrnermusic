import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Orbitron, Sora } from "next/font/google";
import "./globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Providers from "./providers";

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
  title: "CXRNER MUSIC вЂ” РќРµР·Р°РІРёСЃРёРјС‹Р№ Р»РµР№Р±Р» Рё РґРёСЃС‚СЂРёР±СѓС†РёСЏ",
  description:
    "CXRNER MUSIC вЂ” РЅРµР·Р°РІРёСЃРёРјС‹Р№ Р»РµР№Р±Р», РґРёСЃС‚СЂРёР±СѓС†РёСЏ Рё РїСЂРѕРґРІРёР¶РµРЅРёРµ РґР»СЏ Р°СЂС‚РёСЃС‚РѕРІ РЅРѕРІРѕРіРѕ Р·РІСѓС‡Р°РЅРёСЏ.",
  keywords: [
    "CXRNER MUSIC",
    "РјСѓР·С‹РєР°Р»СЊРЅС‹Р№ Р»РµР№Р±Р»",
    "РґРёСЃС‚СЂРёР±СѓС†РёСЏ",
    "СЂРµР»РёР·С‹",
    "РїР»РµР№Р»РёСЃС‚РёРЅРі",
    "РјСѓР·С‹РєР°Р»СЊРЅС‹Р№ РјР°СЂРєРµС‚РёРЅРі",
  ],
  openGraph: {
    title: "CXRNER MUSIC",
    description: "РќРµР·Р°РІРёСЃРёРјС‹Р№ РјСѓР·С‹РєР°Р»СЊРЅС‹Р№ Р»РµР№Р±Р» Рё РґРёСЃС‚СЂРёР±СѓС†РёСЏ",
    type: "website",
  },
  metadataBase: new URL("https://cxrner-music.vercel.app"),
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className={`${orbitron.variable} ${sora.variable}`}>
      <body className="min-h-screen bg-night">
        <div className="relative min-h-screen">
          <Header />
          <Providers>{children}</Providers>
          <Footer />
        </div>
      </body>
    </html>
  );
}
