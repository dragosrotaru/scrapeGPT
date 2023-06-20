import puppeteer from "puppeteer";

/** simple method to retrieve html from a webpage */
export const htmlretrieve = async (url: string) => {
    const headless = false;
    const userAgent =
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome";
    const viewport = {
        width: 1400,
        height: 1000,
    };

    try {
        const browser = await puppeteer.launch({ headless });
        const page = await browser.newPage();
        page.setUserAgent(userAgent);
        page.setViewport(viewport);
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
        await browser.close();
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
