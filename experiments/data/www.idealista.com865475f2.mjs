
    (async () => {
        try {
            const browser = await puppeteer.launch({ headless: false });
            const page = await browser.newPage();
            await page.goto(url, { waitUntil: "networkidle2" });
            
async function fillFormAndSubmit(inputs) {
  await page.evaluate(inputs => {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/submit';
    
    Object.entries(inputs).forEach(([name, value]) => {
      const input = document.createElement('input');
      input.type = 'text';
      input.name = name;
      input.value = value;
      form.appendChild(input);
    });
    
    document.body.appendChild(form);
    
    form.submit();
  }, inputs);
  
  await page.waitForNavigation();
}

            await fillFormAndSubmit(options);
            return "success"
        } catch (error) {
            return error;
        }
    })();
