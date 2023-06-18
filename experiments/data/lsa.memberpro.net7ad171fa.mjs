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
      await Promise.all(
        Object.entries(inputs).map(([name, value]) =>
          page.$eval(
            `input[name="${name}"]`,
            (input, value) => (input.value = value),
            value
          )
        )
      );
      await page.evaluate(() =>
        document.querySelector('form[name="Next"]').submit()
      );
    }

    await fillFormAndSubmit(options);
    console.log("success");
  } catch (error) {
    console.error(error);
  }
})();
