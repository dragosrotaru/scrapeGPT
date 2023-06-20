import { Page } from "puppeteer";

/** simple method to retrieve html from a webpage */
export const htmlretrieve = async (url: string, page: Page) => {
    try {
        await page.goto(url);
        const original = await page.content();
        const title = await page.title();
        let description = "";
        try {
            description = await page.$eval(
                'meta[name="description"]',
                (element) => element.getAttribute("content") || ""
            );
        } catch (err) {
            console.log("no description found");
        }
        return {
            original,
            meta: { url, title, description },
            metrics: { completed: true },
        };
    } catch (error) {
        return {
            error: (error as Error).toString(),
            metrics: { completed: false },
        };
    }
};
