import { requestJavascript } from "../gpt";
import { lintAndFormat } from "../lint";

const formCodePrompt = (html: string) => {
    return `
    write a function which:
    - accepts a puppeteer page as the first parameter
    - accepts all the inputs accepted on the webpage which follows below as the second parameter (an object with camelCase keys)
    - checks if each parameter exists before attempting to fill it in
    - correctly fills in every input
    - triggers a submission
    - does nothing else
    
    html\`\`\`
    ${html}
    \`\`\`
  `;
};

export const formcode = async (html: string) => {
    const emptyPrompt = formCodePrompt("");
    const prompt = formCodePrompt(html);
    try {
        const result = await requestJavascript(prompt);

        const { code, lint } = result.code
            ? await lintAndFormat(result.code)
            : { code: undefined, lint: [] };

        return {
            metrics: {
                ...result.parameters,
                language: result.language,
                status: result.status,
                statusText: result.statusText,
                emptyPromptLength: emptyPrompt.length,
                emptyPrompt: emptyPrompt,
                model: result.data.model,
                object: result.data.object,
                usage: result.data.usage,
            },
            result: {
                created: result.data.created,
                id: result.data.id,
                output: result.data.choices,
                prompt,
            },
            code,
            lint,
        };
    } catch (error) {
        return {
            metrics: {
                emptyPromptLength: emptyPrompt.length,
                emptyPrompt: emptyPrompt,
                statusText: (error as Error).name,
            },
            result: {
                prompt,
            },
            error: (error as Error).toString(),
        };
    }
};
