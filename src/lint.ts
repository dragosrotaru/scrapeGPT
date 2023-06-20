import { ESLint } from "eslint";

export const eslint = new ESLint({
    fix: true,
    overrideConfig: {
        rules: {},
    },
});
