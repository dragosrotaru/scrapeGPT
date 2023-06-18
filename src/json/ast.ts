import { JSONAST, JSONObjectAST, JSONPrimitiveAST } from "./astTypes";
import {
  JSONObject,
  JSONType,
  isJSONArray,
  isJSONObject,
  isJSONPrimitive,
} from "./jsonTypes";
import { JSONSchemaPrimitive } from "./schemaTypes";

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
