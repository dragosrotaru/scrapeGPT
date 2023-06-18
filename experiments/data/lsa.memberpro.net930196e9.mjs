import puppeteer from "puppeteer";

const url = "https://lsa.memberpro.net/main/body.cfm";
const options = {
  lastName: "",
  firstName: "John",
  practicingStatus: "Practicing",
  city: "Calgary",
};

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });

    async function fillFormAndSubmit(inputs) {
      await page.focus("#person_nm");
      await page.keyboard.type(inputs.lastName);

      await page.focus("#first_nm");
      await page.keyboard.type(inputs.firstName);

      await page.$eval('form[name="Next"]', (form) => form.submit());
    }

    await fillFormAndSubmit(options);
    console.log("success");
  } catch (error) {
    console.error(error);
  }
})();
