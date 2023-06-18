
    (async () => {
        try {
            const browser = await puppeteer.launch({ headless: false });
            const page = await browser.newPage();
            page.setUserAgent("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome");
            await page.goto(url, { waitUntil: "networkidle2" });
            
async function fillFormAndSubmit(inputs) {
  await page.evaluate(inputs => {
    const form = document.createElement('form');
    form.method = "POST";
    form.action = "https://example.com/submit"; // update with correct action

    for (const [name, value] of Object.entries(inputs)) {
      const input = document.createElement('input');
      input.type = "text";
      input.name = name;
      input.value = value;
      form.appendChild(input);
    }

    const submitButton = document.createElement('button');
    submitButton.type = "submit";
    submitButton.innerText = "Submit";
    form.appendChild(submitButton);

    document.body.appendChild(form);
  }, inputs);
  
  await Promise.all([
    page.waitForNavigation(),
    page.click('button[type="submit"]'),
  ]);
}

            await fillFormAndSubmit(options);
            return "success"
        } catch (error) {
            return error;
        }
    })();
