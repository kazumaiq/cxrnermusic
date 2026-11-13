"use client";

import React from "react";

export interface PlatformVisualMeta {
  name: string;
  shortName: string;
  bgColor: string;
  bgGradient: string;
  fgColor: string;
  glowColor: string;
}

export function getPlatformVisualMeta(key: string): PlatformVisualMeta {
  switch (key.toLowerCase()) {
    case "spotify":
      return {
        name: "Spotify",
        shortName: "Spotify",
        bgColor: "#1DB954",
        bgGradient: "linear-gradient(135deg, #1ED760 0%, #169C46 100%)",
        fgColor: "#06150B",
        glowColor: "rgba(30, 215, 96, 0.35)",
      };
    case "apple":
      return {
        name: "Apple Music",
        shortName: "Apple Music",
        bgColor: "#FA243C",
        bgGradient: "linear-gradient(135deg, #FB5C74 0%, #FA233B 100%)",
        fgColor: "#FFFFFF",
        glowColor: "rgba(250, 35, 59, 0.38)",
      };
    case "yandex":
      return {
        name: "Яндекс Музыка",
        shortName: "Я.Музыка",
        bgColor: "#FFCC00",
        bgGradient: "linear-gradient(135deg, #FFE033 0%, #FF9900 100%)",
        fgColor: "#141004",
        glowColor: "rgba(255, 204, 0, 0.35)",
      };
    case "vk":
      return {
        name: "VK Музыка",
        shortName: "VK Музыка",
        bgColor: "#0077FF",
        bgGradient: "linear-gradient(135deg, #1A88FF 0%, #005CE6 100%)",
        fgColor: "#FFFFFF",
        glowColor: "rgba(0, 119, 255, 0.38)",
      };
    case "youtube":
      return {
        name: "YouTube Music",
        shortName: "YT Music",
        bgColor: "#FF0000",
        bgGradient: "linear-gradient(135deg, #FF1E1E 0%, #CC0000 100%)",
        fgColor: "#FFFFFF",
        glowColor: "rgba(255, 0, 0, 0.35)",
      };
    case "deezer":
      return {
        name: "Deezer",
        shortName: "Deezer",
        bgColor: "#A238FF",
        bgGradient: "linear-gradient(135deg, #B95BFF 0%, #7B1FA2 100%)",
        fgColor: "#FFFFFF",
        glowColor: "rgba(162, 56, 255, 0.38)",
      };
    case "zvuk":
      return {
        name: "Звук",
        shortName: "Звук",
        bgColor: "#16E49E",
        bgGradient: "linear-gradient(135deg, #27F3AE 0%, #00B8D9 100%)",
        fgColor: "#041A14",
        glowColor: "rgba(22, 228, 158, 0.35)",
      };
    case "tidal":
      return {
        name: "Tidal",
        shortName: "Tidal",
        bgColor: "#0A0A0C",
        bgGradient: "linear-gradient(135deg, #1E1E24 0%, #050507 100%)",
        fgColor: "#FFFFFF",
        glowColor: "rgba(255, 255, 255, 0.25)",
      };
    case "soundcloud":
      return {
        name: "SoundCloud",
        shortName: "SoundCloud",
        bgColor: "#FF5500",
        bgGradient: "linear-gradient(135deg, #FF7700 0%, #FF3300 100%)",
        fgColor: "#FFFFFF",
        glowColor: "rgba(255, 85, 0, 0.38)",
      };
    default:
      return {
        name: key,
        shortName: key,
        bgColor: "#8737FF",
        bgGradient: "linear-gradient(135deg, #9D5CFF 0%, #6D28D9 100%)",
        fgColor: "#FFFFFF",
        glowColor: "rgba(135, 55, 255, 0.35)",
      };
  }
}

export function PlatformLogo({
  platformKey,
  className = "w-5 h-5",
}: {
  platformKey: string;
  className?: string;
}) {
  const k = platformKey.toLowerCase();

  if (k === "spotify") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2Zm4.586 14.424a.623.623 0 0 1-.857.207c-2.348-1.435-5.304-1.76-8.785-.964a.622.622 0 1 1-.277-1.215c3.809-.87 7.077-.496 9.713 1.115a.623.623 0 0 1 .206.857Zm1.224-2.724a.78.78 0 0 1-1.072.257c-2.687-1.652-6.785-2.131-9.965-1.166a.78.78 0 0 1-.452-1.492c3.632-1.102 8.147-.568 11.233 1.329a.78.78 0 0 1 .256 1.072Zm.105-2.836C14.692 8.95 9.375 8.775 6.297 9.71a.935.935 0 1 1-.543-1.79c3.532-1.072 9.404-.865 13.115 1.338a.935.935 0 0 1-.954 1.606Z" />
      </svg>
    );
  }

  if (k === "apple") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <path d="M19.5 3.15a.85.85 0 0 0-.9-.73l-9.6 1.75a.85.85 0 0 0-.7.84v10.27a3.35 3.35 0 1 0 1.65 2.89V9.17l7.9-1.44v5.79a3.35 3.35 0 1 0 1.65 2.89V3.15Z" />
      </svg>
    );
  }

  if (k === "yandex") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <path d="M12 3.2c-4.86 0-8.8 3.94-8.8 8.8 0 4.02 2.7 7.42 6.38 8.46V12.8c0-2.06 1.67-3.73 3.73-3.73.84 0 1.62.28 2.24.75V5.1A8.74 8.74 0 0 0 12 3.2Zm3.55 8.18a2.18 2.18 0 1 0 0 4.36 2.18 2.18 0 0 0 0-4.36Zm-3.15 5.42v3.98c4.42-.24 7.98-3.68 8.36-8.06h-2.18c-.36 2.94-2.78 5.24-5.76 5.46-.14-.46-.28-.92-.42-1.38Z" />
      </svg>
    );
  }

  if (k === "vk") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <path d="M12.92 17.75c-5.88 0-9.23-4.03-9.37-10.75h2.95c.09 4.93 2.27 7.02 3.99 7.45V7h2.77v4.25c1.7-.18 3.49-2.12 4.09-4.25h2.77c-.46 2.62-2.38 4.55-3.75 5.35 1.37.65 3.55 2.34 4.38 5.4h-3.05c-.66-2.05-2.3-3.64-4.46-3.85v3.85h-.32Z" />
      </svg>
    );
  }

  if (k === "youtube") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <path d="M12 2.5a9.5 9.5 0 1 0 0 19 9.5 9.5 0 0 0 0-19Zm0 15.1a5.6 5.6 0 1 1 0-11.2 5.6 5.6 0 0 1 0 11.2Zm0-9.7a4.1 4.1 0 1 0 0 8.2 4.1 4.1 0 0 0 0-8.2Zm-1.45 6.2V9.9l3.7 2.1-3.7 2.1Z" />
      </svg>
    );
  }

  if (k === "deezer") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <path d="M12 20.2c-.35 0-.68-.13-.95-.36C6.95 16.24 4 13.06 4 9.5 4 6.95 6.01 5 8.5 5c1.46 0 2.77.7 3.5 1.8C12.73 5.7 14.04 5 15.5 5 17.99 5 20 6.95 20 9.5c0 3.56-2.95 6.74-7.05 10.34-.27.23-.6.36-.95.36Zm-4-9.95v3.5h1.5v-3.5H8Zm3.25-1.5v5h1.5v-5h-1.5Zm3.25 1.5v3.5H16v-3.5h-1.5Z" />
      </svg>
    );
  }

  if (k === "zvuk") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <path d="M4.5 6.5h12.2L7.4 15.3h9.8v2.4H4l9.3-8.8H4.5V6.5Zm14.2 2.9c1.5 1.5 1.5 4.1 0 5.6l-1.5-1.5c.7-.7.7-1.9 0-2.6l1.5-1.5Z" />
      </svg>
    );
  }

  if (k === "tidal") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <path d="m7.5 6 3 3-3 3-3-3 3-3Zm4.5 4.5 3 3-3 3-3-3 3-3Zm4.5-4.5 3 3-3 3-3-3 3-3Zm-4.5 9 3 3-3 3-3-3 3-3Z" />
      </svg>
    );
  }

  if (k === "soundcloud") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <path d="M11.6 8.2c-.6 0-1.15.12-1.65.34v7.96h7.4a2.9 2.9 0 0 0 .3-5.78 4.55 4.55 0 0 0-6.05-2.52ZM7.4 10v6.5h1.25V9.6c-.45.1-.88.24-1.25.4Zm-2.25 1.55v4.95h1.15v-5.35c-.42.1-.8.24-1.15.4ZM3 13.2v3.3h1.05v-3.5c-.38.04-.73.1-1.05.2Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6Z" />
    </svg>
  );
}
