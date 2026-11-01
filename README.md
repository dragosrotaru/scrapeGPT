# scrapeGPT

Generate scrapers and typed SDKs for arbitrary websites with LLM code generation.

Given a URL, scrapeGPT loads the page in headless Chrome, compresses the DOM into a token-efficient form, asks GPT to identify forms and datasets, then generates a JSON schema, extraction code and form-filling code. It lints and tests the generated code against the live page. Each step is a stage in a [DVC](https://dvc.org) pipeline (`dvc.yaml`), so runs are reproducible and every stage writes metrics.

Built in 2023 as an experiment, and no longer maintained.

## Setup

```bash
pnpm install
cp .env.example .env   # add your OpenAI API key
```

## Usage

`npm start -- <args>`. Run it with no arguments to list the commands.

Local test pages live in `data/localhost/` (tracked with DVC, not git):

1. `npm run serve data/localhost/alpha`
2. `npm start -- generate -u http://localhost/alpha`

Pipeline outputs and scraped pages are written to `data/` and stay local. Only the DVC pointers are committed.

## Layout

```
src/
  html/       retrieve pages (Puppeteer), compress the DOM, measure tree similarity
  forms/      detect form props, generate schemas and form-filling code
  json/       JSON to schema and AST type generation
  puppeteer/  browser and recorder helpers
  gpt.ts      OpenAI client and token accounting
  lint.ts     lint generated code before running it
  stage.ts    pipeline stage wrapper (params, metrics)
docs/         design notes
```

## Features

## Content Classification

identify and label the different top level components of a web page to form a model of it

-   dataset - contains a set of similar data
-   datamember - contains the details for a particular instance of a dataset
-   information - like a singleton datamember, displaying general info as well as phone, email, address, name, hours, etc
-   form - an interactable section of the website, like a submittable form
-   application - a complex component representing a rich model

## Blocker Detection and Circumvention

identify various blocking mechanisms that will prevent interactors from working correctly

-   cloudflare block
-   popup banner
-   geo block
-   login
-   capacha
-   data stored in image

## Strategy Selection

For every content there are multiple possible interactors:

-   http POST forms
-   http url queries
-   JSON APIs
-   DOM manipulation

## General Strategy Structure

-   extractors
-   schema
-   test data
-   tests

## Strategy Management

At a higher level, we have the concept of managing the interactions over time. this can include:

-   throttling
-   polling for new data
-   keeping a cache fresh
-   change detection
-

## dataset

-   pagination

## dataset-form search

-   parameter index generation

## Interactor Chaining

-   multi source models

## TODO

-   generate synthetic test data using gpt
-   refactor formfill to work with field granularity
    -   standardize optional field typeguard
    -   test that selectors work on both compressed and original
    -   check that the field was changed using event listener
-   improve schema generation to be more specific
-   detect optional and required props
-   detect all options in the case of selection fields
-   request types when generating code and use those instead of making a second call to chatgpt (also gives us a typed sdk)
-   get gpt to fix its own runtime errors
-   get gpt to fix its own linting errors
-   write custom linting rules
-   refactor compress to focus on main, form, button, field, input, select, etc and dom elements with event handlers
-   refactor retrieve to identify all dom elements which have event handlers defined in javascript and use metadata in compression and generator
-   optimize compression algorithm by checking token count or length and iteratively applying compression techniques
-   optimize compression algorithm using reinforcement learning
-   add metrics aggregation methods and produce metrics in the standard format
-   implement use of experiments
-   refactor stage interfaces to be Exact/Partial return type and infer deps
-   refactor generate to produce code without chatgpt in the simple cases (performance)

### Generating a Results Validation Schema

-   pick a subset of the data based on the Tree Edit Distance algorithm (picking most dissimilar trees)
-   generate a validation schema and scraper for each member of this subset using a language model like chatGPT
-   merge the schema and scraper into one
-   scrape all of the data with the scraper
-   check the data againt the schema. for all exceptions:
    -   pass the exception to ehance the schema with narrower types

### Reverse Engineering Mobile APIs

https://medium.com/@navyab_66433/mitm-proxy-for-android-emulators-cf4c8e909aac

download apk from https://m.apkpure.com/
modify it apk-mitm
run mitmweb (mitmproxy)
run emulator -avd PIXEL_XL_API_30 -http-proxy http://127.0.0.1:8080
install certificate by going to mitm.it website and downloading, then going to settings and installing it
turn on and off airplane mode, restart
try again

## Business Strategy

-   sell scraping as a service finding clients on upwork (scrape upwork and process those jobs for insights)
-   tailor the system for a specific task, like auto applying to jobs.
-   pregenerate datasets
-   automate lead gen
-   scraping platform (more control into how it operates)
-   scraping sdk
