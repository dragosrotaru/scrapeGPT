import puppeteer, { Browser } from "puppeteer";
import params from "../params.json";

export const getBrowser = async () => {
    try {
        return await puppeteer.connect({ browserURL: "http://localhost:9222" });
    } catch (e) {
        console.log("browser not found, launching a new one");
        return await puppeteer.launch({
            userDataDir: params.puppeteer.userDataDir,
            headless: params.puppeteer.headless,
            debuggingPort: 9222,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });
    }
};

export const getNewPage = (browser: Browser) => async () => {
    const page = await browser.newPage();
    page.setViewport(params.puppeteer.viewport);
    page.setUserAgent(params.puppeteer.userAgent);
    return page;
};
