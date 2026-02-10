import type { ReactNode } from "react";
import Reveal from "./Reveal";

type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  rightSlot?: ReactNode;
};

export default function SectionHeader({ eyebrow, title, description, rightSlot }: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neon/80">{eyebrow}</p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl font-display">{title}</h2>
        </Reveal>
        {description ? (
          <Reveal delay={0.1}>
            <p className="mt-3 max-w-2xl text-base text-white/70">{description}</p>
          </Reveal>
        ) : null}
      </div>
      {rightSlot ? <div className="mt-4 md:mt-0">{rightSlot}</div> : null}
    </div>
  );
}
