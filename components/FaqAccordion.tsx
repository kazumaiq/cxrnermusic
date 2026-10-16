"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle, ArrowUpRight } from "lucide-react";
import type { FaqItem } from "../data/site";

interface FaqAccordionProps {
  items: FaqItem[];
}

export default function FaqAccordion({ items }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="space-y-3 max-w-4xl mx-auto">
      {items.map((item, index) => {
        const isOpen = openIndex === index;

        return (
          <div
            key={item.question}
            className={`glass-panel rounded-2xl border transition-all duration-300 overflow-hidden ${
              isOpen
                ? "border-neon/40 bg-white/[0.07] shadow-glow"
                : "border-white/10 hover:border-white/20 hover:bg-white/[0.04]"
            }`}
          >
            <button
              type="button"
              onClick={() => toggle(index)}
              className="w-full px-5 sm:px-6 py-4.5 flex items-center justify-between gap-4 text-left focus:outline-none"
              aria-expanded={isOpen}
            >
              <span className="font-semibold text-white text-sm sm:text-base flex items-center gap-2.5">
                <span className="text-xs font-mono text-neon/70">0{index + 1}</span>
                {item.question}
              </span>
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300 ${
                  isOpen ? "rotate-180 bg-neon/20 text-neon" : "bg-white/5 text-white/50"
                }`}
              >
                <ChevronDown className="w-4 h-4" />
              </div>
            </button>

            {isOpen && (
              <div className="px-5 sm:px-6 pb-5 pt-1 text-xs sm:text-sm leading-relaxed text-white/70 border-t border-white/5 space-y-3">
                <p>{item.answer}</p>

                {item.bullets && item.bullets.length > 0 && (
                  <ul className="space-y-1.5 pl-4 list-disc marker:text-aqua">
                    {item.bullets.map((bullet, idx) => (
                      <li key={idx}>{bullet}</li>
                    ))}
                  </ul>
                )}

                {item.links && item.links.length > 0 && (
                  <div className="pt-2 flex flex-wrap gap-2">
                    {item.links.map((link) => (
                      <a
                        key={link.label}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neon/15 hover:bg-neon/25 text-neonSoft text-xs font-semibold transition border border-neon/30"
                      >
                        {link.label}
                        <ArrowUpRight className="w-3 h-3" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
