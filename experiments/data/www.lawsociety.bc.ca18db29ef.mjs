import puppeteer from "puppeteer";

    (async () => {
        try {
            const url = "https://www.lawsociety.bc.ca/lsbc/apps/lkup/mbr-search.cfm";
            const options = {
  "txt_search_type": "Individual",
  "txt_last_nm": "Smith",
  "txt_given_nm": "John",
  "txt_city": "Vancouver"
};
            const browser = await puppeteer.launch({ headless: false });
            const page = await browser.newPage();
            page.setViewport({ width: 1400, height: 1000 });
            page.setUserAgent("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome");
            await page.goto(url, { waitUntil: "networkidle2" });
            
async function fillFormAndSubmit(inputs) {
  if(inputs.txt_search_type) {
    const selectElem = await page.$('select#txt_search_type');
    await selectElem.select(inputs.txt_search_type);
  }
  
  if(inputs.txt_last_nm) {
    const lastNameInput = await page.$('input[name="txt_last_nm"]');
    await lastNameInput.type(inputs.txt_last_nm);
  }
  
  if(inputs.txt_given_nm) {
    const firstNameInput = await page.$('input[name="txt_given_nm"]');
    await firstNameInput.type(inputs.txt_given_nm);
  }
  
  if(inputs.txt_city) {
    const cityInput = await page.$('input[name="txt_city"]');
    await cityInput.type(inputs.txt_city);
  }
  
  const searchButton = await page.$('input[name="member_search"]');
  await searchButton.click();
}

            await fillFormAndSubmit(options);
            return "success"
        } catch (error) {
            return error;
        }
    })();
