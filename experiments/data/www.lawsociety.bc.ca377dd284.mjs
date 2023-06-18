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
      await page.waitForSelector('input[name="txt_last_nm"]');
      await page.type('input[name="txt_last_nm"]', inputs.lastName);
      await page.waitForSelector('input[name="txt_given_nm"]');
      await page.type('input[name="txt_given_nm"]', inputs.firstName);
      await page.waitForSelector('input[name="txt_city"]');
      await page.type('input[name="txt_city"]', inputs.city);
      await page.click('input[name="member_search"]');
      await page.waitForNavigation();
    }
    await fillFormAndSubmit(options);
    return "success";
  } catch (error) {
    return error;
  }
})();
