"use client";

import { useState } from "react";
import { ChevronDown, ArrowUpRight, HelpCircle } from "lucide-react";
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
    <div className="space-y-3.5 max-w-4xl mx-auto">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        const indexStr = index + 1 < 10 ? `0${index + 1}` : `${index + 1}`;

        return (
          <div
            key={item.question}
            className={`rounded-xl border transition-all duration-300 overflow-hidden ${
              isOpen
                ? "border-white/40 bg-gradient-to-r from-[#111111] via-[#0c0c0c] to-[#0a0a0a] shadow-[0_0_30px_rgba(255,255,255,0.04)]"
                : "border-white/10 hover:border-white/20 bg-[#070707]/90"
            }`}
          >
            <button
              type="button"
              onClick={() => toggle(index)}
              className="w-full px-5 sm:px-7 py-5 flex items-center justify-between gap-4 text-left focus:outline-none group"
              aria-expanded={isOpen}
            >
              <div className="flex items-center gap-3.5 sm:gap-5">
                <span className="font-mono text-xs sm:text-sm font-bold tracking-widest text-neutral-500 group-hover:text-white transition">
                  [{indexStr}]
                </span>
                <span className="font-gothic font-bold text-white text-base sm:text-lg tracking-wide group-hover:text-neutral-200 transition">
                  {item.question}
                </span>
              </div>

              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 border ${
                  isOpen
                    ? "rotate-180 bg-white text-black border-white shadow-[0_0_12px_rgba(255,255,255,0.5)]"
                    : "bg-white/5 text-neutral-400 border-white/10 group-hover:border-white/30"
                }`}
              >
                <ChevronDown className="w-4 h-4" />
              </div>
            </button>

            {isOpen && (
              <div className="px-5 sm:px-7 pb-6 pt-2 text-xs sm:text-sm leading-relaxed text-neutral-300 font-sans border-t border-white/10 space-y-3.5 animate-fadeIn">
                <p className="font-sans leading-relaxed text-neutral-300">
                  {item.answer}
                </p>

                {item.bullets && item.bullets.length > 0 && (
                  <ul className="space-y-2 pl-4 list-disc marker:text-white font-sans text-neutral-300">
                    {item.bullets.map((bullet, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {bullet}
                      </li>
                    ))}
                  </ul>
                )}

                {item.links && item.links.length > 0 && (
                  <div className="pt-3 flex flex-wrap gap-2.5">
                    {item.links.map((link) => (
                      <a
                        key={link.label}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white text-white hover:text-black font-mono text-xs uppercase tracking-wider transition duration-300 border border-white/20"
                      >
                        <span>{link.label}</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
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
