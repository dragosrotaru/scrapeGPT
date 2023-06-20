import dotenv from "dotenv";
import { Configuration, OpenAIApi } from "openai";
import { JSONType } from "./json/jsonTypes";
import { timeit } from "./util";

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

const extractFirstCodeBlock = (response: string, language: string[]) => {
    for (const lang of language) {
        const code = matchRegex(codeBlockRegex(lang), response);
        if (code) {
            return code;
        }
    }
    return null;
};

const requestGPT = (system: string) => async (prompt: string) => {
    const {
        result: { data, status, statusText },
        time,
    } = await await timeit(() =>
        openai.createChatCompletion({
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
        })
    );
    const content = data.choices[0]?.message?.content;
    return { content, data, status, statusText, time };
};

const requestCode =
    (language: string[], system: string) => async (prompt: string) => {
        const response = await requestGPT(system)(prompt);
        const code = response.content
            ? extractFirstCodeBlock(response.content, language)
            : null;
        return {
            ...response,
            code,
            parameters: {
                sysPrompt: system,
                sysPromptLength: system.length,
                language,
                prompt,
                promptLength: prompt.length,
            },
        };
    };

// TODO measure system prompt length and add it to metrics

export const requestJavascript = async (prompt: string) => {
    const systemPrompt =
        "return only correct javascript, do not include comments, do not leave anything to be filled in by the user";
    return requestCode(["javascript", "js"], systemPrompt)(prompt);
};

export const requestJSON = async (prompt: string) => {
    const systemPrompt =
        "return only a valid json object inside a ```json <json_code> ``` code block and no prose";
    const result = await requestCode(["json"], systemPrompt)(prompt);
    return {
        ...result,
        code: result.code ? (JSON.parse(result.code) as JSONType) : null,
    };
};
