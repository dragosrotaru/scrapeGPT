import puppeteer from "puppeteer";

const url = "https://lsa.memberpro.net/main/body.cfm";
const options = {
  lastName: "",
  firstName: "John",
  practicingStatus: "Practicing",
  practisingStatus: "",
  city: "Calgary",
  firmName: "",
  gender: "",
  language: "",
  practiceArea: "",
};

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });

    async function fillFormAndSubmit(inputs) {
      await page.type("#person_nm", inputs.lastName);
      await page.type("#first_nm", inputs.firstName);
      await page.select("#status-select", inputs.practisingStatus);
      await page.select("#city-select", inputs.city);
      await page.type("#location_nm", inputs.firmName);
      await page.select("#gender-select", inputs.gender);
      await page.select("#language-select", inputs.languageSpoken);
      await page.select("#practice-areas-select", inputs.practiceAreas);
      await page.click('input[name="LSR_in"]');
      await page.click('input[name="mode"]');
    }

    await fillFormAndSubmit(options);
    console.log("success");
  } catch (error) {
    console.error(error);
  }
})();
