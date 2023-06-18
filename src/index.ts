import { program } from "commander";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { generate } from "./forms/generate";
import { compress } from "./html/compress";
import { retrieve } from "./retrieve";

const createID = () => randomUUID().slice(0, 8);
const urlToPath = (url: string) => {
    let path = new URL(url).host + new URL(url).pathname;
    if (path.endsWith("/")) {
        path = path.slice(0, -1);
    }
    return path.replace(/\/$/, "-");
};
const validURL = (s: string) => {
    try {
        new URL(s);
        return true;
    } catch (err) {
        return false;
    }
};

const dirPath = (url: string, id?: string) =>
    path.join("experiments/data", urlToPath(url), id || createID());
const originalFilePath = (dir: string) => path.join(dir, "index.html");
const metaFilePath = (dir: string) => path.join(dir, "meta.json");
const compressedFilePath = (dir: string) => path.join(dir, "compressed.html");

const cli = program
    .name("scrapeGPT")
    .version("0.0.1")
    .description("Automated Scraper");

const retrieveCMD = cli.command("retrieve");
const compressCMD = cli.command("compress");
const generateCMD = cli.command("generate");

retrieveCMD
    .requiredOption("-u, --url <url>", "Website url to retrieve")
    .action(async ({ url }) => {
        if (!validURL(url)) {
            console.log("invalid url");
            return;
        }

        const id = createID();
        const dir = dirPath(url, id);
        const filePath = originalFilePath(dir);
        const metaPath = metaFilePath(dir);

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        if (fs.existsSync(filePath)) {
            console.log("already retrieved, continuing");
        }

        // time
        const start = process.hrtime();
        const { html, title, description } = await retrieve(url);
        const stop = process.hrtime(start);
        const retrieveTime = stop[0];
        console.log("retrieveTime time:", retrieveTime, "seconds");

        let meta = {};
        if (fs.existsSync(metaPath)) {
            meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
        }

        fs.writeFileSync(filePath, html);
        fs.writeFileSync(
            metaPath,
            JSON.stringify(
                { ...meta, title, description, url, retrieveTime },
                null,
                2
            )
        );
    });

compressCMD
    .requiredOption("-u, --url <url>", "Website url to compress")
    .option("-i, --id <id>", "id of the website")
    .option("-nt, --no-tokenize", "Dont tokenize the input")
    .action(async ({ id, url, tokenize }) => {
        if (!validURL(url)) {
            console.log("invalid url");
            return;
        }

        const dir = dirPath(url, id);
        const originalPath = originalFilePath(dir);
        const compressedPath = compressedFilePath(dir);
        const metaPath = metaFilePath(dir);

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        if (fs.existsSync(compressedPath)) {
            console.log("already compressed, continuing");
        }

        const existsAlready = fs.existsSync(originalPath);
        console.log("exists already", originalPath);
        let html = "";
        if (existsAlready) {
            html = fs.readFileSync(originalPath, "utf8");
        } else {
            const start = process.hrtime();
            const result = await retrieve(url);
            const stop = process.hrtime(start);
            const retrieveTime = stop[0];
            console.log("retrieve time:", retrieveTime, "seconds");

            fs.writeFileSync(originalPath, html);
            fs.writeFileSync(
                metaPath,
                JSON.stringify(
                    {
                        title: result.title,
                        description: result.description,
                        url,
                        retrieveTime,
                    },
                    null,
                    2
                )
            );
        }

        const start = process.hrtime();
        const { compressed, initial, after } = await compress(html, tokenize);
        const stop = process.hrtime(start);
        const compressTime = stop[0];

        console.log("compressed to", after, "tokens");
        if (initial) {
            console.log("initial tokens:", initial);
            console.log(
                "compression ratio:",
                (initial / after).toFixed(2) + "x"
            );
            console.log("compression time:", compressTime, "seconds");
        }

        let meta = {};
        if (fs.existsSync(metaPath)) {
            meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
        }
        fs.writeFileSync(
            metaPath,
            JSON.stringify({ ...meta, compressTime }, null, 2)
        );

        fs.writeFileSync(compressedPath, compressed);
    });

generateCMD
    .requiredOption("-u, --url <url>", "url of the website")
    .requiredOption("-i, --id <id>", "id of the website")
    .action(async ({ id, url }) => {
        if (!validURL(url)) {
            console.log("invalid url");
            return;
        }

        const dir = dirPath(url, id);
        const originalPath = originalFilePath(dir);
        const metaPath = metaFilePath(dir);

        const codeFilePath = path.join(dir, "code.js");

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        if (fs.existsSync(codeFilePath)) {
            console.log("already generated, continuing");
        }

        const html = fs.readFileSync(originalPath, "utf8");

        let meta = {};
        if (fs.existsSync(metaPath)) {
            meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
        }

        const {
            wrapped,
            codeError,
            params,
            paramsError,
            lint,
            meta: newMeta,
        } = await generate(url, html, meta);

        if (wrapped) {
            fs.writeFileSync(codeFilePath, wrapped);
        }

        if (params) {
            const fileName = path.join(dir, "params.json");
            fs.writeFileSync(fileName, JSON.stringify(params, null, 2));
        }

        if (codeError) {
            const fileName = path.join(dir, "codeError.json");
            fs.writeFileSync(fileName, JSON.stringify(codeError, null, 2));
        }

        if (paramsError) {
            const fileName = path.join(dir, "paramsError.json");
            fs.writeFileSync(fileName, JSON.stringify(paramsError, null, 2));
        }

        if (lint) {
            const fileName = path.join(dir, "lint.json");
            fs.writeFileSync(fileName, JSON.stringify(lint, null, 2));
        }

        try {
            if (wrapped) {
                const start = process.hrtime();
                const result = await eval(wrapped);
                const stop = process.hrtime(start);
                const evalTime = stop[0];
                newMeta.evalTime = evalTime;
                console.log("eval time:", evalTime, "seconds");
                console.log(result);
                newMeta.evalResult = result;
            }
        } catch (error) {
            console.error(error);
            newMeta.evalError = (error as Error).message;
        } finally {
            fs.writeFileSync(
                metaPath,
                JSON.stringify({ ...meta, ...newMeta }, null, 2)
            );
        }
    });

program.parse();
