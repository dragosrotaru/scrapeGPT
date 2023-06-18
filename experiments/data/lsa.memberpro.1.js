import puppeteer from "puppeteer";

(async () => {
  try {
    const url = "https://lsa.memberpro.net/main/body.cfm";
    const browser = await puppeteer.launch({ headless: false });
    async function search(
      lastName,
      firstName,
      practicingStatus,
      city,
      firmName,
      gender,
      language,
      practiceAreas
    ) {
      await page.type("#person_nm", lastName);
      await page.type("#first_nm", firstName);
      await page.select("#status-select", practicingStatus);
      await page.select("#city-select", city);
      await page.type("#location_nm", firmName);
      await page.select("#gender-select", gender);
      await page.select("#language-select", language);
      await page.select("#practice-areas-select", practiceAreas);
      await Promise.all([
        page.evaluate(() => {
          document.querySelector('input[name="LSR_in"]').checked = false;
        }),
        page.click('a[href="javascript:nextSearch()"]'),
      ]);
    }

    search("Doe", "John", "PRAC", "Calgary", "", "", "");
    console.log("success");
  } catch (error) {
    console.error(error);
  }
})();
