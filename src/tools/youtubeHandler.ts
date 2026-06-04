import path from "path";
import { chromium } from "playwright";
import { expect } from "playwright/test";
import { spawn } from "child_process";
import type { Logger } from "./logging.js";
import { __projectRoot } from "./filePathResolver.js";

const YOUTUBE_AUDIO_CONVERTER_URL = 'https://v3.y2mate.nu/';

export async function downloadAudioFromYTbyWeb(url: string, downloadDir: string, logger: Logger): Promise<string> {
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

export async function downloadAudioFromYTbyScript(url: string, downloadDir: string, logger: Logger): Promise<string> {
    // return new Promise((resolve, reject) => {
    //     const ytDlp = spawn('yt-dlp', [
    //         '--format', 'bestaudio',
    //         '--output', path.join(downloadDir, '%(title)s.%(ext)s'),
    //         url
    //     ]);

    //     ytDlp.on('close', (code) => {
    //         if (code === 0) {
    //             logger.log('Audio downloaded successfully');
    //             // Note: This is a simplified approach. In a real application, you would need to extract the actual filename from the download process.
    //             resolve('downloaded_audio.mp3');
    //         } else {
    //             logger.log('Error occurred while downloading audio');
    //             reject(new Error('Failed to download audio'));
    //         }
    //     });

    //     ytDlp.on('error', (error) => {
    //         logger.log(`Error occurred: ${error instanceof Error ? error.message : String(error)}`);
    //         reject(error);
    //     });
    // });
    const ytDlpScriptPath = __projectRoot + '/yt-dlp/downloadYT.py';
    const pythonExecutablePath = __projectRoot + '/yt-dlp/.venv/Scripts/python.exe';
    return new Promise((resolve, reject) => {
        const pyDownloader = spawn(pythonExecutablePath, [ytDlpScriptPath]);
        let filename: string = '';

        // Input the URL to the Python script through stdin
        pyDownloader.stdin.write(JSON.stringify({ url, downloadDir}));
        pyDownloader.stdin.end();

        // Get output from the Python script
        pyDownloader.stdout.on('data', (data) => {
            logger.log(`Output from Python script: ${String(data)}`);
        });

        pyDownloader.stderr.on('data', (data) => {
            logger.log(`Error from Python script: ${String(data)}`);
        });

        pyDownloader.on('close', (data ,code: number) => {
            if (code === 0) {
            // Assuming the Python script outputs the filename of the downloaded audio on success
            const output = String(data).trim();
                try {
                    const parsedOutput: unknown = JSON.parse(output);
                    if (parsedOutput && typeof parsedOutput === 'object' && 'title' in parsedOutput && typeof parsedOutput['title'] === 'string') {
                        logger.log(`Audio downloaded successfully by Python script: ${parsedOutput['title']}`);
                        filename = parsedOutput['title'] + '.mp3'; // Assuming the script saves the file with .mp3 extension
                    }
                } catch (error) {
                    logger.log(`Error parsing Python script output: ${String(error)}`);
                }
                // logger.log('Audio downloaded successfully by Python script');
                resolve(filename);
            } else {
                logger.log(`Python script exited with code ${code}`);
                reject(new Error(`Python script failed with exit code ${code}`));
            }
        });
    });
}