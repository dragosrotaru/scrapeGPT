import { Option, program } from "commander";
import {
    fileExists,
    filePaths,
    makeDirIfNotExists,
    overwriteFile,
    overwriteJSON,
    readFile,
    readJSON,
} from "./files";
import { generateFormCode, generateFormProps } from "./forms/generate";
import { compress } from "./html/compress";
import { Files, Stage, StageMethod } from "./interfaces";
import { generateAST } from "./json/ast";
import {
    generateValidatorDynamic,
    generateValidatorWrapped,
} from "./json/generate";
import { retrieve } from "./retrieve";
import testbed from "./retrieve/testbed";
import { timeit } from "./util";

const isUrl = (s: string) => {
    try {
        new URL(s);
        return true;
    } catch (err) {
        return false;
    }
};

const cli = program
    .name("scrapeGPT")
    .version("0.0.1")
    .description("Automated Scraper");

const urlOption = new Option(
    "-u, --url <url>",
    "Webpage url"
).makeOptionMandatory();

const htmlCMD = cli.command("html");

const retrieveCMD = htmlCMD.command("retrieve");
const compressCMD = htmlCMD.command("compress");

const formCMD = cli.command("form");

const formcodeCMD = formCMD.command("code");
const formpropsCMD = formCMD.command("props");
const formschemaCMD = formCMD.command("schema");
const fillFormCMD = cli.command("fill");

const keyInFilesGuard = (key: string): key is Files => {
    return key in filePaths("", "retrieve");
};

const stage = async (
    name: Stage,
    dependencies: Files[],
    url: string,
    method: StageMethod
) => {
    if (!isUrl(url)) {
        console.log("invalid url");
        return;
    }
    const paths = filePaths(url, name);
    makeDirIfNotExists(paths.dir);

    for (const dependency of dependencies) {
        if (!fileExists(paths[dependency])) {
            console.log(`${dependency} does not exist`);
            return;
        }
    }

    const result = await method(paths);

    Object.entries(result).forEach(([key, value]) => {
        // TODO refactor interface to be Exact/Partial
        if (!keyInFilesGuard(key)) {
            console.log(`invalid key: ${key}`);
            return;
        }
        if (!value) {
            return;
        }
        if (typeof value !== "string") {
            overwriteJSON(paths[key], value);
            return;
        }
        overwriteFile(paths[key], value);
    });
};

retrieveCMD
    .addOption(urlOption)
    .action(async ({ url }) => stage("retrieve", [], url, () => retrieve(url)));

compressCMD.addOption(urlOption).action(async ({ url, tokenize }) =>
    stage("compress", ["original"], url, async (paths) => {
        return compress(readFile(paths.original), tokenize);
    })
);

formcodeCMD.addOption(urlOption).action(async ({ url }) =>
    stage("formcode", ["compressed"], url, async (paths) => {
        return generateFormCode(readFile(paths.compressed));
    })
);

formpropsCMD.addOption(urlOption).action(async ({ url }) =>
    stage("formprops", ["meta", "code"], url, async (paths) => {
        return generateFormProps(readFile(paths.code), readJSON(paths.meta));
    })
);

formschemaCMD.addOption(urlOption).action(async ({ url }) =>
    stage("formschema", ["props"], url, async (paths) => {
        const props = readJSON(paths.props);
        const {
            result: { schema, zod },
            time,
        } = await timeit(async () => {
            const ast = generateAST(props, undefined);
            const schema = await generateValidatorWrapped(ast);
            const zod = generateValidatorDynamic(ast);
            return { schema, zod };
        });
        zod.parse(props);
        const expr = eval(schema);
        expr.parse(props);
        return { schema, metrics: { time } };
    })
);

fillFormCMD.addOption(urlOption).action(async ({ url }) =>
    stage("formfill", ["meta", "code", "props"], url, async (paths) => {
        const code = readFile(paths.code);
        const props = readJSON(paths.props);
        const meta = readJSON(paths.meta);
        return testbed(meta.url, code, props);
    })
);

program.parse();
