import puppeteer from "puppeteer";

(async () => {
  try {
    const url = "https://www.hostelworld.com";
    const options = {
      destination: "Paris",
      checkIn: "2022-05-01",
      checkOut: "2022-05-07",
      guests: "2",
    };
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    page.setViewport({ width: 1400, height: 1000 });
    page.setUserAgent(
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome"
    );
    await page.goto(url, { waitUntil: "networkidle2" });

    async function fillFormAndSubmit(inputs) {
      await page.type("input", inputs?.destination);
      await page.type("input", inputs?.checkIn);
      await page.type("input", inputs?.checkOut);
      await page.type("input", inputs?.guests);
      await Promise.all([page.waitForNavigation(), page.click("button")]);
    }

    await fillFormAndSubmit(options);
    return "success";
  } catch (error) {
    return error;
  }
})();
