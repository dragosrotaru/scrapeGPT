import { Option, program } from "commander";
import { formcode } from "./forms/code";
import { formprops } from "./forms/props";
import { formschema } from "./forms/schema";
import { htmlcompress } from "./html/compress";
import { htmlretrieve } from "./html/retrieve";

import { getBrowser, getNewPage } from "./puppeteer/browser";
import testbed from "./puppeteer/testbed";
import { stage } from "./stage";
import { timeit } from "./util";

const cli = program
    .name("scrapeGPT")
    .version("0.0.1")
    .description("Automated Scraper");

const urlOption = new Option(
    "-u, --url <url>",
    "Webpage url"
).makeOptionMandatory();

const closeBrowserOnExit = new Option("-c, --close", "Close browser on exit");

const htmlCMD = cli.command("html");
const formCMD = cli.command("form");
const utilCMD = cli.command("util");

const retrieveCMD = htmlCMD.command("retrieve");
const compressCMD = htmlCMD.command("compress");

const formcodeCMD = formCMD.command("code");
const formpropsCMD = formCMD.command("props");
const formschemaCMD = formCMD.command("schema");
const fillFormCMD = formCMD.command("fill");

retrieveCMD
    .addOption(urlOption)
    .addOption(closeBrowserOnExit)
    .action(async ({ url }) =>
        stage("htmlretrieve", [], url, async () => {
            const browser = await getBrowser();
            const page = await getNewPage(browser)();
            const res = await timeit(() => htmlretrieve(url, page));
            if (closeBrowserOnExit) {
                console.log("closing browser");
                await browser.close();
            }
            return res;
        })
    );

compressCMD.addOption(urlOption).action(async ({ url }) =>
    stage("htmlcompress", [["htmlretrieve", "original"]], url, async (deps) => {
        const original = deps.htmlretrieve?.original;
        if (!original) throw new Error("dep missing");
        return timeit(async () => htmlcompress(original));
    })
);

formcodeCMD.addOption(urlOption).action(async ({ url }) =>
    stage("formcode", [["htmlcompress", "compressed"]], url, async (deps) => {
        const compressed = deps.htmlcompress?.compressed;
        if (!compressed || typeof compressed !== "string") {
            throw new Error("dep missing");
        }
        return timeit(() => formcode(compressed));
    })
);

formpropsCMD.addOption(urlOption).action(async ({ url }) =>
    stage(
        "formprops",
        [
            ["htmlretrieve", "meta"],
            ["formcode", "code"],
        ],
        url,
        async (deps) => {
            const meta = deps.htmlretrieve?.meta;
            const code = deps.formcode?.code;
            if (!meta || !code) throw new Error("dep missing");
            return timeit(() => formprops(code, meta));
        }
    )
);

formschemaCMD.addOption(urlOption).action(async ({ url }) =>
    stage("formschema", [["formprops", "data"]], url, async (deps) => {
        const data = deps.formprops?.data;
        if (!data) throw new Error("dep missing");
        return timeit(() => formschema(data));
    })
);

fillFormCMD
    .addOption(urlOption)
    .addOption(closeBrowserOnExit)
    .action(async ({ url }) =>
        stage(
            "formfill",
            [
                ["htmlretrieve", "meta"],
                ["formcode", "code"],
                ["formprops", "data"],
            ],
            url,
            async (deps) => {
                const meta = deps.htmlretrieve?.meta;
                const code = deps.formcode?.code;
                const data = deps.formprops?.data;
                if (!meta || !code || !data) throw new Error("dep missing");
                const browser = await getBrowser();
                const page = await getNewPage(browser)();
                const res = await timeit(() =>
                    testbed(meta.url, code, data, page)
                );
                if (closeBrowserOnExit) {
                    console.log("closing browser");
                    await browser.close();
                }
                return res;
            }
        )
    );

utilCMD.command("browser").action(async () => {
    getBrowser();
});

program.parse();
