"use client";

import { useRef, type ReactNode, type MouseEvent } from "react";
import Link from "next/link";

interface MagneticButtonProps {
  children: ReactNode;
  href?: string;
  external?: boolean;
  onClick?: () => void;
  className?: string;
  cursorLabel?: string;
  strength?: number;
  ariaLabel?: string;
}

/**
 * Magnetic interactive button / link with subtle cursor pull on desktop
 * and crisp tactile feedback on mobile.
 */
export default function MagneticButton({
  children,
  href,
  external = false,
  onClick,
  className = "",
  cursorLabel = "OPEN",
  strength = 0.28,
  ariaLabel,
}: MagneticButtonProps) {
  const ref = useRef<HTMLElement | null>(null);

  const handleMouseMove = (e: MouseEvent<HTMLElement>) => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const rect = el.getBoundingClientRect();
    const relX = e.clientX - (rect.left + rect.width / 2);
    const relY = e.clientY - (rect.top + rect.height / 2);
    el.style.transform = `translate3d(${relX * strength}px, ${relY * strength}px, 0)`;
  };

  const handleMouseLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "translate3d(0px, 0px, 0)";
  };

  const commonProps = {
    "data-cursor": cursorLabel,
    "aria-label": ariaLabel,
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave,
    className: `inline-flex items-center justify-center transition-transform duration-300 ease-out will-change-transform ${className}`,
  };

  if (href) {
    if (external || href.startsWith("http") || href.startsWith("mailto:")) {
      return (
        <a
          ref={(node) => {
            ref.current = node;
          }}
          href={href}
          target={href.startsWith("http") ? "_blank" : undefined}
          rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
          {...commonProps}
        >
          {children}
        </a>
      );
    }

    return (
      <Link
        ref={(node) => {
          ref.current = node;
        }}
        href={href}
        {...commonProps}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      ref={(node) => {
        ref.current = node;
      }}
      type="button"
      onClick={onClick}
      {...commonProps}
    >
      {children}
    </button>
  );
}
