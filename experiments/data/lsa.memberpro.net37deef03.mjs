(async () => {
  try {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });

    async function fillFormAndSubmit(inputs) {
      await page.type("#person_nm", inputs.lastName);
      await page.type("#first_nm", inputs.firstName);
      await page.select("#status-select", inputs.status);
      await page.select("#city-select", inputs.city);
      await page.type("#location_nm", inputs.firmName);
      await page.select("#gender-select", inputs.gender);
      await page.select("#language-select", inputs.language);
      await page.select("#practice-areas-select", inputs.practiceArea);
      if (inputs.limitedScopeRetainer) {
        await page.click('input[name="LSR_in"]');
      }
      await page.click('input[type="submit"]');
    }

    await fillFormAndSubmit(options);
    return "success";
  } catch (error) {
    return error;
  }
})();
