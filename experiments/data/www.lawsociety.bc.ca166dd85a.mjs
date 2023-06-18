import puppeteer from "puppeteer";

(async () => {
  try {
    const url = "https://www.lawsociety.bc.ca/lsbc/apps/lkup/mbr-search.cfm";
    const options = {
      lastName: "Johnson",
    };
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    page.setUserAgent(
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome"
    );
    await page.goto(url, { waitUntil: "networkidle2" });

    async function fillFormAndSubmit(inputs) {
      const { txt_search_type, txt_last_nm, txt_given_nm, txt_city } = inputs;

      if (txt_search_type) {
        await page.select("#txt_search_type", txt_search_type);
      }
      if (txt_last_nm) {
        await page.type('input[name="txt_last_nm"]', txt_last_nm);
      }
      if (txt_given_nm) {
        await page.type('input[name="txt_given_nm"]', txt_given_nm);
      }
      if (txt_city) {
        await page.type('input[name="txt_city"]', txt_city);
      }

      await page.click('input[type="submit"]');
    }

    await fillFormAndSubmit(options);
    return "success";
  } catch (error) {
    return error;
  }
})();
