# playwright-har

![npm](https://img.shields.io/npm/v/playwright-har?color=blue)

playwright-har is capturing [HAR files](https://en.wikipedia.org/wiki/HAR_(file_format)) from browser network traffic and saves them to simplify debugging of failed tests.

## Credits

This is a port of [puppeteer-har](https://github.com/Everettss/puppeteer-har) that was adjusted to work with Playwright.

## Install

```
npm i --save playwright-har
```

## Usage

### Quick start

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

### Integration with [jest-playwright](https://github.com/playwright-community/jest-playwright) preset

In [CustomEnvironment.js](https://github.com/playwright-community/jest-playwright#usage-with-custom-testenvironment) :

```js
const PlaywrightEnvironment = require('jest-playwright-preset/lib/PlaywrightEnvironment').default
const { PlaywrightHar } = require('playwright-har');

class CustomEnvironment extends PlaywrightEnvironment {
    
    constructor(config, context) {
        super(config, context);
        this.playwrightHar;
    }
    
    async setup() {
        await super.setup();
        this.playwrightHar = new PlaywrightHar(this.global.page);
        await this.playwrightHar.start();
    }

    async handleTestEvent(event) {
        if (event.name == 'test_done') {
            const parentName = event.test.parent.name.replace(/\W/g, '-');
            const specName = event.test.name.replace(/\W/g, '-');
            await this.playwrightHar.stop(`./${parentName}_${specName}.har`);
        }
    }
}

module.exports = CustomEnvironment;
```

This setup will create `PlaywrightHar` instance for each spec file, collect browser network traffic from test execution and save it in `.har` file with name corresponding to spec name.

## Additional info

* HAR files collection works only on chromium browser
* `stop()` has an optional argument `path` - when specified, generated HAR file will be saved into provided path, otherwise it will be returned as an object

