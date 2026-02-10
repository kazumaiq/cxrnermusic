"use client";

import type { ElementType } from "react";
import { motion } from "framer-motion";

type RevealTextProps = {
  text: string;
  className?: string;
  as?: ElementType;
};

const container = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.04,
    },
  },
};

const word = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export default function RevealText({ text, className = "", as: Component = "span" }: RevealTextProps) {
  const words = text.split(" ");

  return (
    <Component className={className} aria-label={text}>
      <motion.span
        className="inline-block"
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.6 }}
      >
        {words.map((item, index) => (
          <motion.span
            key={`${item}-${index}`}
            className="inline-block mr-2"
            variants={word}
            aria-hidden="true"
          >
            {item}
          </motion.span>
        ))}
      </motion.span>
    </Component>
  );
}
