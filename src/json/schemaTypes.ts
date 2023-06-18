export type JSONSchemaPrimitive = "boolean" | "number" | "string" | "null";
export type JSONSchemaObject = { [member: string]: JSONSchema };
export type JSONSchemaArray = JSONSchema[];
export type JSONSchema =
    | JSONSchemaPrimitive
    | JSONSchemaObject
    | JSONSchemaArray;

export const isJSONSchemaPrimitive = (
    input: unknown
): input is JSONSchemaPrimitive =>
    input === "boolean" ||
    input === "number" ||
    input === "string" ||
    input === "null";

export const isJSONSchemaArray = (input: unknown): input is JSONSchemaArray =>
    Array.isArray(input) && input.every(isJSONSchema);

export const isJSONSchemaObject = (input: unknown): input is JSONSchemaObject =>
    typeof input === "object" &&
    input !== null &&
    Object.entries(input).every((elem) => isJSONSchema(elem[1]));

export const isJSONSchema = (input: unknown): input is JSONSchema =>
    isJSONSchemaPrimitive(input) ||
    isJSONSchemaArray(input) ||
    isJSONSchemaObject(input);
