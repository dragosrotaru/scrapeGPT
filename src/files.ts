import fs from "fs";
import path from "path";
import { Files, Stage, stages } from "./interfaces";

export const fileExists = (filePath: string) => fs.existsSync(filePath);

export const makeDirIfNotExists = (dir: string) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

export const overwriteJSON = (filePath: string, data: any) =>
    fs.writeFileSync(filePath, JSON.stringify(data, null, 4));

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
    if (path.endsWith(".html")) {
        path = path.slice(0, -5);
    }
    return path;
};

// HTML related
const metaFilePath = (dir: string) => path.join(dir, "index.json");
const originalFilePath = (dir: string) => path.join(dir, "index.html");
const compressedFilePath = (dir: string) =>
    path.join(dir, "index.compressed.html");

// Common Paths
const dirPath = (url: string) => path.join("data", urlToPath(url));

const metricsFilePath = (dir: string, stage: Stage) =>
    path.join(dir, stage + "-metrics.json");

const errorFilePath = (dir: string, stage: Stage) =>
    path.join(dir, stage + "-error.json");

const lintFilePath = (dir: string, stage: Stage) =>
    path.join(dir, stage + "-lint.json");

const resultFilePath = (dir: string, stage: Stage) =>
    path.join(dir, stage + "-result.json");

const dataFilePath = (dir: string, stage: Stage) =>
    path.join(dir, stage + ".json");

const codeFilePath = (dir: string, stage: Stage) =>
    path.join(dir, stage + ".js");

export const filePaths = (url: string, stage: Stage) => {
    const dir = dirPath(url);
    return {
        dir: dirPath(url),

        original: originalFilePath(dir),
        meta: metaFilePath(dir),
        compressed: compressedFilePath(dir),

        code: codeFilePath(dir, stage),
        data: dataFilePath(dir, stage),

        lint: lintFilePath(dir, stage),
        error: errorFilePath(dir, stage),
        result: resultFilePath(dir, stage),
        metrics: metricsFilePath(dir, stage),
    };
};

export const metricsFilePaths = (url: string): Record<Stage, string> => {
    const dir = dirPath(url);
    return stages.reduce((acc, stage) => {
        acc[stage] = metricsFilePath(dir, stage);
        return acc;
    }, {} as Record<Stage, string>);
};

export const keyInFilesGuard = (key: string): key is Files => {
    return key in filePaths("http://localhost", "htmlretrieve");
};
