"use client";

import React from "react";
import Link from "next/link";
import { playClickSound, playHoverSound } from "@/lib/soundFX";

export type CxrButtonVariant = "chrome" | "energy" | "ghost" | "cyan" | "danger";

interface BaseProps {
  variant?: CxrButtonVariant;
  size?: "sm" | "md" | "lg";
  className?: string;
  children: React.ReactNode;
}

type ButtonAsButton = BaseProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: never;
  };

type ButtonAsLink = BaseProps & {
  href: string;
  target?: string;
  rel?: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
};

export type CxrButtonProps = ButtonAsButton | ButtonAsLink;

const VARIANT_CLASSES: Record<CxrButtonVariant, string> = {
  chrome: "btn-void-primary",
  energy: "btn-energy",
  ghost: "btn-void-ghost",
  cyan:
    "relative inline-flex items-center justify-center gap-2 rounded-full font-extrabold uppercase tracking-wider text-[#040307] bg-gradient-to-r from-[#00F0FF] to-[#8AF8FF] border border-[#00F0FF]/80 shadow-[0_12px_32px_rgba(0,240,255,0.28)] hover:brightness-110 hover:-translate-y-0.5 active:scale-[0.985] transition-all duration-200",
  danger:
    "relative inline-flex items-center justify-center gap-2 rounded-full font-bold uppercase tracking-wider text-red-100 bg-red-600/25 border border-red-500/45 hover:bg-red-600/40 hover:border-red-400 active:scale-[0.985] transition-all duration-200",
};

const SIZE_CLASSES: Record<NonNullable<BaseProps["size"]>, string> = {
  sm: "px-4 py-2 text-[10px]",
  md: "px-6 py-2.5 text-[11px]",
  lg: "px-8 py-3.5 text-xs",
};

export function CxrButton(props: CxrButtonProps) {
  const { variant = "chrome", size = "md", className = "", children } = props;
  const cls = `${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} cursor-pointer disabled:opacity-45 disabled:pointer-events-none ${className}`;

  if ("href" in props && props.href) {
    const { href, target, rel, onClick } = props;
    return (
      <Link
        href={href}
        target={target}
        rel={rel}
        onMouseEnter={() => playHoverSound()}
        onClick={(e) => {
          playClickSound();
          onClick?.(e);
        }}
        className={cls}
      >
        {children}
      </Link>
    );
  }

  const {
    variant: _v,
    size: _s,
    className: _c,
    children: _ch,
    onClick,
    onMouseEnter,
    ...rest
  } = props as ButtonAsButton;

  return (
    <button
      onMouseEnter={(e) => {
        playHoverSound();
        onMouseEnter?.(e);
      }}
      onClick={(e) => {
        playClickSound();
        onClick?.(e);
      }}
      className={cls}
      {...rest}
    >
      {children}
    </button>
  );
}
