import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Orbitron, Sora } from "next/font/google";
import "@/app/globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Providers from "@/app/providers";

const orbitron = Orbitron({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CXRNER MUSIC — Независимый лейбл и дистрибуция",
  description:
    "CXRNER MUSIC — независимый лейбл, дистрибуция и продвижение для артистов нового звучания.",
  keywords: [
    "CXRNER MUSIC",
    "музыкальный лейбл",
    "дистрибуция",
    "релизы",
    "плейлистинг",
    "музыкальный маркетинг",
  ],
  openGraph: {
    title: "CXRNER MUSIC",
    description: "Независимый музыкальный лейбл и дистрибуция",
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
