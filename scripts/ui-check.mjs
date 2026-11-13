// Headless UI smoke check: logs in, walks every screen and captures desktop +
// mobile screenshots into .runtime/shots. Run with `node scripts/ui-check.mjs`.
import fs from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const CHROME =
  process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUT = path.resolve(".runtime/shots");

const desktop = { width: 1440, height: 900 };
const mobile = { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };

async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
  console.log("shot", name);
}

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--hide-scrollbars"],
    defaultViewport: desktop,
  });
  const page = await browser.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));

  const login = async () => {
    await page.goto(`${BASE}/login`, { waitUntil: "networkidle2" });
    await page.type("#email", "admin@company.com");
    await page.type("#password", "Admin@12345");
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle2" }).catch(() => {}),
      page.click('button[type="submit"]'),
    ]);
    await new Promise((r) => setTimeout(r, 1500));
  };

  await page.setViewport(desktop);
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle2" });
  await shot(page, "01-login-desktop");
  await login();
  console.log("after login url:", page.url());

  for (const [route, name] of [
    ["/dashboard", "02-dashboard-desktop"],
    ["/parties", "03-parties-desktop"],
    ["/entry", "04-entry-desktop"],
    ["/ledger", "05-ledger-desktop"],
    ["/reports", "06-reports-desktop"],
    ["/settings", "07-settings-desktop"],
  ]) {
    await page.goto(`${BASE}${route}`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 700));
    await shot(page, name);
  }

  // Mobile pass
  await page.setViewport(mobile);
  for (const [route, name] of [
    ["/dashboard", "08-dashboard-mobile"],
    ["/parties", "09-parties-mobile"],
    ["/entry", "10-entry-mobile"],
    ["/ledger", "11-ledger-mobile"],
    ["/settings", "12-settings-mobile"],
  ]) {
    await page.goto(`${BASE}${route}`, { waitUntil: "networkidle2" });
    await new Promise((r) => setTimeout(r, 700));
    await shot(page, name);
  }

  // Mobile dialog
  await page.goto(`${BASE}/parties`, { waitUntil: "networkidle2" });
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const target = buttons.find(
      (b) => b.textContent && b.textContent.includes("নতুন পার্টি") && b.getBoundingClientRect().width > 0
    );
    target?.click();
  });
  await page.waitForSelector('[role="dialog"]', { timeout: 5000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 900));
  await shot(page, "13-party-dialog-mobile");

  // Mobile drawer
  await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle2" });
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const target = buttons.find((b) => b.getAttribute("aria-label") === "মেনু খুলুন");
    target?.click();
  });
  await new Promise((r) => setTimeout(r, 900));
  await shot(page, "14-drawer-mobile");

  // Mobile login
  await page.setViewport(mobile);
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle2" });
  await shot(page, "15-login-mobile");

  // Entry screen with a party selected (party due + recent transactions panel)
  for (const [viewport, name] of [
    [desktop, "16-entry-party-desktop"],
    [mobile, "17-entry-party-mobile"],
  ]) {
    await page.setViewport(viewport);
    await page.goto(`${BASE}/entry`, { waitUntil: "networkidle2" });
    await page.waitForSelector("#party option:nth-child(2)", { timeout: 8000 }).catch(() => {});
    await page.select("#party", await page.$eval("#party option:nth-child(2)", (o) => o.value));
    await new Promise((r) => setTimeout(r, 1400));
    await shot(page, name);
  }

  // Documents: share link + printable statement
  await page.setViewport(desktop);
  await page.goto(`${BASE}/dashboard`, { waitUntil: "networkidle2" });
  const partyId = await page.evaluate(async () => {
    const r = await fetch("/api/parties");
    const d = await r.json();
    return d.parties?.[0]?._id || "";
  });

  const entryFits = {};
  for (const [viewport, label] of [
    [desktop, "1440x900"],
    [{ width: 1366, height: 768 }, "1366x768"],
  ]) {
    await page.setViewport(viewport);
    await page.goto(`${BASE}/entry`, { waitUntil: "networkidle2" });
    await page.waitForSelector("#party option:nth-child(2)", { timeout: 8000 }).catch(() => {});
    await page.select("#party", await page.$eval("#party option:nth-child(2)", (o) => o.value));
    await new Promise((r) => setTimeout(r, 1200));
    entryFits[label] = await page.evaluate(() => document.documentElement.scrollHeight);
  }
  console.log("ENTRY_SCROLL_HEIGHT", JSON.stringify(entryFits));

  if (partyId) {
    const token = await page.evaluate(async (pid) => {
      const r = await fetch("/api/share/ledger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partyId: pid }),
      });
      const d = await r.json();
      return d.share?.token || "";
    }, partyId);

    await page.setViewport(desktop);
    await page.goto(`${BASE}/print/ledger/${partyId}`, { waitUntil: "networkidle2" });
    await shot(page, "18-print-statement-desktop");

    await page.goto(`${BASE}/print/reports`, { waitUntil: "networkidle2" });
    await shot(page, "19-print-report-desktop");

    if (token) {
      await page.goto(`${BASE}/share/ledger/${token}`, { waitUntil: "networkidle2" });
      await shot(page, "20-share-ledger-desktop");
      await page.setViewport(mobile);
      await page.goto(`${BASE}/share/ledger/${token}`, { waitUntil: "networkidle2" });
      await shot(page, "21-share-ledger-mobile");
      await page.evaluate(async (t) => {
        await fetch(`/api/share/ledger/${t}`, { method: "DELETE" });
      }, token);
    }

    // Share dialog on the ledger screen
    await page.setViewport(desktop);
    await page.goto(`${BASE}/ledger`, { waitUntil: "networkidle2" });
    await page.waitForSelector("#party option:nth-child(2)", { timeout: 8000 }).catch(() => {});
    await page.select("#party", await page.$eval("#party option:nth-child(2)", (o) => o.value));
    await new Promise((r) => setTimeout(r, 1500));
    await page.evaluate(() => {
      const button = Array.from(document.querySelectorAll("button")).find(
        (b) => b.textContent?.trim() === "শেয়ার" && b.getBoundingClientRect().width > 0
      );
      button?.click();
    });
    await new Promise((r) => setTimeout(r, 1200));
    await shot(page, "22-share-dialog-desktop");
  }

  // Horizontal overflow check
  const overflow = [];
  for (const [route, name] of [
    ["/dashboard", "desktop"],
    ["/parties", "desktop"],
    ["/entry", "desktop"],
  ]) {
    await page.setViewport(desktop);
    await page.goto(`${BASE}${route}`, { waitUntil: "networkidle2" });
    const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    overflow.push(`${name}${route} ${o.sw}>${o.cw}`);
  }
  for (const [route, name] of [
    ["/dashboard", "mobile"],
    ["/parties", "mobile"],
    ["/entry", "mobile"],
    ["/ledger", "mobile"],
    ["/reports", "mobile"],
    ["/settings", "mobile"],
  ]) {
    await page.setViewport(mobile);
    await page.goto(`${BASE}${route}`, { waitUntil: "networkidle2" });
    const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    overflow.push(`${name}${route} ${o.sw}>${o.cw}`);
  }

  console.log("OVERFLOW", overflow.join(" | "));
  console.log("ERRORS", errors.length ? errors.slice(0, 10).join(" || ") : "none");
  await browser.close();
}

main().catch((e) => {
  console.error("UI_CHECK_FAIL", e.message);
  process.exit(1);
});
