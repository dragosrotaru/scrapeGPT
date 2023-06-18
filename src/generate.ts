import { exec } from "child_process";
import { randomUUID } from "crypto";
import fs from "fs";
import { Configuration, OpenAIApi } from "openai";
import util from "util";
import { processHtml } from "./compress";
import { retrieve } from "./retrieve";

const puppeteer = require("puppeteer");

/* 
TODO

- get gpt to fix its own errors
- fine tune how gpt deal with form inputs and submit buttons
- validate the code returned by gpt using ast parser
- lint the code returned by gpt


*/

export const execAsync = util.promisify(exec);

const openai = new OpenAIApi(
  new Configuration({
    apiKey:
      process.env["OPENAI"] ||
      "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",
  })
);

/* 
- triggers a form submission using page.evaluate
- is written in a clean style free of bugs.
*/
const searchPrompt = (html: string) => {
  return `
    write an async javascript puppeteer function called "fillFormAndSubmit" which:
    - accepts all the inputs accepted on this webpage as an object parameter
    - checks if parameter exists before attempting to fill it in
    - correctly fills in all the inputs
    - leaves the results page open
    - assume a "page" variable is in scope and open to the page already (no declaration necessary)

    html\`\`\`
    ${html}
    \`\`\`
  `;
};

const jsonPrompt = (code: string) => {
  return `
    return an example json object with realistic data for Hostel world for this fillFormAndSubmit function parameter: 
    ${code}
  `;
};

const extractCodeFromResponse = (response: string) => {
  /* 
    ```javascript
        <some code>
    ```
     */

  const codeRegex = /```javascript([\s\S]+?)```/;
  const match = response.match(codeRegex);
  if (match && match.length > 1) {
    // first result matches including the code block
    return match[1];
  }
  const codeRegex2 = /```js([\s\S]+?)```/;
  const match2 = response.match(codeRegex2);
  if (match2 && match2.length > 1) {
    return match2[1];
  }
  return response;
};

const extractJSONFromResponse = (response: string) => {
  /* 
    ```javascript
        <some code>
    ```
     */

  const codeRegex = /```json([\s\S]+?)```/;
  const match = response.match(codeRegex);
  if (match && match.length > 1) {
    // first result matches including the code block
    return JSON.parse(match[1]);
  }
  return JSON.parse(response);
};

const requestGPT = (system: string) => async (prompt: string) => {
  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo-16k-0613",
    messages: [
      {
        role: "system",
        content:
          "return only code that is correct, do not include any comments and do not leave anything to be filled in by the user",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = response.data.choices[0]?.message?.content;
  return { content, data: response.data };
};

const requestCode = async (html: string) => {
  const res = await requestGPT(
    "return only code that is correct, do not include any comments and do not leave anything to be filled in by the user"
  )(searchPrompt(html));
  const content = res.content ? extractCodeFromResponse(res.content) : null;
  return { content, data: res.data };
};

const requestJSON = async (code: string) => {
  const res = await requestGPT("return only json and nothing else")(
    jsonPrompt(code)
  );
  const content = res.content ? extractJSONFromResponse(res.content) : null;
  return { content, data: res.data };
};

const wrapCode = (url: string, code: string, options: any) => {
  return `
    (async () => {
        try {
            const url = "${url}";
            const options = ${JSON.stringify(options, null, 2)};
            const browser = await puppeteer.launch({ headless: false });
            const page = await browser.newPage();
            page.setViewport({ width: 1400, height: 1000 });
            page.setUserAgent("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome");
            await page.goto(url, { waitUntil: "networkidle2" });
            ${code}
            await fillFormAndSubmit(options);
            return "success"
        } catch (error) {
            return error;
        }
    })();
`;
};

const generateAndExecute = async (
  fileName: string,
  url: string,
  html: string,
  options?: any
) => {
  const { content: code, data } = await requestCode(html);
  if (!code) {
    const name = fileName + "fail.json";
    console.log("failed to return code:", name);
    fs.writeFileSync(name, JSON.stringify(data.choices, null, 2));
    return;
  }

  if (!options) {
    const { content: json, data: jsonData } = await requestJSON(code);
    const jsonName = fileName + "data.json";
    fs.writeFileSync(jsonName, JSON.stringify(jsonData, null, 2));
    console.log("generated json for: ", fileName);
    console.log(JSON.stringify(json, null, 2));
    options = json;
  }

  const wrapped = wrapCode(url, code, options);
  const withImport = `import puppeteer from "puppeteer";\n${wrapped}`;
  fs.writeFileSync(fileName, withImport);
  console.log("generated code for: ", fileName);
  try {
    const result = await eval(wrapped);
    if (result === "success") {
      // TODO attempt to do the same for the results page
    }
  } catch (error) {
    return error;
  }
};

(async () => {
  if (process.argv[2] === "gen") {
    // const url = process.argv[3];
    const url = "https://www.hostelworld.com"; //"https://lsa.memberpro.net/main/body.cfm";
    const tokenizeInput = false; //process.argv[4] ? true : false;
    const html = await retrieve(url);
    const id = randomUUID().slice(0, 8);
    const hostname = new URL(url).hostname;
    const fileName = hostname + id + ".html";
    fs.writeFileSync(fileName, html);
    const processedHTML = processHtml(fileName, html, tokenizeInput);
    const codeFileName = hostname + id + ".mjs";
    const result = await generateAndExecute(codeFileName, url, processedHTML);
    console.log(result);
  }
})();
