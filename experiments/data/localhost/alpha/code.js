
const puppeteer = require("puppeteer");
    
(async () => {
    try {
        const url = "http://localhost";
        const params = {
            "type": "apartment",
            "city": "New York",
            "state": "NY",
            "zip": "10001",
            "bedrooms": "2",
            "maxPrice": "3000",
            "minPrice": "2000"
        };
        const browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();
        page.setViewport({ width: 1400, height: 1000 });
        page.setUserAgent("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome");
        await page.goto(url, { waitUntil: "networkidle2" });
            
        async function fillFormAndSubmit(inputs) {
            if (inputs.type) {
                await page.select('#type', inputs.type);
            }
            if (inputs.city) {
                await page.type('#city', inputs.city);
            }
            if (inputs.state) {
                await page.type('#state', inputs.state);
            }
            if (inputs.zip) {
                await page.type('#zip', inputs.zip);
            }
            if (inputs.bedrooms) {
                await page.type('#bedrooms', inputs.bedrooms);
            }
            if (inputs.maxPrice) {
                await page.type('#maxPrice', inputs.maxPrice);
            }
            if (inputs.minPrice) {
                await page.type('#minPrice', inputs.minPrice);
            }
            await page.click('input[type="submit"]');
        }

        await fillFormAndSubmit(params);
        return "success";
    } catch (error) {
        return error;
    }
})();
