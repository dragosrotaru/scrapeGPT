import { requestJSON } from "../gpt";

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
    
        return an example json object containing realistic data for the parameter of the function below.
    
        \`\`\`javascript
        ${code}
        \`\`\`
      `;
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
                usage: result.data.usage,
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
