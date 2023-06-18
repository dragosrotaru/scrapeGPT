import dotenv from "dotenv";
import { ESLint } from "eslint";
import { Configuration, OpenAIApi } from "openai";

dotenv.config();
if (!process.env["OPENAI"]) {
    throw new Error("OPENAI environment variable not set");
}
const openai = new OpenAIApi(
    new Configuration({
        apiKey: process.env["OPENAI"],
    })
);

const codeBlockRegex = (language: string) =>
    new RegExp(`\`\`\`${language}([\\s\\S]+?)\`\`\``);
const matchRegex = (regex: RegExp, string: string) => {
    const match = string.match(regex);
    if (match && match.length > 1) {
        // match[0] includes the code block itsel
        return match[1];
    }
    return null;
};

const requestGPT = (system: string) => async (prompt: string) => {
    const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo-16k-0613",
        messages: [
            {
                role: "system",
                content: system,
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
    const prompt = `
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
    const res = await requestGPT(
        "return only code that is correct, do not include any comments and do not leave anything to be filled in by the user"
    )(prompt);
    const content = res.content ? extractCodeFromResponse(res.content) : null;
    return { content, data: res.data };
};

const extractCodeFromResponse = (response: string) => {
    return (
        matchRegex(codeBlockRegex("javascript"), response) ||
        matchRegex(codeBlockRegex("js"), response) ||
        response
    );
};

const requestJSON = async (
    code: string,
    url: string,
    title?: string,
    description?: string
) => {
    const prompt = `
    below is javascript code that fills in a web form and submits it.
    It is for a webpage with the following characteristics:
    - url: ${url}
    ${title ? '- title: "' + title + '"\n' : ""}
    ${description ? '- description: "' + description + '"\n' : ""}

    return an example json object containing realistic data for the parameter of the fillFormAndSubmit function below.

    \`\`\`javascript
    ${code}
    \`\`\`
  `;
    const res = await requestGPT(
        "return only a valid json object inside a ```json <json_code> ``` code block and no prose"
    )(prompt);
    const content = res.content ? extractJSONFromResponse(res.content) : null;
    return { content, data: res.data };
};

const extractJSONFromResponse = (response: string) => {
    return JSON.parse(matchRegex(codeBlockRegex("json"), response) || response);
};

const wrapCode = (url: string, code: string, params: unknown) => {
    return `
    const puppeteer = require("puppeteer");
    
    (async () => {
        try {
            const url = "${url}";
            const params = ${JSON.stringify(params, null, 2)};
            const browser = await puppeteer.launch({ headless: false });
            const page = await browser.newPage();
            page.setViewport({ width: 1400, height: 1000 });
            page.setUserAgent("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome");
            await page.goto(url, { waitUntil: "networkidle2" });
            ${code}
            await fillFormAndSubmit(params);
            return "success"
        } catch (error) {
            return error;
        }
    })();
`;
};

export const generate = async (
    url: string,
    html: string,
    meta: any,
    params?: unknown
) => {
    // Generate Script
    console.log("generating code");
    const start = process.hrtime();
    const { content: code, data: codeData } = await requestCode(html);
    const end = process.hrtime(start);
    const time = end[0];
    console.log("code generation time:", time, "seconds");
    meta.codeGenerationTime = time;

    if (!code) {
        return { codeError: codeData.choices, meta };
    } else {
        console.log("code generated successfully");
    }

    console.log("generating params");
    // Generate Params
    if (!params) {
        const start = process.hrtime();
        const { content: json, data: jsonData } = await requestJSON(
            code,
            url,
            meta.title,
            meta.description
        );
        const end = process.hrtime(start);
        const time = end[0];
        console.log("params generation time:", time, "seconds");
        meta.paramsGenerationTime = time;
        if (!json) {
            return { code, paramsError: jsonData.choices, meta };
        }
        params = json;
    } else {
        console.log("params generated successfully");
    }

    console.log("linting code");
    const eslint = new ESLint({
        fix: true,
        overrideConfig: {
            rules: {
                "no-inner-declarations": "off",
                "@typescript-eslint/no-var-requires": "off",
            },
        },
    });
    const lintResults = await eslint.lintText(wrapCode(url, code, params));
    const wrapped = lintResults[0].output as string;

    return { code, params, wrapped, lint: lintResults, meta };
};
