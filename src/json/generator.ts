import fs from "fs";
import z from "zod";
import { Retriever, RetrieverParam } from "../retriever";
import { generateAST } from "./ast";
import { JSONAST } from "./astTypes";
import { JSONType } from "./jsonTypes";

// TODO add required to everything
// TODO infer types from key names

/** Generates zod schema code and returns as a string */
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

const saveToFile = (data: any, name: string) => {
  fs.writeFileSync(
    `./${name}-${new Date().getTime()}.json`,
    JSON.stringify(data, null, 2)
  );
};

/** Retrieves one or more data and generates validator from the set of responses
 * saves to file
 *
 */
export const generateIterative = async <T extends RetrieverParam>(
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
    return data;
  } catch (error) {
    console.log("Error:", name, JSON.stringify(param));
    console.log(error);
    data.error = error;
    saveToFile(data, name);
    return data;
  }
};
