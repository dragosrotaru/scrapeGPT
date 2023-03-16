import {
  isJSONArray,
  isJSONObject,
  isJSONPrimitive,
  JSONObject,
  JSONPrimitive,
  JSONType,
} from "@dragos/common/json";
import fs from "fs";
import z from "zod";
import { Retriever, RetrieverParam } from "./retriever";

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
        if (!validateSchema(value, schema[key])) {
          return false;
        }
      }
      return true;
    }
  } else if (isJSONArray(json)) {
    if (isJSONArray(schema)) {
      for (const [index, value] of json.entries()) {
        if (!validateSchema(value, schema[index])) {
          return false;
        }
      }
      return true;
    }
  }
  return false;
};

// AST

type JSONPrimitiveAST = {
  kind: "primitive";
  type: JSONSchemaPrimitive;
  values: JSONPrimitive[];
};

type JSONObjectAST = {
  kind: "object";
  values: { [key: string]: JSONAST };
};

type JSONArrayAST = {
  kind: "array";
  values: JSONAST[];
};

type JSONUnionAST = {
  kind: "union";
  values: JSONAST[];
};

export type JSONAST =
  | JSONPrimitiveAST
  | JSONObjectAST
  | JSONArrayAST
  | JSONUnionAST;

const objectsHaveSameKeys = (A: object, B: object): boolean => {
  const Ak = Object.keys(A);
  const Bk = Object.keys(B);
  return Ak.every((a) => Bk.includes(a)) && Bk.every((b) => Ak.includes(b));
};

/** This AST Generator is capable of producing a JSON Schema from multiple examples of data provided to it.
- If two objects do not have exactly the same keys, Then they are treated as a Union of two separate types by default.
- In other words, There is no concept of intersection, and no concept of undefined keys.
- All arrays are treated as unions of their containing types. There is no concept of order, length or uniqueness.
*/
export const generateAST = (json: JSONType, ast?: JSONAST): JSONAST => {
  if (isJSONPrimitive(json)) {
    let type = typeof json as JSONSchemaPrimitive;
    if ((type as string) === "object") {
      type = "null";
    }

    // no ast? create one
    if (!ast) {
      return {
        kind: "primitive",
        type,
        values: [json],
      };
    }

    // if the existing ast is already a primitive of the same type, simply add the value
    if (ast.kind === "primitive" && ast.type === type) {
      ast.values.push(json);
      return ast;
    }

    // if the existing ast is a union, and there already is a primitive of the same type nested, add the value
    if (ast.kind === "union") {
      const existing = ast.values.find(
        (v) => v.kind === "primitive" && v.type === type
      ) as JSONPrimitiveAST;
      if (existing) {
        ast.values = [
          ...ast.values.filter(
            (v) => v.kind !== "primitive" || v.type !== type
          ),
          generateAST(json, existing),
        ];
        return ast;
      }
    }
    // if the existing ast is not union, create a new one and nest the old ast
    else {
      ast = {
        kind: "union",
        values: [ast],
      };
    }

    // add the new primiive value to the union
    ast.values.push(generateAST(json));
    return ast;
  }

  if (isJSONObject(json)) {
    // no ast? create one
    if (!ast) {
      const ast: JSONObjectAST = {
        kind: "object",
        values: {},
      };
      for (const [key, value] of Object.entries(json)) {
        ast.values[key] = generateAST(value);
      }
      return ast;
    }

    // if the existing ast is an object and it has identical keys, add the values
    if (ast.kind === "object" && objectsHaveSameKeys(ast.values, json)) {
      for (const [key, value] of Object.entries(ast.values)) {
        ast.values[key] = generateAST(json[key], value);
      }
      return ast;
    }

    // if the existing ast is a union, and there already is an object of the same type nested, merge them
    if (ast.kind === "union") {
      const existing = ast.values.find(
        (v) => v.kind === "object" && objectsHaveSameKeys(v.values, json)
      );
      if (existing) {
        ast.values = [
          ...ast.values.filter(
            (v) => v.kind !== "object" || !objectsHaveSameKeys(v.values, json)
          ),
          generateAST(json, existing),
        ];
        return ast;
      }
    }
    // if the existing ast is not union, create a new one and nest the old ast
    else {
      ast = {
        kind: "union",
        values: [ast],
      };
    }

    // add the new object value to the union
    ast.values.push(generateAST(json));
    return ast;
  }

  if (isJSONArray(json)) {
    // simple case: no ast? create one
    if (!ast) {
      if (json.length === 0) {
        return {
          kind: "array",
          values: [],
        };
      }

      let local: JSONAST = generateAST(json[0]);
      for (let i = 1; i < json.length; i++) {
        const val = json[i];
        local = generateAST(val, local);
      }
      return {
        kind: "array",
        values: [local],
      };
    }

    // if the existing ast is an array and it is the same type
    if (ast.kind === "array") {
      let values = ast.values;

      // go over each element in the json array, find if there is an existing AST matching in kind and type, and add the value there.
      // if there is not, simply add the value to the ast
      json.forEach((val) => {
        const node = generateAST(val);

        if (node.kind === "primitive") {
          try {
            const existing = values.find(
              (v) => v.kind === node.kind && v.type === node.type
            );
            if (existing) {
              values = [
                ...values.filter(
                  (v) => v.kind !== "primitive" || v.type !== node.type
                ),
                generateAST(val, existing),
              ];
              return;
            }
          } catch (error) {
            console.error(error);
            console.log(node);
            throw error;
          }
        }

        if (node.kind === "object") {
          const existing = values.find(
            (v) =>
              v.kind === "object" &&
              objectsHaveSameKeys(v.values, val as JSONObject)
          );
          if (existing) {
            values = [
              ...values.filter(
                (v) =>
                  v.kind !== "object" ||
                  !objectsHaveSameKeys(v.values, val as JSONObject)
              ),
              generateAST(val, existing),
            ];
            return;
          }
        }

        if (node.kind === "array") {
          const existing = values.find((v) => v.kind === "array");
          if (existing) {
            values = [
              ...values.filter((v) => v.kind !== "array"),
              generateAST(val, existing),
            ];
            return;
          }
        }

        values.push(node);
      });

      ast.values = values;
      return ast;
    }

    // if the existing ast is a union, and there already is an array of the same type nested, add the value
    if (ast.kind === "union") {
      const existing = ast.values.find((v) => v.kind === "array");
      if (existing) {
        ast.values = [
          ...ast.values.filter((v) => v.kind !== "array"),
          generateAST(json, existing),
        ];
        return ast;
      }
    }
    // if the existing ast is not union, create a new one and nest the old ast
    else {
      ast = {
        kind: "union",
        values: [ast],
      };
    }

    // add the new object value to the union
    ast.values.push(generateAST(json));
    return ast;
  }

  console.log(json);
  throw new Error("not possible");
};

// TODO add required to everything
// TODO infer types from key names
export const generateValidator = (obj: JSONAST): string => {
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
        // TODO narrow down
        /*
          - ip
          - url
          - email
          - phone
          - uuid
          - date
          - regex
          - string number
          - string boolean
          - string null
        */
        return "z.string()";
      case "number":
        if (uniqueRatio < 0.05 && unique.size < 10) {
          // TODO this should not be an enum, enum cannot be of type number
          return `z.literal([${[...unique].map((v) => `'${v}'`).join(",")}])`;
        }
        // TODO narrow down
        /*
          - int
          - float
          - positive
          - negative
          - min
          - max
        */
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
    const objs: any = {};
    Object.entries(obj.values).forEach(
      ([k, v]) => (objs[k] = generateValidatorDynamic(v))
    );
    return z.object(objs);
  } else if (obj.kind === "array") {
    const options = obj.values.map(generateValidatorDynamic);
    if (options.length === 1) {
      return z.array(options[0]);
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

export type GenData = {
  params: any;
  json: JSONType[];
  ast?: JSONAST;
  schema?: string;
  error?: any;
};

export const saveToFile = (data: any, name: string) => {
  fs.writeFileSync(
    `./${name}-${new Date().getTime()}.json`,
    JSON.stringify(data, null, 2)
  );
};

export const gen = async <T extends RetrieverParam>(
  name: string,
  retriever: Retriever<T>,
  params: T[]
) => {
  const data: GenData = {
    params,
    json: [],
  };
  let param = params[0];
  try {
    for (let i = 0; i < params.length; i++) {
      param = params[i];
      data.json[i] = await retriever(param);
      data.ast = generateAST(data.json, data.ast);
    }
    data.schema = generateValidator(data.ast as JSONAST);
    saveToFile(data, name);
  } catch (error) {
    console.log("Error:", name, JSON.stringify(param));
    console.log(error);
    data.error = error;
    saveToFile(data, name);
  }
};
