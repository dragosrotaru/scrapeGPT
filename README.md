# scrapeGPT

ScrapeGPT is a tool which autogenerates sdks around websites using LLMs

This package contains a number of useful sub-modules which are useful in their own right for highly
generalized tasks.

## Usage

`npm start -- <args>`

leave args empty to see instructions for commands.

use `--url http://localhost` argument to run tests (located in experiments/data).

Example:

1. `npm run serve experiments/data/localhost/alpha`
2. `npm start -- generate -u http://localhost/alpha`

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
