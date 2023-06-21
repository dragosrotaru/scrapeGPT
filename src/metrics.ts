import fs from "fs";
import example from "../data/localhost/alpha/formcode-metrics.json";
import sites from "./sites.json";
/* 

Name,Value,Timestamp,Step

*/

type FormCodeMetrics = typeof example;

import { metricsFilePaths } from "./files";
import { Stage } from "./interfaces";

const gatherStageMetrics = async <Metrics>(stage: Stage, urls: string[]) => {
    const metrics = {} as Record<string, Metrics>;
    for (const url of urls) {
        const filePaths = metricsFilePaths(url);
        metrics[url] = JSON.parse(fs.readFileSync(filePaths[stage], "utf8"));
    }
    return metrics;
};

const generateCSV = () => {
    const metrics = gatherStageMetrics<FormCodeMetrics>(
        "formcode",
        sites.pages.map((page) => page.url)
    );
    let csv = `Name,Value,Timestamp,Step\n`;
    for (const [url, metric] of Object.entries(metrics)) {
        for (const [name, value] of Object.entries(metric)) {
            csv += `${name},${value},${Date.now()},${url}\n`;
        }
    }
    return csv;
};
