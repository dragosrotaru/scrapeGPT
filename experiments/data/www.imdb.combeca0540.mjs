import puppeteer from "puppeteer";

(async () => {
  try {
    const url = "https://www.imdb.com/";
    const options = {
      name: "John Doe",
      email: "johndoe@example.com",
      message: "I watched a great movie last night!",
    };
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    page.setViewport({ width: 1400, height: 1000 });
    page.setUserAgent(
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome"
    );
    await page.goto(url, { waitUntil: "networkidle2" });

    async function fillFormAndSubmit(inputs) {
      if (inputs.name) await page.type('input[name="name"]', inputs.name);
      if (inputs.email) await page.type('input[name="email"]', inputs.email);
      if (inputs.message)
        await page.type('input[name="message"]', inputs.message);
      await page.click('input[type="submit"]');
    }

    await fillFormAndSubmit(options);
    return "success";
  } catch (error) {
    return error;
  }
})();
