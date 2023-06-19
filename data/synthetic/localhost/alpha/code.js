const puppeteer = require("puppeteer");

(async () => {
    try {
        const url = "http://localhost";
        const params = {
            type: "house",
            city: "New York",
            state: "NY",
            zip: "10001",
            bedrooms: "3",
            maxPrice: "500000",
            minPrice: "200000",
        };
        const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();
        page.setViewport({ width: 1400, height: 1000 });
        page.setUserAgent(
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome"
        );
        await page.goto(url, { waitUntil: "networkidle2" });

        const events = {
            pageChanges: [],
            formSubmissions: [],
            xhrRequests: [],
        };

        await page.setRequestInterception(true);

        page.on("framenavigated", (frame) => {
            events.pageChanges.push({
                url: frame.url(),
                status: frame._navigationResponse
                    ? frame._navigationResponse.status()
                    : null,
            });
        });

        page.on("request", (interceptedRequest) => {
            if (
                interceptedRequest._method === "POST" &&
                interceptedRequest._postData
            ) {
                events.formSubmissions.push({
                    url: interceptedRequest.url(),
                    postData: interceptedRequest._postData,
                    status: interceptedRequest._response
                        ? interceptedRequest._response.status()
                        : null,
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
            async function fillFormAndSubmit(inputs) {
                if (inputs.type) {
                    await page.select("#type", inputs.type);
                }
                if (inputs.city) {
                    await page.type("#city", inputs.city);
                }
                if (inputs.state) {
                    await page.type("#state", inputs.state);
                }
                if (inputs.zip) {
                    await page.type("#zip", inputs.zip);
                }
                if (inputs.bedrooms) {
                    await page.type("#bedrooms", inputs.bedrooms);
                }
                if (inputs.maxPrice) {
                    await page.type("#maxPrice", inputs.maxPrice);
                }
                if (inputs.minPrice) {
                    await page.type("#minPrice", inputs.minPrice);
                }
                await page.click('input[type="submit"]');
            }

            await fillFormAndSubmit(params);
        } catch (error) {
            return { events, innerError: error.message };
        }

        await Promise.race([
            page.waitForNetworkIdle({ waitUntil: "networkidle0" }),
            page.waitForTimeout(5000),
        ]);
        const newUrl = page.url();

        browser.close();

        return { events, url: newUrl };
    } catch (error) {
        return { outerError: error.message };
    }
})();
