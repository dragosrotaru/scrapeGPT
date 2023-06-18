import puppeteer from "puppeteer";

const url = "https://www.expats.cz/praguerealestate/search/apartments/rent";
const options = {
  advert_price_from: "200",
  advert_price_to: "20000",
  usable_area_from: "",
  usable_area_to: "",
};

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: false,
      userDataDir: "./user",
    });
    const page = await browser.newPage();
    page.setUserAgent(
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome"
    );
    page.setViewport({ width: 1400, height: 1000 });
    await page.goto(url, { waitUntil: "networkidle2" });
    async function fillFormAndSubmit(inputs) {
      await page.type(
        'input[name="filter[]"][data-input="advert_price_from"]',
        inputs.advert_price_from
      );
      await page.type(
        'input[name="filter[]"][data-input="advert_price_to"]',
        inputs.advert_price_to
      );
      await page.type(
        'input[name="filter[]"][data-input="usable_area_from"]',
        inputs.usable_area_from
      );
      await page.type(
        'input[name="filter[]"][data-input="usable_area_from"]',
        inputs.usable_area_from
      );
      await page.type(
        'input[name="filter[]"][data-input="usable_area_to"]',
        inputs.usable_area_to
      );
      await page.click(
        'input[name="filter[]"][data-filter-url="yes-furnished"]'
      );
      await page.click(
        'input[name="filter[]"][data-filter-url="new-construction"]'
      );
      await page.click('input[name="filter[]"][data-filter-url="balcony"]');
      await page.click('input[name="filter[]"][data-filter-url="elevator"]');
      // continue filling in other inputs as needed
      await page.click('input[type="submit"]');
    }
    await fillFormAndSubmit(options);
    return "success";
  } catch (error) {
    return error;
  }
})();
