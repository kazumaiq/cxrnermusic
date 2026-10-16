"use client";

import { useState } from "react";
import { ChevronDown, ArrowUpRight } from "lucide-react";
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
    <div className="space-y-4 max-w-4xl mx-auto">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        const indexStr = index + 1 < 10 ? `0${index + 1}` : `${index + 1}`;

        return (
          <div
            key={item.question}
            className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
              isOpen
                ? "border-purple-500/40 bg-gradient-to-r from-[#140c24] via-[#0d0918] to-[#080610] shadow-[0_0_25px_rgba(168,85,247,0.15)]"
                : "border-purple-500/15 hover:border-purple-500/30 bg-[#090910]/80"
            }`}
          >
            <button
              type="button"
              onClick={() => toggle(index)}
              className="w-full px-5 sm:px-7 py-5 flex items-center justify-between gap-4 text-left focus:outline-none group"
              aria-expanded={isOpen}
            >
              <div className="flex items-center gap-3.5 sm:gap-5">
                <span className="font-mono text-xs sm:text-sm font-bold tracking-widest text-purple-400 group-hover:text-purple-300 transition">
                  [{indexStr}]
                </span>
                <span className="font-gothic font-bold text-white text-base sm:text-lg tracking-wide group-hover:text-purple-200 transition">
                  {item.question}
                </span>
              </div>

              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 border ${
                  isOpen
                    ? "rotate-180 bg-purple-600 text-white border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.5)]"
                    : "bg-white/5 text-neutral-400 border-white/10 group-hover:border-purple-500/30"
                }`}
              >
                <ChevronDown className="w-4 h-4" />
              </div>
            </button>

            {isOpen && (
              <div className="px-5 sm:px-7 pb-6 pt-2 text-xs sm:text-sm leading-relaxed text-neutral-300 font-sans border-t border-purple-500/15 space-y-3.5 animate-fadeIn">
                <p className="font-sans leading-relaxed text-neutral-300">
                  {item.answer}
                </p>

                {item.bullets && item.bullets.length > 0 && (
                  <ul className="space-y-2 pl-4 list-disc marker:text-purple-400 font-sans text-neutral-300">
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
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 hover:text-white font-mono text-xs uppercase tracking-wider transition duration-300 border border-purple-500/30"
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
