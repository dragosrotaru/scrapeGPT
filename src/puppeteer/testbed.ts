import puppeteer from "puppeteer";

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
    const headless = false;
    const idleTime = 500;
    const timeout = 5000;
    const userAgent =
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome";
    const viewport = {
        width: 1400,
        height: 1000,
    };

    const events: Events = {
        pageChanges: [],
        formSubmissions: [],
        xhrRequests: [],
    };

    const getMetrics = (events: Events) => {
        return {
            headless,
            idleTime,
            timeout,
            userAgent,
            viewport,
            pageChanges: events.pageChanges.length,
            formSubmissions: events.formSubmissions.length,
            xhrRequests: events.xhrRequests.length,
        };
    };

    try {
        const browser = await puppeteer.launch({ headless });
        const page = await browser.newPage();
        page.setViewport(viewport);
        page.setUserAgent(userAgent);
        await page.goto(url, { waitUntil: "networkidle2" });

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
            await eval(code)(page, params);
        } catch (error) {
            return {
                result: { events },
                error: (error as Error).toString(),
                metrics: {
                    ...getMetrics(events),
                    completed: false,
                    error: "inner",
                },
            };
        }

        await page.waitForNetworkIdle({ idleTime, timeout });

        browser.close();

        return {
            result: { events },
            metrics: {
                ...getMetrics(events),
                completed: true,
            },
        };
    } catch (error) {
        return {
            error: (error as Error).toString(),
            metrics: {
                ...getMetrics(events),
                completed: false,
                error: "outer",
            },
        };
    }
};
