# playwright-har

![npm](https://img.shields.io/npm/v/playwright-har?color=blue)

playwright-har is capturing [HAR files](https://en.wikipedia.org/wiki/HAR_(file_format)) from browser network traffic and saves them to simplify debugging of failed tests.

## Credits

This is a port of [puppeteer-har](https://github.com/Everettss/puppeteer-har) that was adjusted to work in Playwright.

## Install

```
npm i --save playwright-har
```

## Usage

```ts
import { chromium } from 'playwright'
import { PlaywrightHar } from 'playwright-har'

(async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    const playwrightHar = new PlaywrightHar(page);
    await playwrightHar.start();

    await page.goto('http://whatsmyuseragent.org/');
    // ... other actions ...

    await playwrightHar.stop('./example.har');
    await browser.close();
})();
```

## Additional info

* HAR files collection works only on chromium browser
* `stop()` has an optional argument `path` - when specified, generated HAR file will be saved into provided path, otherwise it will be returned as an object

