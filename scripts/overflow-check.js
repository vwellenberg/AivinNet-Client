// Post-deploy gate: no phone width may force a layout viewport wider than the
// screen. When any element's min-content exceeds the viewport, mobile browsers
// expand the layout viewport to fit it and the whole app renders zoomed-out /
// clipped — reported twice as "the UI is not responsive any more" (#433 at
// 390px, then again at 360px because the verification only measured 390).
//
// Runs headless against the LIVE app (or BASE), across the real phone-width
// spectrum. 390 alone proved worthless: the bar that broke a 360px phone
// measured exactly 390px of min-content and passed there.
//
// Env: TOKEN (required, JWT cookie value) · BASE (default http://localhost:1970)
//      WIDTHS (default 320,360,390,412,430) · ROUTES (default /,search)
// Exit: 0 clean · 1 overflow found · 2 harness error
//
// Playwright is resolved via NODE_PATH (the server keeps it in ~/uitest);
// scripts/deploy-client.sh wires that up and treats a FAIL as a deploy error.
const { chromium } = require("playwright");

(async () => {
  const BASE = process.env.BASE || "http://localhost:1970";
  const widths = (process.env.WIDTHS || "320,360,390,412,430").split(",").map(Number);
  const routes = (process.env.ROUTES || "/,/search/top?q=a").split(",");
  const browser = await chromium.launch();
  let fail = 0;

  for (const width of widths) {
    const ctx = await browser.newContext({
      viewport: { width, height: 800 },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15",
    });
    await ctx.addCookies([
      {
        name: "access_token_cookie",
        value: process.env.TOKEN,
        domain: new URL(BASE).hostname,
        path: "/",
      },
    ]);
    const page = await ctx.newPage();

    for (const route of routes) {
      await page.goto(BASE + "/#" + route, { waitUntil: "networkidle", timeout: 45000 });
      await page.waitForTimeout(2500);
      const m = await page.evaluate(() => {
        const doc = document.documentElement;
        const wide = [];
        if (doc.scrollWidth > doc.clientWidth + 1) {
          // Report the DEEPEST elements wider than the viewport — everything
          // above them merely stretches to the expanded layout viewport.
          document.querySelectorAll("body *").forEach((el) => {
            const rect = el.getBoundingClientRect();
            const kidWide = [...el.children].some(
              (kid) => kid.getBoundingClientRect().width > doc.clientWidth
            );
            if (rect.width > doc.clientWidth && !kidWide) {
              const cls = String(el.className).split(" ").slice(0, 2).join(".");
              wide.push(`${el.tagName}.${cls}=${Math.round(rect.width)}`);
            }
          });
        }
        return { docW: doc.scrollWidth, clientW: doc.clientWidth, wide: wide.slice(0, 6) };
      });
      const ok = m.docW <= m.clientW + 1;
      if (!ok) fail++;
      console.log(
        `${ok ? "OK  " : "FAIL"} w=${width} route=${route} doc=${m.docW} client=${m.clientW}` +
          (m.wide.length ? " wide: " + m.wide.join(" | ") : "")
      );
    }
    await ctx.close();
  }

  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(2);
});
