(async () => {
  try {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });

    async function fillFormAndSubmit(inputs) {
      await page.type("#person_nm", inputs.lastName);
      await page.type("#first_nm", inputs.firstName);

      if (inputs.practisingStatus) {
        await page.select("#status-select", inputs.practisingStatus);
      }

      if (inputs.city) {
        await page.select("#city-select", inputs.city);
      }

      if (inputs.firmName) {
        await page.type("#location_nm", inputs.firmName);
      }

      if (inputs.gender) {
        await page.select("#gender-select", inputs.gender);
      }

      if (inputs.languages) {
        await page.select("#language-select", inputs.languages);
      }

      if (inputs.practiceAreas) {
        await page.select("#practice-areas-select", inputs.practiceAreas);
      }

      await Promise.all([
        page.waitForNavigation(),
        page.click('input[name="mode"][value="search"]'),
      ]);
    }

    await fillFormAndSubmit(options);
    return "success";
  } catch (error) {
    return error;
  }
})();
