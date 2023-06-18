import path from "path";
import puppeteer, { Page } from "puppeteer";
import { Recorder } from "./recorder";

/** opens a web browser and records activity. works with a web extension (not built)
 * can be repurposed to work standalone or in combination
 *
 */
const main = async () => {
  const pathToExtension = path.join(__dirname, "chrome_extension");
  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/chromium-browser",
    userDataDir: "./chrome_user_data",
    headless: false,
    // debuggingPort: 9222,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
    ],
    handleSIGHUP: false,
    handleSIGTERM: false,
    handleSIGINT: false,
  });

  const gracefulShutdown = async () => {
    recorder.stop();
    await browser.close();
    process.exit(0);
  };

  browser.on("SIGINT", () => {
    if (recorder.recordingInProgress) {
      extWorker?.emit("ShutdownWarning");
      console.warn(
        "recording still in progress, please stop recording before exiting or data will be lost"
      );
    } else {
      gracefulShutdown();
    }
  });
  browser.on("SIGTERM", gracefulShutdown);
  browser.on("SIGUP", gracefulShutdown);

  // Chrome Extension Service Worker
  const extBackgroundTarget = await browser.waitForTarget(
    (t) =>
      t.type() === "service_worker" && t.url().includes("chrome-extension://")
  );
  const extWorker = await extBackgroundTarget.worker();
  if (!extWorker) throw new Error("Could not find extension service worker");

  const page = await browser.newPage();
  const recorder = new Recorder(page);

  // Listen for StartRecording Event from Extension
  extWorker.on("StartRecording", async (msg) => {
    recorder.start();
  });

  // Listen for StopRecording Event from Extension
  extWorker.on("StopRecording", async (msg) => {
    recorder.stop();
  });
};

export const waitForNetworkIdle = (page: Page) => {
  page.on("request", onRequestStarted);
  page.on("requestfinished", onRequestFinished);
  page.on("requestfailed", onRequestFinished);

  let inflight = 0;
  let fulfill: (val?: unknown) => void;
  let promise = new Promise((x) => (fulfill = x));
  return promise;

  function done() {
    page.removeListener("request", onRequestStarted);
    page.removeListener("requestfinished", onRequestFinished);
    page.removeListener("requestfailed", onRequestFinished);
    fulfill();
  }

  function onRequestStarted() {
    ++inflight;
  }

  function onRequestFinished() {
    --inflight;
    if (inflight === 0) done();
  }
};

/** Scrape the text content of a selector */
export const scrapeInnerText = (page: Page) => async (selector: string) =>
  page.evaluate((e) => e?.textContent, await page.waitForSelector(selector));
