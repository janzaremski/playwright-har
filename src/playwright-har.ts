import { harFromMessages } from 'chrome-har';
import { writeFileSync } from 'fs';
import { CDPSession, Page } from 'playwright-chromium';
import { PlaywrightHarConfig } from 'playwright-har-config';

export class PlaywrightHar {

    private page: Page;
    private client: CDPSession;
    private addResponseBodyPromises = [];
    private events = [];
    private config: PlaywrightHarConfig;

    constructor(page: Page, config: PlaywrightHarConfig = null) {
        this.page = page;

        if (config == null) {
          this.config = new PlaywrightHarConfig();
        }
    }

    async start() {
        //@ts-ignore
        // newCDPSession is only available for ChromiumBrowserContext
        this.client = await this.page.context().newCDPSession(this.page);
        await this.client.send('Page.enable');
        await this.client.send('Network.enable');
        const observe = [
            'Page.loadEventFired',
            'Page.domContentEventFired',
            'Page.frameStartedLoading',
            'Page.frameAttached',
            'Page.frameScheduledNavigation',
            'Network.requestWillBeSent',
            'Network.requestServedFromCache',
            'Network.dataReceived',
            'Network.responseReceived',
            'Network.resourceChangedPriority',
            'Network.loadingFinished',
            'Network.loadingFailed',
            'Network.getResponseBody'
        ];
        observe.forEach(method => {
            //@ts-ignore
            // Doesn't work when array contains symbols instead of strings
            this.client.on(method, params => {
                const harEvent = { method, params };
                this.events.push(harEvent);
                if (method === 'Network.responseReceived') {
                    if (this.config.recordResponses === false) {
                        return;
                    }
                    
                    const response = harEvent.params.response;
                    const requestId = harEvent.params.requestId;
                    // Response body is unavailable for redirects, no-content, image, audio and video responses
                    if (
                        response.status !== 204 &&
                        response.headers.location == null &&
                        !response.mimeType.includes('image') &&
                        !response.mimeType.includes('audio') &&
                        !response.mimeType.includes('video')
                    ) {
                        const addResponseBodyPromise = this.client.send('Network.getResponseBody', { requestId }).then(
                            responseBody => {
                                // Set the response so chrome-har can add it to the HAR file
                                harEvent.params.response = {
                                    ...response,
                                    body: Buffer.from(responseBody.body, responseBody.base64Encoded ? 'base64' : undefined).toString()
                                };
                            },
                            reason => { }
                        );
                        this.addResponseBodyPromises.push(addResponseBodyPromise);
                    }
                }
            });
        });
    }

    async stop(path?: string) {
        await Promise.all(this.addResponseBodyPromises);
        const harObject = harFromMessages(this.events, { includeTextFromResponseBody: this.config.recordResponses !== false });
        this.events = [];
        this.addResponseBodyPromises = [];
        if (path) {
            writeFileSync(path, JSON.stringify(harObject));
        }
        else {
            return harObject
        }

    }
}
