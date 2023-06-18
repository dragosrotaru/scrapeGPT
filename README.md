# scrapeGPT

ScrapeGPT is a tool which autogenerates a web scraping sdk using machine learning.

It is intended for data driven web interfaces which contain a lot of similar data.
Usually these are websites which have a database behind the scenes. It is not intended
for content scraping (for example blogs), although with some adjustment that can be done as well.

This package contains a number of useful sub-modules which are useful in their own right for highly
generalized tasks.

## Usage

`npm start -- <args>`

leave args empty to see instructions for commands.

use `--url http://localhost` argument to run tests (located in experiments/data).

Example:

1. `npm run serve experiments/data/localhost/alpha`
2. `npm start -- generate -u http://localhost -i alpha`

## Architecture

There are a number of manually intensive operations that this system automates.

Given that you have the url to an indexing webpage or results page, the basic process is as follows:

### Index

-   detect if the webpage contains a search form, results or a combination
-   detect if the webpage can be circumvented by url query parameters or if it has an api by looking at the network requests and responses
-   bypass scraping prevention techniques and interfering popups like cookie notices
-   generate code to fill in the search form parameters or url query
-   generate test data, tests and a well typed parameter schema
-   generate change detection code

### Crawl

-   generate code to index the webpage by providing full coverage of the parameter space with a minimal number of search requests
-   manage thottling and crawling continuously over time

### Process Results

-   generate code to extract the data from results list and detail pages
-   handle pagination
-   generate a validation schema and types, iteratively improving it as more data is available
-   generate tests and test data
-   generate change detection code
-   populate a cache and provide a well typed api over it

## TODO

### Structural and Testability

-   refactor wrapCode to add instrumentation for measuring results:

    -   detect failure to fill form elements
    -   detect failure to trigger a form submission (register event handler, watch for page reload or network activity)
    -   output a report in structured format which can be used to feed back into chatgpt

-   generate synthetic test data using gpt
-   refactor retrieve to identify all dom elements which have event handlers defined in javascript
-   refactor generate to work on a per field basis
-   refactor generate to produce code without chatgpt in the simple case

-   refactor usage of puppeteer
-   generate validator schema for JSON
-   prompt change management and testing

### Better Results

-   get gpt to fix its own runtime errors
-   get gpt to fix its own linting or compiler errors
-   write custom linter for gpt code
-   pass title and description into JSON generation

### Wider Applicability

-   add compression to focus on forms, main content
-   refactor compress to focus on forms, buttons, fields, inputs and dom elements which have built in interactivity (incl defined eventHandlers like onClick)
-   optimize compression algorithm by checking token count or length and iteratively applying compression techniques
-   optimize compression algorithm using reinforcement learning

### Further Results

-   get gpt to generate results extractor
-   parameter faker and indexer

### Generating a validation Schema

-   pick a subset of the data based on the Tree Edit Distance algorithm (picking most dissimilar trees)
-   generate a validation schema and scraper for each member of this subset using a language model like chatGPT
-   merge the schema and scraper into one
-   scrape all of the data with the scraper
-   check the data againt the schema. for all exceptions:
    -   pass the exception to ehance the schema with narrower types

genCrawler: url -> url -> HTML[]
crawl: url -> HTML[]

genScraper: HTML[] -> HTML -> JSON
scraper: HTML -> JSON

genValidator: JSON[] -> JSON -> bool
validator: JSON -> bool

1. write a schema using the basic JSON types

## Additional Features

### Reverse Engineering Mobile APIs

https://medium.com/@navyab_66433/mitm-proxy-for-android-emulators-cf4c8e909aac

download apk from https://m.apkpure.com/
modify it apk-mitm
run mitmweb (mitmproxy)
run emulator -avd PIXEL_XL_API_30 -http-proxy http://127.0.0.1:8080
install certificate by going to mitm.it website and downloading, then going to settings and installing it
turn on and off airplane mode, restart
try again

### Automated Generation of SDK around Private APIs

1. capture all network requests (mobile + web)
2. sort requests based on likelyhood of value
3. generate retriever functions
4. generate parameter - response example dataset
5. generate validation functions
6. generate documented and typed SDK
7. generate throttling, change detection, identity management, etc scaffolding
