import puppeteer from "puppeteer";

// TODO change form to generic name
const wrapMethod = (code: string) => {
    return `
    const puppeteer = require("puppeteer");
    
    module.exports.default = async (page, url, params) => {
        ${code}
        main(page, url, params);
    });
`;
};

type Events = {
    pageChanges: { url: string }[];
    formSubmissions: {
        url: string;
        postData: string | undefined;
        status: number | null | undefined;
    }[];
    xhrRequests: { url: string; status: number }[];
};

export default async (url: string, code: string, params: unknown) => {
    try {
        const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();
        page.setViewport({ width: 1400, height: 1000 });
        page.setUserAgent(
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome"
        );
        await page.goto(url, { waitUntil: "networkidle2" });

        const events: Events = {
            pageChanges: [],
            formSubmissions: [],
            xhrRequests: [],
        };

        await page.setRequestInterception(true);

        page.on("framenavigated", (frame) => {
            events.pageChanges.push({
                url: frame.url(),
            });
        });

        page.on("request", (interceptedRequest) => {
            if (interceptedRequest.method() === "POST") {
                events.formSubmissions.push({
                    url: interceptedRequest.url(),
                    postData: interceptedRequest.postData(),
                    status: interceptedRequest.response()?.status(),
                });
            }
            interceptedRequest.continue();
        });

        page.on("response", (response) => {
            const request = response.request();
            if (request.resourceType() === "xhr") {
                events.xhrRequests.push({
                    url: request.url(),
                    status: response.status(),
                });
            }
        });

        try {
            const fillFormAndSubmit = await eval(wrapMethod(code));
            await fillFormAndSubmit(page, url, params);
        } catch (error) {
            return { result: { events }, error: (error as Error).message };
        }

        await page.waitForNetworkIdle({ idleTime: 500, timeout: 5000 });

        browser.close();

        return { result: { events } };
    } catch (error) {
        return { error: (error as Error).message };
    }
};
