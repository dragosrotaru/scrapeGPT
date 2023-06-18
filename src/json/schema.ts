import {
    JSONType,
    isJSONArray,
    isJSONObject,
    isJSONPrimitive,
} from "./jsonTypes";
import { JSONSchema, JSONSchemaObject } from "./schemaTypes";

/** Generates a simple schema */
export const generateSchema = (json: JSONType): JSONSchema => {
    if (isJSONPrimitive(json)) {
        if (typeof json === "string") {
            return "string";
        } else if (typeof json === "number") {
            return "number";
        } else if (typeof json === "boolean") {
            return "boolean";
        } else if (json === null) {
            return "null";
        }
    } else if (isJSONObject(json)) {
        const schema: JSONSchemaObject = {};
        for (const [key, value] of Object.entries(json)) {
            schema[key] = generateSchema(value);
        }
        return schema;
    } else if (isJSONArray(json)) {
        return json.map(generateSchema);
    }
    throw new Error("not possible");
};

/** Validates a simple schema against provided data */
export const validateSchema = (json: JSONType, schema: JSONSchema): boolean => {
    if (isJSONPrimitive(json)) {
        if (typeof json === "string") {
            return schema === "string";
        } else if (typeof json === "number") {
            return schema === "number";
        } else if (typeof json === "boolean") {
            return schema === "boolean";
        } else if (json === null) {
            return schema === "null";
        }
    } else if (isJSONObject(json)) {
        if (isJSONObject(schema)) {
            for (const [key, value] of Object.entries(json)) {
                if (!validateSchema(value, schema[key] as JSONSchema)) {
                    return false;
                }
            }
            return true;
        }
    } else if (isJSONArray(json)) {
        if (isJSONArray(schema)) {
            for (const [index, value] of json.entries()) {
                if (!validateSchema(value, schema[index] as JSONSchema)) {
                    return false;
                }
            }
            return true;
        }
    }
    return false;
};
