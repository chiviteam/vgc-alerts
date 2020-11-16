![Scrape latest vgc data](https://github.com/chiviteam/vgc-alerts/workflows/Scrape%20latest%20vgc%20data/badge.svg)

- using playwright to scrape vgc.be
- then transforming the scraped html to markdown files
- index.js contains (at the top) the GC to search for + the age we're looking for
- then we use github actions to trigger the scraping using a cron expression
- if the scraping was successful and new activities detected, then send a Wire message with the new activities
- if a failure occurred then send a Wire message notifying the error