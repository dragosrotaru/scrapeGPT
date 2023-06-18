import puppeteer from "puppeteer";

async function context() {
  try {
    const url = "https://lsa.memberpro.net/main/body.cfm";
    const browser = await puppeteer.launch({ headless: false });
    async function search(
      lastName,
      firstName,
      memberStatus,
      city,
      firmName,
      gender,
      language
    ) {
      const page = await browser.newPage();

      await page.goto(url);

      // Fill in the search form
      await page.type("#person_nm", lastName);
      await page.type("#first_nm", firstName);
      await page.select("#status-select", memberStatus);
      await page.select("#city-select", city);
      await page.type("#location_nm", firmName);
      await page.select("#gender-select", gender);
      await page.select("#language-select", language);

      // Submit the form
      await Promise.all([
        page.waitForNavigation(), // Wait for navigation to complete
        page.evaluate(() => {
          document.querySelector('form[name="Next"]').submit(); // Submit the form
        }),
      ]);
    }
    search("Doe", "John", "PRAC", "Calgary", "", "", "");
  } catch (error) {
    console.log(error);
  }
}
