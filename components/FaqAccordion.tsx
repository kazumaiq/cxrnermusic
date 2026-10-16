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
            className={`dark-panel rounded-xl border transition-all duration-300 overflow-hidden bg-[#090909] ${
              isOpen
                ? "border-white/30 bg-[#0e0e0e]"
                : "border-white/10 hover:border-white/20"
            }`}
          >
            <button
              type="button"
              onClick={() => toggle(index)}
              className="w-full px-5 sm:px-6 py-4.5 flex items-center justify-between gap-4 text-left focus:outline-none"
              aria-expanded={isOpen}
            >
              <span className="font-gothic font-bold text-white text-sm sm:text-base flex items-center gap-3">
                <span className="font-mono text-xs text-neutral-500">[{index + 1 < 10 ? `0${index + 1}` : index + 1}]</span>
                {item.question}
              </span>
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300 ${
                  isOpen ? "rotate-180 bg-white text-black" : "bg-white/5 text-neutral-400"
                }`}
              >
                <ChevronDown className="w-4 h-4" />
              </div>
            </button>

            {isOpen && (
              <div className="px-5 sm:px-6 pb-5 pt-1 text-xs sm:text-sm leading-relaxed text-neutral-400 font-sans border-t border-white/5 space-y-3">
                <p>{item.answer}</p>

                {item.bullets && item.bullets.length > 0 && (
                  <ul className="space-y-1.5 pl-4 list-disc marker:text-white">
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
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-white font-mono text-xs transition border border-white/20"
                      >
                        <span>{link.label}</span>
                        <ArrowUpRight className="w-3 h-3 text-neutral-400" />
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
