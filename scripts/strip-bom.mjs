import { existsSync, readFileSync, writeFileSync } from "node:fs";

const files = [
  "tsconfig.json",
  "package.json",
  "next.config.mjs",
  "postcss.config.js",
  "tailwind.config.ts",
];

for (const file of files) {
  if (!existsSync(file)) continue;
  const content = readFileSync(file, "utf8");
  const cleaned = content.replace(/^\uFEFF/, "");
  if (cleaned !== content) {
    writeFileSync(file, cleaned, "utf8");
  }
}
