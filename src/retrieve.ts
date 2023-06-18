import { randomUUID } from "crypto";
import fs from "fs";
import puppeteer from "puppeteer";
import { processHtml } from "./compress";

export const retrieve = async (url: string) => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  page.setUserAgent(
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome"
  );
  page.setViewport({ width: 1400, height: 1000 });
  await page.goto(url);
  const html = await page.content();
  await browser.close();
  return html;
};

(async () => {
  if (process.argv[2] === "retrieve") {
    const url = process.argv[3];
    const tokenizeInput = process.argv[4] ? true : false;
    const html = await retrieve(url);
    const fileName = new URL(url).hostname + randomUUID().slice(0, 8) + ".html";
    fs.writeFileSync(fileName, html);
    processHtml(fileName, html, tokenizeInput);
  }
})();
