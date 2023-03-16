import path from "path";
import puppeteer, { HTTPResponse, Page } from "puppeteer";

// listen for start and stop recording
class Recorder {
  recordingInProgress = false;
  private page: Page;
  responses: { res: HTTPResponse; time: Date; url: string }[] = [];
  html: { content: string; time: Date; url: string }[] = [];

  networkResponseHandler = async (res: HTTPResponse) => {
    this.responses.push({ res, time: new Date(), url: this.page.url() });
  };

  htmlMutationHandler = async () => {
    this.html.push({
      content: await this.page.content(),
      time: new Date(),
      url: this.page.url(),
    });
  };

  constructor(page: Page) {
    this.page = page;
  }

  async start() {
    this.recordingInProgress = true;

    // listen for network activity
    this.page.on("response", this.networkResponseHandler);

    // listen for page redirects, refresh or navigation
    // TODO make sure navigation events are stored
    // TODO make sure that this mutation handler persists even when the page/site changes

    // listen for html changes
    await this.page.exposeFunction(
      "htmlMutationHandler",
      this.htmlMutationHandler
    );

    await this.page.evaluate(() => {
      const target = document.querySelector("body");
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === "childList") {
            // @ts-ignore
            puppeteerLogMutation();
          }
        }
      });
      if (target) {
        observer.observe(target, { childList: true });
      }
    });
  }

  stop() {
    this.recordingInProgress = false;

    // TODO stop listening for html mutations

    this.page.off("response", this.networkResponseHandler);
  }

  processData() {
    // filter all requests that are not JSON, HTML, CSV, XML, text or GRPC
    // score each request based on some heuristics:
    /*
      - is JSON
      - has "api", "graphql", "aws" in the url
      - its a POST request
      - its the same domain as the root url
      - request had params or body
      - request had security headers
      - there are multiple requests with the same url except a different path param
      - there are multiple requests with the same url except a different query param
    */
    // anything that is JSON, we can assume is an API, so we can just generate an SDK for it
    // anything that is HTML, we can assume is a website, so we can just generate a scraper for it
    // anything that is CSV, we can assume is a spreadsheet, so we can just generate a scraper for it
    // anything that is XML, we can assume is a website, so we can just generate a scraper for it
    // present the results to the user and let them choose what they want to do
    // save all raw data and the results of the analysis
  }
}

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

export const scrapeInnerTextHOF = (page: Page) => async (selector: string) =>
  page.evaluate((e) => e?.textContent, await page.waitForSelector(selector));
