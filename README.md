# scrapeGPT

**Can an LLM learn to operate a website it has never seen?** scrapeGPT is a 2023 research prototype that tests this on HTML forms. It points GPT-3.5 at a page, has it write the browser-automation code, then runs that code against the live site and measures what happened.

Each step is a stage in a reproducible [DVC](https://dvc.org) pipeline. Every prompt variant, compression setting and outcome is tracked as an experiment.

```
URL ─► retrieve ─► compress ─► generate code ─► generate test input ─► infer schema ─► execute & measure
      (Puppeteer)  (jsdom,     (GPT writes a    (GPT writes realistic  (JSON → type AST   (run in Chrome, watch
                    ~90% fewer  Puppeteer fill   example props for      → Zod validator)   navigations, POSTs,
                    tokens)     function)        that function)                            XHRs)
```

## How it works

**1. Retrieve.** Puppeteer loads the page and saves the HTML and page metadata. Stages can attach to an already running Chrome on `:9222` and share one browser session ([`src/puppeteer/browser.ts`](src/puppeteer/browser.ts)).

**2. Compress the DOM to fit the context window.** Raw HTML is mostly noise to an LLM. [`src/html/compress.ts`](src/html/compress.ts) makes one configurable jsdom pass. It removes scripts, styles, SVGs, comments and empty nodes, caps text and attribute lengths, and drops chosen attributes. Form-relevant elements (`FORM`, `INPUT`, `SELECT`, `BUTTON`) are always kept. Output is measured with a GPT BPE tokenizer.

On the test pages this cut prompt size by about 90% (1,225 → 105 and 2,046 → 214 tokens).

**3. Generate the automation code.** The compressed page goes to `gpt-3.5-turbo-16k` with a prompt asking for a single Puppeteer function that fills in and submits the form ([`src/forms/code.ts`](src/forms/code.ts)). LLM output is messy, so [`src/gpt.ts`](src/gpt.ts) pulls the code block out of the reply. [`src/lint.ts`](src/lint.ts) then auto-fixes it with ESLint and formats it with Prettier before anything runs.

**4. Generate test input.** A second GPT call reads the generated function and writes a realistic example of the props it expects ([`src/forms/props.ts`](src/forms/props.ts)).

**5. Infer a schema and emit a validator.** [`src/json/ast.ts`](src/json/ast.ts) folds example JSON into a union-aware type AST: objects with different key sets become separate union members. [`src/json/generate.ts`](src/json/generate.ts) turns that into [Zod](https://zod.dev) source code, turning low-cardinality strings and numbers into enums or literal unions. The emitted validator is checked against the example it came from.

**6. Execute and measure.** [`src/puppeteer/testbed.ts`](src/puppeteer/testbed.ts) runs the generated function against the live page with request interception on. It records page navigations, intercepted form POSTs (with bodies) and XHR responses. It tells failures in the generated code apart from failures in the harness.

### Experiment tracking

Every CLI command goes through a generic stage runner ([`src/stage.ts`](src/stage.ts)). The runner loads the stage's inputs, runs it, and writes its outputs and a metrics file to `data/<host>/<path>/`. [`dvc.yaml`](dvc.yaml) chains the stages per target page. [`src/params.json`](src/params.json) exposes the prompt wording, prompt formatting and compression options as DVC params. Changing a prompt or a compression rule is therefore a tracked experiment, and the metrics include token counts, timings and outcomes.

## Usage

Requires Node 18+, pnpm and an OpenAI API key.

```bash
pnpm install
cp .env.example .env              # set OPENAI=<your key>

npm start -- html retrieve -u <url>
npm start -- html compress -u <url>
npm start -- form code     -u <url>
npm start -- form props    -u <url>
npm start -- form schema   -u <url>
npm start -- form fill     -u <url>
```

You can also run the whole pipeline over the pages in [`params.yaml`](params.yaml) with `dvc repro`. Outputs go to `data/`, which is not committed.

## Status and limitations

This is an experimental prototype from 2023, and it's no longer maintained. Be aware of the following:

- **Generated code runs with `eval` and no sandbox.** Only point it at pages and models you trust.
- **Small sample.** It was evaluated on two local test forms and one real site. Results were mixed: one test form navigated correctly, and on the real site the generated code triggered 3 form submissions before the harness errored. Treat it as a proof of concept, not a benchmark.
- **Unfinished pieces:**
  - The DOM tree-similarity module ([`src/html/similarity.ts`](src/html/similarity.ts)) and the interaction recorder ([`src/puppeteer/recorder/`](src/puppeteer/recorder/)) are incomplete and not wired in.
  - The structural-tag compression option is a TODO.
  - `src/metrics.ts` (CSV export) doesn't run.
- **Old dependencies.** It uses the legacy `openai` v3 SDK, and the model is hard-coded to GPT-3.5.

## Where it was heading

Form filling was the first step toward a broader goal: generating a typed client for any website automatically. That would mean classifying page regions (datasets, detail records, forms, rich apps), detecting blockers (Cloudflare, captchas, login walls, consent banners), and choosing the cheapest way to interact with each one (HTTP query, form POST, hidden JSON API or DOM automation). It would then validate the extracted data against schemas built from the most structurally different sample pages.
