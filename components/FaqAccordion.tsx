"use client";

import { useState } from "react";
import { Plus, Minus, ArrowUpRight } from "lucide-react";
import type { FaqItem } from "../data/site";
import { playClickSound } from "../lib/soundFX";

interface FaqAccordionProps {
  items: FaqItem[];
}

export default function FaqAccordion({ items }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    playClickSound();
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="border-t border-white/15 max-w-5xl mx-auto">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        const indexStr = index + 1 < 10 ? `0${index + 1}` : `${index + 1}`;

        return (
          <div
            key={item.question}
            className={`border-b border-white/15 transition-colors duration-300 ${
              isOpen ? "bg-[#160B28]/35" : "hover:bg-white/[0.02]"
            }`}
          >
            <button
              type="button"
              onClick={() => toggle(index)}
              data-cursor={isOpen ? "CLOSE" : "READ"}
              className="w-full px-3 sm:px-6 py-5 sm:py-6 flex items-center justify-between gap-4 text-left focus:outline-none group"
              aria-expanded={isOpen}
            >
              <div className="flex items-baseline gap-3.5 sm:gap-5">
                <span className="font-mono text-xs font-semibold tracking-wider text-[#B46BFF] select-none">
                  {indexStr}
                </span>
                <span className="font-sans font-semibold text-base sm:text-lg md:text-xl text-white group-hover:text-[#B46BFF] transition leading-snug">
                  {item.question}
                </span>
              </div>

              <div
                className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 border ${
                  isOpen
                    ? "bg-[#8737FF] text-white border-[#B46BFF] shadow-[0_0_20px_rgba(135,55,255,0.5)]"
                    : "bg-white/5 text-[#D9D9E2] border-white/15 group-hover:border-[#B46BFF]/50"
                }`}
              >
                {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </div>
            </button>

            {isOpen && (
              <div className="px-3 sm:px-6 pb-6 pt-1 sm:pl-16 text-xs sm:text-sm leading-relaxed text-[#D9D9E2]/85 space-y-3 animate-fadeIn">
                <p className="leading-relaxed">{item.answer}</p>

                {item.bullets && item.bullets.length > 0 && (
                  <ul className="space-y-1.5 pl-4 list-disc marker:text-[#B46BFF]">
                    {item.bullets.map((bullet, idx) => (
                      <li key={idx}>{bullet}</li>
                    ))}
                  </ul>
                )}

                {item.links && item.links.length > 0 && (
                  <div className="pt-2 flex flex-wrap gap-2.5">
                    {item.links.map((link) => (
                      <a
                        key={link.label}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#8737FF]/20 hover:bg-[#8737FF] text-white font-mono text-xs uppercase tracking-wider transition duration-300 border border-[#B46BFF]/40"
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
