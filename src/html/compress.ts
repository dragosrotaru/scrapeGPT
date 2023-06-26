import { JSDOM } from "jsdom";
import { countTokens } from "../gpt";
import { htmlcompress as compressparams } from "../params.json";

const replaceRegex = (html: string, regex: [RegExp, string][]) => {
    for (const [r, s] of regex) {
        html = html.replace(r, s);
    }
    return html;
};

type CompressParams = {
    tokenizeInput: boolean;

    focusOnFirstTag?: string | null;

    removeTags?:
        | string[]
        | null /* Options: HEAD SCRIPT STYLE NOSCRIPT BR HEADER FOOTER NAV */;

    removeEmpty?: boolean | null;
    removeEmptyTagExclusion?: string[] | null /* Options: inputs */;
    textMaxLength?: number | null;
    textLengthExclusion?: string[] | null /* Options: type */;

    removeStructural?: string[] | null; // Options: div section article span

    removeAttributeTagExclusion?: string[] | null /* Options: inputs */;
    removeAttributes?: string[] | "all" | null /* Options: class all */;
    removeAttributeExclusion?: string[] | null /* Options: type */;
    attributeMaxLength?: number | null;
};

export const htmlcompress = (original: string): any => {
    try {
        const params = compressparams as CompressParams;
        const tags = params.removeTags ? new Set(params.removeTags) : null;

        const focusOnFirstTag = params.focusOnFirstTag;

        const removeStructural = params.removeStructural
            ? new Set(params.removeStructural)
            : null;

        const removeEmpty = params.removeEmpty;
        const removeEmptyTagExclusion = params.removeEmptyTagExclusion
            ? new Set(params.removeEmptyTagExclusion)
            : null;
        const textMaxLength = params.textMaxLength;
        const textLengthExclusion = params.textLengthExclusion
            ? new Set(params.textLengthExclusion)
            : null;

        const attributeTagExclusion = params.removeAttributeTagExclusion
            ? new Set(params.removeAttributeTagExclusion)
            : null;
        const allAttributes = params.removeAttributes === "all";
        const attributes = params.removeAttributes
            ? new Set(params.removeAttributes)
            : null;
        const attributeExclusion = params.removeAttributeExclusion
            ? new Set(params.removeAttributeExclusion)
            : null;
        const attributeMaxLength = params.attributeMaxLength;

        const inner = (html: Document | Element): string => {
            if (focusOnFirstTag) {
                const tag = html.querySelector(focusOnFirstTag);
                if (tag) {
                    return inner(tag);
                }
            }

            const elements = html.querySelectorAll("*");
            for (const element of elements) {
                const tag = element.tagName;

                // Remove tags
                if (tags?.has(tag)) {
                    element.remove();
                    continue;
                }

                // Remove structural tags
                if (removeStructural?.has(tag)) {
                    // TODO
                }

                // Remove empty tags
                if (
                    removeEmpty &&
                    element.innerHTML === "" &&
                    !removeEmptyTagExclusion?.has(tag)
                ) {
                    element.remove();
                    continue;
                }

                // Remove long text
                if (textMaxLength) {
                    element.childNodes.forEach((node) => {
                        if (node.nodeType === html.TEXT_NODE) {
                            const text = node.textContent;
                            if (
                                text &&
                                text.length > textMaxLength &&
                                !textLengthExclusion?.has(tag)
                            ) {
                                node.textContent =
                                    text.slice(0, textMaxLength) + "...";
                            }
                        }
                    });
                }

                // Dont remove any attributes for these tags
                if (attributeTagExclusion?.has(tag)) {
                    continue;
                }

                // iterate over all attributes
                if (allAttributes || attributeMaxLength) {
                    for (const attribute of element.attributes) {
                        if (attributeExclusion?.has(attribute.name)) {
                            continue;
                        }

                        if (allAttributes) {
                            element.removeAttribute(attribute.name);
                            continue;
                        }

                        if (attributes?.has(attribute.name)) {
                            element.removeAttribute(attribute.name);
                            continue;
                        }

                        if (
                            attributeMaxLength &&
                            attribute.value.length > attributeMaxLength
                        ) {
                            element.removeAttribute(attribute.name);
                        }
                    }
                    continue;
                }

                // remove specific attributes (more efficient)
                if (attributes)
                    for (const attribute of attributes) {
                        element.removeAttribute(attribute);
                    }
            }

            const outerHTML = (html as Element).outerHTML
                ? (html as Element).outerHTML
                : (html as Document).documentElement.outerHTML;

            const compressed = replaceRegex(outerHTML, [
                [/(<!--.*?-->)|(<!--[\w\W\n\s]+?-->)/g, ""], // Remove comments
                [/\s+/g, " "], // Remove whitespace
                [/>\s+</g, "><"], // Remove whitespace between tags
            ]);
            return compressed;
        };

        const start = process.hrtime();

        const html = new JSDOM(original).window.document;
        const compressed = inner(html);
        const finish = process.hrtime(start);

        console.log("counting tokens");

        const originalTokens = params.tokenizeInput
            ? countTokens(original)
            : null;
        const compressedTokens = countTokens(compressed);
        return {
            compressed,
            metrics: {
                originalTokens,
                compressedTokens,
                ratio: originalTokens
                    ? compressedTokens / originalTokens
                    : null,
                time: finish[0] + finish[1] / 1e9,
                completed: true,
            },
        };
    } catch (error) {
        return {
            error: (error as Error).toString(),
            metrics: { completed: false },
        };
    }
};
