import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("C:/Users/user/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright");

const BASE = "http://localhost:3012";

async function runAudit() {
  console.log(`Starting deep site audit on ${BASE} ...`);
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl", "--no-sandbox"],
  });

  let totalErrors = 0;
  const issues = [];

  const pagesToTest = [
    { url: `${BASE}/`, name: "Home Page" },
    { url: `${BASE}/submit-release`, name: "Submit Release" },
    { url: `${BASE}/contact`, name: "Contact Page" },
    { url: `${BASE}/offer`, name: "Offer / Contract" },
    { url: `${BASE}/auth/login`, name: "Login Page" },
  ];

  const viewports = [
    { width: 1440, height: 900, name: "Desktop" },
    { width: 390, height: 844, name: "Mobile (iPhone 14)" }
  ];

  for (const vp of viewports) {
    console.log(`\n=== Testing Viewport: ${vp.name} (${vp.width}x${vp.height}) ===`);
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();

    page.on("pageerror", (err) => {
      totalErrors++;
      issues.push(`[${vp.name}] Uncaught page error: ${err.message}`);
      console.error(`PAGE ERROR [${vp.name}]:`, err.message);
    });

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        totalErrors++;
        issues.push(`[${vp.name}] Console error: ${msg.text()}`);
        console.error(`CONSOLE ERROR [${vp.name}]:`, msg.text());
      }
    });

    page.on("requestfailed", (req) => {
      if (req.failure()?.errorText !== "net::ERR_ABORTED") {
        totalErrors++;
        issues.push(`[${vp.name}] Request failed: ${req.url()} - ${req.failure()?.errorText}`);
      }
    });

    for (const item of pagesToTest) {
      console.log(`Auditing ${item.name} (${item.url})...`);
      const res = await page.goto(item.url, { waitUntil: "networkidle", timeout: 20000 }).catch(e => {
        totalErrors++;
        issues.push(`Failed to load ${item.url}: ${e.message}`);
        return null;
      });

      if (res && res.status() >= 400) {
        totalErrors++;
        issues.push(`HTTP ${res.status()} on ${item.url}`);
      }

      await page.waitForTimeout(600);

      // Check for horizontal overflow
      const overflow = await page.evaluate(() => {
        return {
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
          isOverflowing: document.documentElement.scrollWidth > window.innerWidth,
        };
      });

      if (overflow.isOverflowing) {
        console.warn(`  [WARN] Horizontal overflow on ${item.name}: scrollWidth=${overflow.scrollWidth} > innerWidth=${overflow.innerWidth}`);
      }

      // Check if WebGL canvas is present on home page
      if (item.url === `${BASE}/`) {
        const canvasInfo = await page.evaluate(() => {
          const canvases = document.querySelectorAll("canvas");
          return {
            count: canvases.length,
            visible: canvases.length > 0 && canvases[0].offsetWidth > 0,
          };
        });
        console.log(`  -> WebGL Canvas: count=${canvasInfo.count}, visible=${canvasInfo.visible}`);
        if (canvasInfo.count === 0) {
          totalErrors++;
          issues.push(`[${vp.name}] WebGL Canvas missing on Home page`);
        }
      }
    }

    await context.close();
  }

  await browser.close();

  console.log("\n================ AUDIT SUMMARY ================");
  console.log(`Total detected errors/issues: ${totalErrors}`);
  if (issues.length > 0) {
    console.log("Issues found:");
    issues.forEach(i => console.log(` - ${i}`));
  } else {
    console.log("ALL PAGES AND VIEWPORTS PASSED WITH ZERO ERRORS!");
  }
}

runAudit().catch(e => {
  console.error("Audit script failed:", e);
  process.exit(1);
});
