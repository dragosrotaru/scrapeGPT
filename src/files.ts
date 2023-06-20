import fs from "fs";
import path from "path";
import { Stage } from "./interfaces";

export const fileExists = (filePath: string) => fs.existsSync(filePath);

export const makeDirIfNotExists = (dir: string) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

export const overwriteJSON = (filePath: string, data: any) =>
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

export const overwriteFile = (filePath: string, data: string) =>
    fs.writeFileSync(filePath, data);

export const readFile = (filePath: string) => fs.readFileSync(filePath, "utf8");

export const readJSON = (filePath: string) =>
    JSON.parse(fs.readFileSync(filePath, "utf8"));

const urlToPath = (url: string) => {
    let path = new URL(url).host + new URL(url).pathname;
    if (path.endsWith("/")) {
        path = path.slice(0, -1);
    }
    return path.replace(/\/$/, "-");
};

// Common Paths
const dirPath = (url: string) => path.join("data", urlToPath(url));
const metricsFilePath = (dir: string, stage: Stage) =>
    path.join(dir, stage + "-metrics.json");
const errorFilePath = (dir: string, stage: Stage) =>
    path.join(dir, stage + "-error.json");
const responseFilePath = (dir: string, stage: Stage) =>
    path.join(dir, stage + "-response.json");

// Retrieve Outs
const originalFilePath = (dir: string) => path.join(dir, "index.html");
const metaFilePath = (dir: string) => path.join(dir, "meta.json");

// Compress Outs
const compressedFilePath = (dir: string) => path.join(dir, "compressed.html");

// Code Outs
const codeFilePath = (dir: string) => path.join(dir, "code.js");
const lintFilePath = (dir: string) => path.join(dir, "lint.json");

// Props Outs
const propsFilePath = (dir: string) => path.join(dir, "props.json");

// Schema Outs
const schemaFilePath = (dir: string) => path.join(dir, "schema.js");

// Fill Form Outs
const filledFilePath = (dir: string) => path.join(dir, "result.json");

export const filePaths = (url: string, stage: Stage) => {
    const dir = dirPath(url);
    return {
        dir: dirPath(url),
        original: originalFilePath(dir),
        meta: metaFilePath(dir),
        compressed: compressedFilePath(dir),
        code: codeFilePath(dir),
        lint: lintFilePath(dir),
        props: propsFilePath(dir),
        schema: schemaFilePath(dir),
        result: filledFilePath(dir),
        error: errorFilePath(dir, stage),
        response: responseFilePath(dir, stage),
        metrics: metricsFilePath(dir, stage),
    };
};
