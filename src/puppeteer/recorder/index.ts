import path from "path";
import puppeteer from "puppeteer";
import { Recorder } from "./recorder";

/** opens a web browser and records activity. works with a web extension (not built)
 * can be repurposed to work standalone or in combination
 *
 */
export const initialize = async (config: any) => {
    const pathToExtension = path.join(__dirname, "chrome_extension");
    const browser = await puppeteer.launch({
        userDataDir: "./user",
        headless: config.headless,
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
            t.type() === "service_worker" &&
            t.url().includes("chrome-extension://")
    );
    const extWorker = await extBackgroundTarget.worker();
    if (!extWorker) throw new Error("Could not find extension service worker");

    const page = await browser.newPage();
    const recorder = new Recorder(page);

    // Listen for StartRecording Event from Extension
    extWorker.on("StartRecording", async () => {
        recorder.start();
    });

    // Listen for StopRecording Event from Extension
    extWorker.on("StopRecording", async () => {
        recorder.stop();
    });
};
