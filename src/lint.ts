import { ESLint } from "eslint";

export const eslint = new ESLint({
    fix: true,
    overrideConfig: {
        rules: {
            "no-inner-declarations": "off",
            "@typescript-eslint/no-var-requires": "off",
        },
    },
});
