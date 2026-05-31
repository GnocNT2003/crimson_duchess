import path from "path";
import { chromium } from "playwright";
import { expect } from "playwright/test";
import type { Logger } from "./logging.js";

const YOUTUBE_AUDIO_CONVERTER_URL = 'https://v3.y2mate.nu/';

export async function downloadAudioFromYoutube(url: string, downloadDir: string, logger: Logger): Promise<string> {
    logger.log('Launching browser');
    const browser = await chromium.launch({ headless: true });
    try {
        const context = await browser.newContext({ acceptDownloads: true });
        const page = await context.newPage();

        logger.log(`Navigating to ${YOUTUBE_AUDIO_CONVERTER_URL}`);
        await page.goto(YOUTUBE_AUDIO_CONVERTER_URL, { waitUntil: 'load', timeout: 30000 });
        logger.log(`Page loaded: ${page.url()}`);

        const inputUrl = page.locator('input#video');
        logger.log(`Filling in the URL: ${url}`);
        await inputUrl.fill(url);

        const convertButton = page.locator('button[type=submit]');
        logger.log('Clicking convert button');
        await convertButton.click();
        
        try {
            const downloadEvent = page.waitForEvent('download', { timeout: 300000 });
            const downloadButton = page.locator('button.download[type=button]');
            logger.log('Waiting for download button to be enabled');
            await expect(downloadButton).toBeEnabled({ timeout: 30000 });
            logger.log('Clicking download button');
            await downloadButton.click();

            logger.log('Downloading file');
            const download = await downloadEvent;

            logger.log(`Saving downloaded file to disk as ${download.suggestedFilename()}`);
            await download.saveAs(path.join(downloadDir, download.suggestedFilename()));

            return download.suggestedFilename();
        }
        catch(error) {
            logger.log(`Error occurred during download: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    catch (error) {
        logger.log(`Error when processing browser ${String(error)}`);
        throw error;
    }
    finally {
        logger.log('Closing browser');
        await browser.close();
    }
}