import { requestJSON } from "../gpt";
import params from "../params.json";

const formPropsPrompt = (
    code: string,
    url: string,
    title?: string,
    description?: string
) => {
    const conf = params.formprops.prompt;
    let prompt = `
        below is javascript code that fills in a web form and submits it.
        It is for a webpage with the following characteristics:
        ${conf.includeURL && url ? '- url: "' + url + '"\n' : ""}
        ${conf.includeTitle && title ? '- title: "' + title + '"\n' : ""}
        ${
            conf.includeDescription && description
                ? '- description: "' + description + '"\n'
                : ""
        }
    
        return an example json object containing realistic data for the parameter of the function below.

      `;
    if (conf.includesCodeBlockMarkup) {
        prompt += `\`\`\`javascript
        ${code}
        \`\`\``;
    } else {
        prompt += code;
    }
    return prompt;
};

export const formprops = async (
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
    try {
        const result = await requestJSON(prompt);

        return {
            metrics: {
                ...result.parameters,
                status: result.status,
                statusText: result.statusText,
                emptyPromptLength: emptyPrompt.length,
                emptyPrompt: emptyPrompt,
                model: result.data.model,
                object: result.data.object,
                promptTokens: result.data.usage?.prompt_tokens,
                completionTokens: result.data.usage?.completion_tokens,
                totalTokens: result.data.usage?.total_tokens,
            },
            result: {
                created: result.data.created,
                id: result.data.id,
                output: result.data.choices,
                prompt,
            },
            data: result.code,
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
            error: (error as Error).message,
        };
    }
};
