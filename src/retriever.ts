import { JSONType } from "@dragos/common/json";
import z from "zod";

export type RetrieverParam = { [key: string]: string } | undefined;

/**
 * A Retriever is a function that takes in a set of string parameters, makes a network request
 * and returns a JSON Data Type. Do not use Retrievers directly - they should be passed to higher order functions
 * such as validate in order to make them more user friendly.
 *
 * @param P The type of the parameters
 * @param params The parameters
 * @returns A JSON Data Type

 */
export type Retriever<P extends RetrieverParam = undefined> = (
  params: P
) => Promise<JSONType>;

function convertPathnameToFunctionName(pathname: string): string {
  // Remove any leading or trailing slashes from the pathname
  const trimmedPathname = pathname.replace(/^\/|\/$/g, "");

  // Split the trimmed pathname into an array of strings using slashes as the delimiter
  const pathnameArray = trimmedPathname.split("/");

  // Convert each string in the array to camelCase
  const camelCaseArray = pathnameArray.map((string) =>
    string.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
  );

  // Join the camelCase strings back together into a single string with no spaces or special characters
  const functionName = camelCaseArray.join("").replace(/[^a-zA-Z0-9]/g, "");

  if (functionName === "") {
    throw new Error("Invalid pathname");
  }

  // Return the final function name
  return functionName;
}

// TODO make formatURL and Retiever available in the generated code
// TODO detect ROOT URL from multiple samples and use that as the base URL in all generated code
// TODO detect if the URL is a GET or POST request and generate the appropriate code
// TODO detect if there are no params and generate a function that takes no params
// TODO detect headers and generate code to set them
// TODO detect response type
// TODO generate a mapper funtion that maps params to stringified params
export const retrieverGenerator = (
  url: string
): { imports: { [key: string]: boolean }; code: string; paramType: string } => {
  // parse params from url
  const parsed = new URL(url);
  const params = parsed.searchParams;
  const path = parsed.pathname;

  // generate a valid typescript function name
  const fnName = convertPathnameToFunctionName(path);

  let imports: { [key: string]: boolean } = {
    Retriever: true,
    formatURL: false,
  };

  // base case: GET JSON retriever with no params at all
  let code = `const ${fnName}: Retriever = async () => (await fetch(\`${path}\)).json();`;

  // TODO detect if there are path params

  // generate type
  let paramType = "";
  params.forEach((key) => {
    paramType += `"${key}": string;`;
  });
  if (paramType.length > 0) {
    paramType = `<{${paramType}}>`;
    code = `const ${fnName}: Retriever${paramType} = async (params) => (await fetch(formatURL(\`${path}\`, params))).json();`;
    imports.formatURL = true;
  }

  return {
    imports,
    code,
    paramType,
  };
};

/**
 * The validate HOC (higher order function) takes a Retriever and returns a validated Retriever.
 * Validated Retrievers return a Zod Safe Parse Result, and have a usable return type.
 *
 * @param retriever A Retriever Function
 * @param validate A Zod Schema
 * @returns A validated retriever
 */
export const validate =
  <P extends RetrieverParam, V extends z.ZodTypeAny>(
    retriever: Retriever<P>,
    validate: V
  ) =>
  async (
    params: P
  ): Promise<
    z.SafeParseReturnType<z.infer<typeof validate>, z.infer<typeof validate>>
  > => {
    const data = await retriever(params);
    return validate.safeParse(data);
  };
