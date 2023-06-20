import { requestJSON, requestJavascript } from "../gpt";
import { eslint } from "../lint";

const formFillPrompt = (html: string) => {
    return `
    write an async javascript puppeteer function called "main" which:
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

const formPropsPrompt = (
    code: string,
    url: string,
    title?: string,
    description?: string
) => {
    return `
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
};

export const generateFormCode = async (html: string) => {
    const emptyPrompt = formFillPrompt("");
    const prompt = formFillPrompt(html);
    const result = await requestJavascript(prompt);

    let linted = "";
    let lint = null;
    if (result.code) {
        lint = await eslint.lintText(result.code);
        // TODO fix prettier
        linted = lint[0].output as string; // prettier.format(lintResults[0].output as string, {tabWidth: 4, parser: "babel"});
    }

    return {
        metrics: {
            ...result.parameters,
            status: result.status,
            statusText: result.statusText,
            time: result.time,
            emptyPromptLength: emptyPrompt.length,
            emptyPrompt: emptyPrompt,
        },
        response: result.data,
        code: linted,
        lint,
    };
};

export const generateFormProps = async (
    code: string,
    meta: { url: string; title?: string; description?: string }
) => {
    const emptyPrompt = formPropsPrompt("", "");
    const prompt = formPropsPrompt(
        code,
        meta.url,
        meta.title,
        meta.description
    );
    const result = await requestJSON(prompt);

    return {
        metrics: {
            ...result.parameters,
            status: result.status,
            statusText: result.statusText,
            time: result.time,
            emptyPromptLength: emptyPrompt.length,
            emptyPrompt: emptyPrompt,
        },
        response: result.data,
        props: result.code,
    };
};
