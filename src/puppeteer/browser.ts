import puppeteer, { Browser } from "puppeteer";
import params from "../params.json";

export const getBrowser = async () => {
    return puppeteer.launch({
        userDataDir: params.puppeteer.userDataDir,
        headless: params.puppeteer.headless,
        // debuggingPort: 9222,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
};

export const getNewPage = (browser: Browser) => async () => {
    const page = await browser.newPage();
    page.setViewport(params.puppeteer.viewport);
    page.setUserAgent(params.puppeteer.userAgent);
    return page;
};
