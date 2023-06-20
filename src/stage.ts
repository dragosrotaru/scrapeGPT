import {
    fileExists,
    filePaths,
    keyInFilesGuard,
    makeDirIfNotExists,
    overwriteFile,
    overwriteJSON,
    readFile,
    readJSON,
} from "./files";
import { Files, Stage, StageDependencies, StageMethod } from "./interfaces";

const isUrl = (s: string) => {
    try {
        new URL(s);
        return true;
    } catch (err) {
        return false;
    }
};

export const stage = async (
    name: Stage,
    dependencies: [Stage, Files][],
    url: string,
    method: StageMethod
) => {
    if (!isUrl(url)) {
        console.log("invalid url");
        return;
    }
    const paths = filePaths(url, name);
    makeDirIfNotExists(paths.dir);

    const deps: StageDependencies = {};

    for (const dependency of dependencies) {
        const path = filePaths(url, dependency[0])[dependency[1]];
        if (!fileExists(path)) {
            console.log(`${dependency} does not exist`);
            return;
        } else {
            if (!deps[dependency[0]]) {
                deps[dependency[0]] = {};
            }
            if (path.endsWith(".json")) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                deps[dependency[0]]![dependency[1]] = readJSON(path);
            } else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                deps[dependency[0]]![dependency[1]] = readFile(path);
            }
        }
    }

    console.log("dependencies satisfied");

    const result = await method(deps);

    if (result.metrics) {
        console.log("metrics: ", JSON.stringify(result.metrics, null, 4));
    }

    Object.entries(result).forEach(([key, value]) => {
        if (!keyInFilesGuard(key)) {
            console.log(`invalid key: ${key}`);
            return;
        }
        if (!value) {
            return;
        }
        console.log("writing to: ", paths[key]);
        if (typeof value !== "string") {
            overwriteJSON(paths[key], value);
            return;
        }
        overwriteFile(paths[key], value);
    });
};
