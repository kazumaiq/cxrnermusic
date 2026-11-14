"use client";

import React from "react";
import { CxrSurface } from "./CxrSurface";
import { CxrButton } from "./CxrButton";

interface CxrEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export function CxrEmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className = "",
}: CxrEmptyStateProps) {
  return (
    <CxrSurface
      variant="obsidian"
      className={`p-8 sm:p-12 text-center flex flex-col items-center justify-center gap-4 ${className}`}
    >
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/12 flex items-center justify-center text-[#D9D9E2]/70">
          {icon}
        </div>
      )}
      <div className="space-y-1.5 max-w-md">
        <h3 className="font-display font-bold text-lg sm:text-xl text-white uppercase tracking-tight">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-[#D9D9E2]/65 leading-relaxed">
          {description}
        </p>
      </div>
      {actionLabel && actionHref && (
        <CxrButton href={actionHref} variant="chrome" size="sm" className="mt-1">
          {actionLabel}
        </CxrButton>
      )}
      {actionLabel && !actionHref && onAction && (
        <CxrButton onClick={onAction} variant="chrome" size="sm" className="mt-1">
          {actionLabel}
        </CxrButton>
      )}
    </CxrSurface>
  );
}

export function CxrSkeleton({ className = "h-24 w-full" }: { className?: string }) {
  return (
    <div
      className={`rounded-2xl bg-white/[0.04] border border-white/[0.07] animate-pulse ${className}`}
    />
  );
}
