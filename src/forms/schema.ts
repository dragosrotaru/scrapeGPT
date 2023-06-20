import { z } from "zod";
import { generateAST } from "../json/ast";
import {
    generateValidatorDynamic,
    generateValidatorWrapped,
} from "../json/generate";
import { JSONType } from "../json/jsonTypes";

export const formschema = async (props: JSONType) => {
    try {
        const ast = generateAST(props, undefined);
        const { code, lint } = await generateValidatorWrapped(ast);
        const zod = generateValidatorDynamic(ast);
        const result = zod.safeParse(props);
        const expr = eval(code)(z);
        expr.parse(props);
        return { code, lint, result };
    } catch (error) {
        return { error: (error as Error).toString() };
    }
};
