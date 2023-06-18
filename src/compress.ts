import fs from "fs";
import GPTTokenizer from "gpt3-tokenizer";
import { JSDOM } from "jsdom";

/* Non-renderable  */

const stripAttributes = (html: Document) => {
  const elements = html.querySelectorAll("*");
  for (const element of elements) {
    // Remove all attributes
    while (element.attributes.length > 0) {
      element.removeAttribute(element.attributes[0].name);
    }
  }
};

const stripClasses = (html: Document) => {
  const elements = html.querySelectorAll("*");
  for (const element of elements) {
    element.removeAttribute("class");
  }
};

const stripHead = (html: Document) => {
  const head = html.querySelector("head");
  if (head) {
    head.remove();
  }
};

const stripScripts = (html: Document) => {
  const scripts = html.querySelectorAll("script");
  for (const script of scripts) {
    script.remove();
  }
};

const stripStyles = (html: Document) => {
  const styles = html.querySelectorAll("style");
  for (const style of styles) {
    style.remove();
  }
};

const stripNoScript = (html: Document) => {
  const noScripts = html.querySelectorAll("noscript");
  for (const noScript of noScripts) {
    noScript.remove();
  }
};

/* Semantically Meaningful */

const stripEmpty = (html: Document) => {
  const elements = html.querySelectorAll("*");
  for (const element of elements) {
    // if element is an input, don't remove it
    if (element.tagName === "INPUT") {
      continue;
    }
    if (element.innerHTML === "") {
      element.remove();
    }
  }
};

const stripStructural = (html: Document) => {
  const elements = html.querySelectorAll("*");
  for (const element of elements) {
    // remove br tags
    if (element.tagName === "BR") {
      element.remove();
    }
    // remove divs without attributes but keep their children
    const tag = element.tagName;
    const hasTag =
      tag === "DIV" || tag === "SECTION" || tag === "ARTICLE" || tag === "SPAN";
    if (hasTag && element.attributes.length === 1) {
      while (element.firstChild) {
        element.parentNode?.insertBefore(element.firstChild, element);
      }
      element.remove();
    }
  }
};

const stripHeaders = (html: Document) => {
  const header = html.querySelectorAll("header");
  for (const head of header) {
    head.remove();
  }
};

const stripFooters = (html: Document) => {
  const footer = html.querySelectorAll("footer");
  for (const foot of footer) {
    foot.remove();
  }
};

const stripNavs = (html: Document) => {
  const nav = html.querySelectorAll("nav");
  for (const n of nav) {
    n.remove();
  }
};

const stripParagrahs = (html: Document, words: number = 20) => {
  const p = html.querySelectorAll("p");
  for (const paragraph of p) {
    if (paragraph.textContent) {
      const text = paragraph.innerHTML.replace(/\s+/g, " ").split(" ");
      if (text.length > words) {
        paragraph.remove();
      }
    }
  }
};

const stripLongAttributes = (html: Document, length: number = 80) => {
  const elements = html.querySelectorAll("*");
  for (const element of elements) {
    for (const attribute of element.attributes) {
      if (attribute.value.length > length) {
        element.removeAttribute(attribute.name);
      }
    }
  }
};

/* String Based */

const stripComments = (html: string) => {
  const regex = /(<!--.*?-->)|(<!--[\w\W\n\s]+?-->)/g;
  return html.replace(regex, "");
};

const stripWhitespace = (html: string) => {
  html = html.replace(/\s+/g, " ");
  html = html.replace(/>\s+</g, "><");
  return html;
};

const stripAll = (html: Document) => {
  stripHead(html);
  stripScripts(html);
  stripStyles(html);
  stripNoScript(html);

  stripStructural(html);
  stripHeaders(html);
  stripFooters(html);
  stripNavs(html);
  stripParagrahs(html);
  stripLongAttributes(html);

  stripAttributes(html);
  stripClasses(html);
  stripEmpty(html);
};

const postProcess = (html: string) => {
  return stripWhitespace(stripComments(html));
};

export const processHtml = (
  filePath: string,
  html: string,
  tokenizeInput: boolean = false
) => {
  const tokenizer = new GPTTokenizer({ type: "gpt3" });

  const document = new JSDOM(html).window.document;

  stripAll(document);
  const processed = postProcess(document.documentElement.outerHTML);

  const newName = filePath.replace(".html", ".stripped.html");
  fs.writeFileSync(newName, processed);

  const initial = tokenizeInput ? tokenizer.encode(html).bpe.length : null;
  const after = tokenizer.encode(processed).bpe.length;
  console.log("tokens: ", initial, after);
  return processed;
};

if (process.argv[2] === "compress") {
  const filePath = process.argv[3];
  const tokenizeInput = process.argv[4] ? true : false;
  const html = fs.readFileSync(filePath, "utf8");
  processHtml(filePath, html, tokenizeInput);
}
