# scraper

1. Compile a list of websites with high value data
2. detect the type of scraping that it needs
   1. indexing, session management, evasion detection, chapacha
   2. api or html
3. write a crawler get html for all pages

With GPT in an iterative loop:

- pick a subset of the data based on the Tree Edit Distance algorithm (picking most dissimilar trees)
- generate a validation schema and scraper for each member of this subset using a language model like chatGPT
- merge the schema and scraper into one
- scrape all of the data with the scraper
- check the data againt the schema. for all exceptions:
  - pass the exception to
- ehance the schema with narrower types

genCrawler: url -> url -> HTML[]
crawl: url -> HTML[]

genScraper: HTML[] -> HTML -> JSON
scraper: HTML -> JSON

genValidator: JSON[] -> JSON -> bool
validator: JSON -> bool

1. write a schema using the basic JSON types

# Reverse Engineering Mobile APIs

https://medium.com/@navyab_66433/mitm-proxy-for-android-emulators-cf4c8e909aac

download apk from https://m.apkpure.com/
modify it apk-mitm
run mitmweb (mitmproxy)
run emulator -avd PIXEL_XL_API_30 -http-proxy http://127.0.0.1:8080
install certificate by going to mitm.it website and downloading, then going to settings and installing it
turn on and off airplane mode, restart
try again

## Automated Private API SDK gwen

1. run a session and capture all network requests (mobile + web)
2. sort requests based on likelyhood of value
3. generate retriever functions
4. generate parameter - response example dataset
5. generate validation functions
6. generate SDK
7. generate Documentation
8. generate throttling, change detection, identity management, etc scaffolding
