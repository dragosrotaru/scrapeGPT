import { Page } from "puppeteer";
import params from "../params.json";

type Events = {
    pageChanges: { url: string }[];
    formSubmissions: {
        url: string;
        postData: string | undefined;
        status: number | null | undefined;
    }[];
    xhrRequests: { url: string; status: number }[];
};

export default async (
    url: string,
    code: string,
    props: unknown,
    page: Page
) => {
    const events: Events = {
        pageChanges: [],
        formSubmissions: [],
        xhrRequests: [],
    };

    const getMetrics = (events: Events) => {
        return {
            pageChanges: events.pageChanges.length,
            formSubmissions: events.formSubmissions.length,
            xhrRequests: events.xhrRequests.length,
        };
    };

    try {
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
            await eval(code)(page, props);
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

        await page.waitForNetworkIdle({
            idleTime: params.formfill.waitForIdleTime,
            timeout: params.formfill.waitForTimeout,
        });

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
