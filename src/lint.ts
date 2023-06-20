import { ESLint } from "eslint";
import prettier from "prettier";

export const eslint = new ESLint({
    fix: true,
    overrideConfig: {
        rules: {},
    },
});

export const lintAndFormat = async (input: string) => {
    const lintResults = await eslint.lintText(input);
    const linted = lintResults[0].output || lintResults[0].source || input;
    try {
        const formatted = prettier.format(linted, {
            tabWidth: 4,
            parser: "babel",
        });
        return { code: formatted, lint: lintResults, formatted: true };
    } catch (error) {
        console.log("formatting failed: ", (error as Error).message);
        return {
            code: linted,
            lint: lintResults,
            formatted: false,
        };
    }
};
