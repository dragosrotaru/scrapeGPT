import prettier from "prettier";
import z, { ZodTypeAny } from "zod";
import { eslint } from "../lint";
import { generateAST } from "./ast";
import { JSONAST } from "./astTypes";
import { JSONType } from "./jsonTypes";

/** Generates zod schema code and returns as a string */
export const generateValidator = (obj: JSONAST): string => {
    // TODO infer types from key names
    if (obj.kind === "primitive") {
        const unique = new Set(obj.values);
        const uniqueRatio = unique.size / obj.values.length;
        switch (obj.type) {
            case "string":
                if (uniqueRatio < 0.333) {
                    return `z.enum([${[...unique]
                        .map((v) => {
                            const str = String(v);
                            // if its a multi-line string (contains new line or carriage return character), replace the backticks with escaped backticks
                            if (str.includes("\n") || str.includes("\r")) {
                                return `\`${str.replace(/`/g, "\\`")}]\``;
                            }
                            // otherwise, wrap the string in normal double quotes and escape any double quotes inside the string
                            return `"${str.replace(/"/g, '\\"')}"`;
                        })
                        .join(",")}])`;
                }
                // TODO narrow down ip, url, email, phone, uuid, date, regex, string number, string boolean, string null
                return "z.string()";
            case "number":
                if (uniqueRatio < 0.05 && unique.size < 10) {
                    return `z.union([ ${[...unique].join(",")} ])`;
                }
                // TODO narrow down int, float, positive, negative, min, max
                return "z.number()";
            case "boolean":
                return "z.boolean()";
            case "null":
                return "z.null()";
        }
    } else if (obj.kind === "object") {
        return `z.object({${Object.entries(obj.values).map(
            ([k, v]) => `'${k}':${generateValidator(v)}`
        )}})`;
    } else if (obj.kind === "array") {
        // TODO array constraint recognition: order, length (min, max, range, specific), uniqueness
        const options = obj.values
            .map(generateValidator)
            .reduce(
                (acc: string[], curr: string) =>
                    acc.includes(curr) ? acc : [...acc, curr],
                []
            );
        if (options.length === 1) {
            return `z.array(${options[0]})`;
        } else if (options.length > 1) {
            return `z.array(z.union([${options}]))`;
        } else {
            return `z.array(z.unknown())`;
        }
    } else if (obj.kind === "union") {
        // TODO if there is a union of a shit ton of objects with different keys, it should be a record
        return `z.union([${obj.values.map(generateValidator)}])`;
    }
    return "z.unknown()";
};

export const generateValidatorWrapped = async (
    obj: JSONAST
): Promise<string> => {
    const schema = generateValidator(obj);
    const code = `
            const z = require("zod");
            
            module.exports.default = ${schema};
        `;
    const lintResults = await eslint.lintText(code);
    return prettier.format(lintResults[0].output as string, {
        tabWidth: 4,
        parser: "babel",
    });
};

/** Generates zod schema code and returns it*/
export const generateValidatorDynamic = (obj: JSONAST): z.Schema => {
    if (obj.kind === "primitive") {
        switch (obj.type) {
            case "string":
                return z.string();
            case "number":
                return z.number();
            case "boolean":
                return z.boolean();
            case "null":
                return z.null();
        }
    } else if (obj.kind === "object") {
        const objs: { [key: string]: ZodTypeAny } = {};
        Object.entries(obj.values).forEach(
            ([k, v]) => (objs[k] = generateValidatorDynamic(v))
        );
        return z.object(objs);
    } else if (obj.kind === "array") {
        const options = obj.values.map(generateValidatorDynamic);
        if (options.length === 1) {
            return z.array(options[0] as ZodTypeAny);
        } else if (options.length > 1) {
            return z.array(z.union(options as any));
        } else {
            return z.array(z.unknown());
        }
    } else if (obj.kind === "union") {
        return z.union(obj.values.map(generateValidatorDynamic) as any);
    }
    return z.unknown();
};

export type GenData<T> = {
    params: T[];
    json: JSONType[];
    ast?: JSONAST;
    schema?: string;
    error?: Error;
};

/** generates validator from one or more json objects */
export const generateIterative = async (json: JSONType[]) => {
    let ast: JSONAST | undefined = undefined;

    for (let i = 0; i < json.length; i++) {
        ast = generateAST(json[i], ast);
    }
    return generateValidator(ast as JSONAST);
};
