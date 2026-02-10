"use client";

import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
  PointerEvent,
  FocusEvent,
} from "react";
import Link from "next/link";

const baseClasses = "btn btn-ripple";

function useRippleHandlers<T extends HTMLElement>() {
  const handlePointerMove = (event: PointerEvent<T>) => {
    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    target.style.setProperty("--ripple-x", `${x}%`);
    target.style.setProperty("--ripple-y", `${y}%`);
  };

  const handleFocus = (event: FocusEvent<T>) => {
    const target = event.currentTarget;
    target.style.setProperty("--ripple-x", "50%");
    target.style.setProperty("--ripple-y", "50%");
  };

  return { handlePointerMove, handleFocus };
}

type GlowButtonProps = {
  children: ReactNode;
  href?: string;
  variant?: "primary" | "ghost";
  className?: string;
  external?: boolean;
} & (AnchorHTMLAttributes<HTMLAnchorElement> | ButtonHTMLAttributes<HTMLButtonElement>);

export default function GlowButton({
  children,
  href,
  variant = "primary",
  className = "",
  external = false,
  ...props
}: GlowButtonProps) {
  const { handlePointerMove, handleFocus } = useRippleHandlers<HTMLElement>();
  const variantClass = variant === "primary" ? "btn-primary" : "btn-ghost";
  const classes = `${baseClasses} ${variantClass} ${className}`;

  if (href) {
    if (external || href.startsWith("http")) {
      const anchorProps = props as AnchorHTMLAttributes<HTMLAnchorElement>;
      const target = anchorProps.target;
      const rel = anchorProps.rel ?? (target === "_blank" ? "noopener noreferrer" : undefined);

      return (
        <a
          href={href}
          className={classes}
          onPointerMove={handlePointerMove}
          onFocus={handleFocus}
          target={target}
          rel={rel}
          aria-label={anchorProps["aria-label"]}
        >
          {children}
        </a>
      );
    }

    const linkProps = props as AnchorHTMLAttributes<HTMLAnchorElement>;
    return (
      <Link
        href={href}
        className={classes}
        onPointerMove={handlePointerMove}
        onFocus={handleFocus}
        aria-label={linkProps["aria-label"]}
      >
        {children}
      </Link>
    );
  }

  const buttonProps = props as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button
      type={buttonProps.type ?? "button"}
      className={classes}
      onPointerMove={handlePointerMove}
      onFocus={handleFocus}
      {...buttonProps}
    >
      {children}
    </button>
  );
}
