import { JSONPrimitive } from "./jsonTypes";
import { JSONSchemaPrimitive } from "./schemaTypes";

export type JSONPrimitiveAST = {
    kind: "primitive";
    type: JSONSchemaPrimitive;
    values: JSONPrimitive[];
};

export type JSONObjectAST = {
    kind: "object";
    values: { [key: string]: JSONAST };
};

export type JSONArrayAST = {
    kind: "array";
    values: JSONAST[];
};

export type JSONUnionAST = {
    kind: "union";
    values: JSONAST[];
};

export type JSONAST =
    | JSONPrimitiveAST
    | JSONObjectAST
    | JSONArrayAST
    | JSONUnionAST;
