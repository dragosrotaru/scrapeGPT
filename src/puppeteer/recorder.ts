import { HTTPResponse, Page } from "puppeteer";

/** Records network activity and DOM mutations occuring on a web page */
export class Recorder {
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
                        // @ts-expect-error - this is a function availble in evaluate scope
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
