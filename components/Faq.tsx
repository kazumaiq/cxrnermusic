"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { FaqItem } from "@/data/site";
import Reveal from "@/components/Reveal";

const itemTransition = { duration: 0.35, ease: "easeOut" };

type FaqProps = {
  items: FaqItem[];
};

export default function Faq({ items }: FaqProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-4">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        const contentId = `faq-content-${index}`;

        return (
          <Reveal key={item.question} delay={index * 0.03}>
            <motion.div layout className="glass rounded-2xl px-6">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-6 py-5 text-left"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                aria-expanded={isOpen}
                aria-controls={contentId}
              >
                <span className="text-base font-semibold text-white font-display">{item.question}</span>
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-xl text-white transition ${
                    isOpen ? "rotate-45 border-neon text-neon" : ""
                  }`}
                  aria-hidden="true"
                >
                  +
                </span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen ? (
                  <motion.div
                    id={contentId}
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={itemTransition}
                    className="overflow-hidden"
                  >
                    <div className="pb-6 text-sm text-white/70 space-y-3">
                      <p>{item.answer}</p>
                      {item.links ? (
                        <div className="flex flex-col gap-2">
                          {item.links.map((link) => (
                            <a
                              key={link.href}
                              href={link.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-neonSoft hover:text-white"
                            >
                              {link.label}
                            </a>
                          ))}
                        </div>
                      ) : null}
                      {item.bullets ? (
                        <ul className="space-y-2">
                          {item.bullets.map((bullet) => (
                            <li key={bullet} className="flex gap-2">
                              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-neon" />
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.div>
          </Reveal>
        );
      })}
    </div>
  );
}
