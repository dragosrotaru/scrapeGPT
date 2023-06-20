import { requestJavascript } from "../gpt";
import { lintAndFormat } from "../lint";
import params from "../params.json";

const outputSpecList = () => {
    let output = "";
    for (const item of params.formcode.prompt.outputSpec) {
        if (params.formcode.prompt.usesListDelimitation) {
            output += `- ${item}\n`;
        } else {
            output += `${item}\n`;
        }
    }
    return output;
};

const formCodePrompt = (html: string) => {
    if (params.formcode.prompt.includesHTMLBlockMarkup) {
        return `
        write a function which:
        ${outputSpecList()}
        
        \`\`\`html
        ${html}
        \`\`\`
    `;
    } else {
        return `
        write a function which:
        ${outputSpecList()}
        
        ${html}
    `;
    }
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
