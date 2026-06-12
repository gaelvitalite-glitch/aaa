const { chromium } = require("playwright-core");
const EXEC = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
(async () => {
  const b = await chromium.launch({ executablePath: EXEC, args: ["--no-sandbox","--disable-gpu"] });
  const ctx = await b.newContext({ viewport: { width: 1680, height: 1000 }, deviceScaleFactor: 1.5 });
  await ctx.addInitScript(() => localStorage.setItem("upper-life:name:v1", "Gaël"));
  const p = await ctx.newPage();
  await p.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await p.waitForTimeout(1100);
  await p.evaluate(() => { const t=[...document.querySelectorAll("header nav button")].find(x=>x.textContent.includes("Finances")); t&&t.click(); });
  await p.waitForTimeout(800);
  await p.screenshot({ path: "/tmp/v-fin.png", fullPage: true });
  await b.close(); console.log("done");
})().catch(e => { console.error(e.message); process.exit(1); });
