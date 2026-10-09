import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import puppeteer from "puppeteer-core";
import { createServer } from "vite";

const root = fileURLToPath(new URL("../..", import.meta.url));
const mock = (name) => fileURLToPath(new URL(`./mock/${name}`, import.meta.url));

const CHROME_PATHS = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "/usr/bin/google-chrome",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
];

export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Local time in ms, month 10 = October
export const at = (day, hour, minute = 0) => new Date(2026, 9, day, hour, minute).getTime();

// Vite dev server for the real app, with Firebase replaced by in-memory mocks
export async function startApp() {
  const server = await createServer({
    configFile: false,
    root,
    cacheDir: "node_modules/.vite-test",
    logLevel: "error",
    plugins: [react()],
    server: { port: 5199 },
    resolve: {
      alias: [
        { find: /^\.\/firebase\.js$/, replacement: mock("firebase.js") },
        { find: /^firebase\/auth$/, replacement: mock("auth.js") },
        { find: /^firebase\/firestore$/, replacement: mock("firestore.js") },
      ],
    },
  });
  await server.listen();

  const executablePath = CHROME_PATHS.find((p) => p && existsSync(p));
  if (!executablePath) throw new Error("Chrome not found, set CHROME_PATH");
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    // GitHub's Ubuntu runners don't allow Chrome's sandbox
    args: process.env.CI ? ["--no-sandbox"] : [],
  });

  return {
    url: server.resolvedUrls.local[0],
    browser,
    close: async () => {
      await browser.close();
      await server.close();
    },
  };
}

// Opens the app with a fake clock starting at `now` and Firestore data `seed`.
// Returns the page, its errors and small helpers bound to it.
export async function openPage(app, { now, seed }) {
  const page = await app.browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  // A headless page may not count as focused (e.g. on CI), and then
  // focus/blur events don't fire. The panel saves on blur.
  const cdp = await page.createCDPSession();
  await cdp.send("Emulation.setFocusEmulationEnabled", { enabled: true });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    // The app has no favicon; that 404 is expected
    if (m.type() === "error" && !m.location().url?.endsWith("favicon.ico")) errors.push(m.text());
  });

  await page.evaluateOnNewDocument(
    (start, data) => {
      const RealDate = Date;
      let offset = start - RealDate.now();
      window.Date = class extends RealDate {
        constructor(...args) {
          if (args.length === 0) super(RealDate.now() + offset);
          else super(...args);
        }
        static now() {
          return RealDate.now() + offset;
        }
      };
      window.__setNow = (ms) => {
        offset = ms - RealDate.now();
      };
      window.__seed = data;
    },
    now,
    seed,
  );
  await page.goto(app.url, { waitUntil: "networkidle0" });
  await wait(100);

  const ui = {
    page,
    errors,
    text: (sel) => page.$eval(sel, (el) => el.textContent.trim()),
    val: (sel) => page.$eval(sel, (el) => el.value),
    hidden: (sel) => page.$eval(sel, (el) => el.hidden),
    get: (path) => page.evaluate((p) => window.__get(p), path),
    writes: () => page.evaluate(() => window.__writes.slice()),
    li: (id) => `#todo-list li[data-id="${id}"]`,
    ids: () => page.$$eval("#todo-list li", (els) => els.map((e) => e.dataset.id)),
    texts: () => page.$$eval("#todo-list li .text", (els) => els.map((e) => e.textContent.trim())),
    panelOpen: () => page.$eval("#detail", (el) => !el.hidden),
    // Clicks re-render the list in a later task; give it time
    click: async (sel) => {
      await page.click(sel);
      await wait(50);
    },
    clickText: (id) => ui.click(`#todo-list li[data-id="${id}"] .text`),
    tab: (name) => ui.click(`#tabs button[data-tab="${name}"]`),
    selectAll: async (sel) => {
      await page.click(sel);
      await page.keyboard.down("Control");
      await page.keyboard.press("a");
      await page.keyboard.up("Control");
    },
    // Trigger the app's day/clock check without waiting a minute
    refreshClock: async (ms) => {
      await page.evaluate((t) => window.__setNow(t), ms);
      await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
      await wait(150);
    },
  };
  return ui;
}
