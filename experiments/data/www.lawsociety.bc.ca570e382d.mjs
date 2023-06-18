import puppeteer from "puppeteer";

    (async () => {
        try {
            const url = "https://www.lawsociety.bc.ca/lsbc/apps/lkup/mbr-search.cfm";
            const options = {
  "txt_search_type": "name",
  "txt_last_nm": "Smith",
  "txt_given_nm": "John",
  "txt_city": "New York"
};
            const browser = await puppeteer.launch({ headless: false });
            const page = await browser.newPage();
            page.setViewport({ width: 1400, height: 1000 });
            page.setUserAgent("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome");
            await page.goto(url, { waitUntil: "networkidle2" });
            
async function fillFormAndSubmit(inputs) {
  if (inputs.txt_search_type) {
    await page.select('select#txt_search_type', inputs.txt_search_type);
  }
  if (inputs.txt_last_nm) {
    await page.type('input[name="txt_last_nm"]', inputs.txt_last_nm);
  }
  if (inputs.txt_given_nm) {
    await page.type('input[name="txt_given_nm"]', inputs.txt_given_nm);
  }
  if (inputs.txt_city) {
    await page.type('input[name="txt_city"]', inputs.txt_city);
  }
  await Promise.all([
    page.waitForNavigation(),
    page.click('input[name="member_search"]')
  ]);
}

            await fillFormAndSubmit(options);
            return "success"
        } catch (error) {
            return error;
        }
    })();
