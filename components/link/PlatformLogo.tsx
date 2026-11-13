"use client";

import React from "react";

export interface PlatformVisualMeta {
  name: string;
  shortName: string;
  bgColor: string;
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
        fgColor: "#06150B",
        glowColor: "rgba(29, 185, 84, 0.38)",
      };
    case "apple":
      return {
        name: "Apple Music",
        shortName: "Apple Music",
        bgColor: "#FA243C",
        fgColor: "#FFFFFF",
        glowColor: "rgba(250, 36, 60, 0.38)",
      };
    case "yandex":
      return {
        name: "Яндекс Музыка",
        shortName: "Я.Музыка",
        bgColor: "#FFCC00",
        fgColor: "#121007",
        glowColor: "rgba(255, 204, 0, 0.35)",
      };
    case "vk":
      return {
        name: "VK Музыка",
        shortName: "VK Музыка",
        bgColor: "#0077FF",
        fgColor: "#FFFFFF",
        glowColor: "rgba(0, 119, 255, 0.38)",
      };
    case "youtube":
      return {
        name: "YouTube Music",
        shortName: "YT Music",
        bgColor: "#FF0033",
        fgColor: "#FFFFFF",
        glowColor: "rgba(255, 0, 51, 0.35)",
      };
    case "deezer":
      return {
        name: "Deezer",
        shortName: "Deezer",
        bgColor: "#A238FF",
        fgColor: "#FFFFFF",
        glowColor: "rgba(162, 56, 255, 0.35)",
      };
    case "zvuk":
      return {
        name: "Звук",
        shortName: "Звук",
        bgColor: "#16E49E",
        fgColor: "#041A12",
        glowColor: "rgba(22, 228, 158, 0.35)",
      };
    case "tidal":
      return {
        name: "Tidal",
        shortName: "Tidal",
        bgColor: "#00FFFF",
        fgColor: "#031414",
        glowColor: "rgba(0, 255, 255, 0.35)",
      };
    case "soundcloud":
      return {
        name: "SoundCloud",
        shortName: "SoundCloud",
        bgColor: "#FF5500",
        fgColor: "#FFFFFF",
        glowColor: "rgba(255, 85, 0, 0.35)",
      };
    default:
      return {
        name: key,
        shortName: key,
        bgColor: "#8737FF",
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
        <path d="M17.9 10.9C14.7 9 9.35 8.8 6.3 9.75c-.5.15-1-.15-1.15-.6-.15-.5.15-1 .6-1.15 3.55-1.05 9.4-.85 13.1 1.35.45.25.6.85.35 1.3-.25.35-.85.5-1.3.25m-.1 2.8c-.25.35-.7.5-1.05.25-2.7-1.65-6.8-2.15-9.95-1.15-.4.1-.85-.1-.95-.5-.1-.4.1-.85.5-.95 3.65-1.1 8.15-.55 11.25 1.35.3.15.45.65.2 1m-1.2 2.75c-.2.3-.55.4-.85.2-2.35-1.45-5.3-1.75-8.8-.95-.35.1-.65-.15-.75-.45-.1-.35.15-.65.45-.75 3.8-.85 7.1-.5 9.7 1.1.35.15.4.55.25.85" />
      </svg>
    );
  }

  if (k === "apple") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <path d="M18.5 3.2c0-.4-.35-.7-.75-.62l-8.5 1.7a.75.75 0 0 0-.6.73v9.75a3.25 3.25 0 1 0 1.5 2.74V8.83l6.85-1.37v5.8a3.25 3.25 0 1 0 1.5 2.74V3.2Z" />
      </svg>
    );
  }

  if (k === "yandex") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <path d="M14.8 4.2c-2.6-.9-5.5-.2-7.4 1.8-2 2-2.6 5-1.5 7.6l1.7-.7c-.8-1.9-.3-4.1 1.1-5.6 1.4-1.4 3.5-1.9 5.4-1.2l.7-1.9Zm2.3 2.1-1.3 1.5c1.1 1 1.7 2.5 1.5 4.1-.2 1.7-1.3 3.1-2.8 3.8l.8 1.8c2.2-1 3.7-3.1 4-5.4.3-2.2-.5-4.4-2.2-5.8ZM12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z" />
      </svg>
    );
  }

  if (k === "vk") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <path d="M12.78 17.5c-5.4 0-8.48-3.7-8.6-9.86h2.7c.08 4.52 2.08 6.44 3.66 6.84V7.64h2.54v3.9c1.56-.17 3.2-1.95 3.75-3.9h2.54c-.42 2.4-2.18 4.18-3.44 4.91 1.26.6 3.26 2.15 4.02 4.95h-2.8c-.6-1.88-2.1-3.34-4.09-3.54v3.54h-.28Z" />
      </svg>
    );
  }

  if (k === "youtube") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <path d="M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17Zm0 13.7a5.2 5.2 0 1 1 0-10.4 5.2 5.2 0 0 1 0 10.4Zm-1.7-7.7v5l4.4-2.5-4.4-2.5Z" />
      </svg>
    );
  }

  if (k === "deezer") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <path d="M3 16h3.2v2H3v-2Zm4.2 0h3.2v2H7.2v-2Zm4.2 0h3.2v2h-3.2v-2Zm4.2 0h3.2v2h-3.2v-2ZM3 13h3.2v2H3v-2Zm4.2 0h3.2v2H7.2v-2Zm8.4 0h3.2v2h-3.2v-2ZM7.2 10h3.2v2H7.2v-2Zm8.4 0h3.2v2h-3.2v-2Zm0-3h3.2v2h-3.2V7Z" />
      </svg>
    );
  }

  if (k === "zvuk") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <path d="M5 7h11.5L7.6 15.2H17v2.3H4.5l8.9-8.2H5V7Zm13 3.2c1.2 1.2 1.2 3.4 0 4.6l-1.4-1.4c.5-.5.5-1.3 0-1.8L18 10.2Z" />
      </svg>
    );
  }

  if (k === "tidal") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <path d="m7.5 6.5 3 3-3 3-3-3 3-3Zm4.5 4.5 3 3-3 3-3-3 3-3Zm4.5-4.5 3 3-3 3-3-3 3-3Zm-4.5 9 3 3-3 3-3-3 3-3Z" />
      </svg>
    );
  }

  if (k === "soundcloud") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <path d="M11.5 8.5c-.6 0-1.1.1-1.6.3v7.7h7.3a2.8 2.8 0 0 0 .3-5.6 4.4 4.4 0 0 0-6-2.4ZM7.5 10.2v6.3h1.2v-6.7a4.6 4.6 0 0 0-1.2.4Zm-2.2 1.5v4.8h1.1v-5.2c-.4.1-.8.2-1.1.4Zm-2.1 1.6v3.2h1v-3.4c-.4 0-.7.1-1 .2Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6Z" />
    </svg>
  );
}
