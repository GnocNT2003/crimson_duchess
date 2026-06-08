import path from "path";
import { chromium } from "playwright";
import { expect } from "playwright/test";
import { spawn } from "child_process";
import type { Logger } from "./logging.js";
import { __projectRoot } from "./filePathResolver.js";
import { YoutubeUrlType } from "../types/youtubeUrlTypes.js";

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

            return path.join(downloadDir, download.suggestedFilename());
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

export async function downloadAudioFromYTbyScript(url: string, downloadDir: string, logger: Logger): Promise<{filePath: string, title: string}> {
    const ytDlpScriptPath = __projectRoot + '/yt-dlp/downloadYT.py';
    const pythonExecutablePath = process.platform === 'win32'
        ? __projectRoot + '/yt-dlp/.venv/Scripts/python.exe'
        : __projectRoot + '/yt-dlp/.venv/bin/python';
    return new Promise((resolve, reject) => {
        const pyDownloader = spawn(pythonExecutablePath, [ytDlpScriptPath]);
        let filePath: string = '';
        let title: string = '';


        // Input the URL to the Python script through stdin
        pyDownloader.stdin.write(JSON.stringify({ url, downloadDir}));
        pyDownloader.stdin.end();

        // Get output from the Python script
        pyDownloader.stdout.on('data', (data) => {
            logger.log(`Output from Python script: ${String(data)}`);

            // Attempt to parse the output as JSON to extract progress and filename information
            try {
                const parsedOutput: unknown = JSON.parse(String(data));
                if (parsedOutput && typeof parsedOutput === 'object' && 'status' in parsedOutput) {
                    if (parsedOutput['status'] === 'downloading') {
                        if ('progress' in parsedOutput && 'speed' in parsedOutput && 'eta' in parsedOutput) {
                            logger.log(`Download progress: ${String(parsedOutput['progress'])}, Speed: ${String(parsedOutput['speed'])}, ETA: ${String(parsedOutput['eta'])}`);
                        }
                    } else if (parsedOutput['status'] === 'finished') {
                        logger.log('Download finished, processing file...');
                        if ('filename' in parsedOutput) {
                            filePath = String(parsedOutput['filename']);
                            logger.log(`Audio downloaded successfully by Python script: ${filePath}`);

                        }
                    } else if (parsedOutput['status'] === 'done') {
                        if ('title' in parsedOutput) {
                            title = String(parsedOutput['title']);
                        }
                    }
                }
            } catch (error) {
                logger.log(`Error parsing Python script output: ${String(error)}`);
            }
        });

        pyDownloader.stderr.on('data', (data) => {
            logger.log(`Error from Python script: ${String(data)}`);
        });

        pyDownloader.on('close', (code) => {
            if (code !== 1) {
                resolve({filePath, title});
            } else {
                logger.log(`Python script exited with code ${code}`);
                reject(new Error(`Python script failed with exit code ${code}`));
            }
        });
    });
}

export function extractYoutubeUrl(url: string, urlType: YoutubeUrlType): string {
    try {
        const hostname = new URL(url).hostname;
        if (!(hostname.includes('youtube') || hostname.includes('youtu.be'))) {
            throw new Error(`Invalid hostname: ${hostname}. Required Youtube url.`);
        }
        
    } catch (error) {
        throw new Error(`Error occurred while extracting YouTube URL: ${String(error)}`);
    }
    
    const urlParamsList = url.split('&');
    if (urlParamsList.length === 0) {
        throw new Error(`Invalid URL format: ${url}`);
    }

    switch (urlType) {
        case YoutubeUrlType.Video:
            if (!urlParamsList.some(param => param.includes('v='))) {
                throw new Error(`Video URL must contain 'v=' parameter: ${url}`);
            }
            return urlParamsList[0];
        case YoutubeUrlType.Playlist:
            if (!urlParamsList.some(param => param.startsWith('list='))) {
                throw new Error(`Playlist URL must contain 'list=' parameter: ${url}`);
            }
            return url;
        case YoutubeUrlType.Channel:
            if (!urlParamsList.some(param => param.includes('@') || param.includes('channel/'))) {
                throw new Error(`Channel URL must contains '@' or 'channel/' segment: ${url}`);
            }
            return url;
        default:
            return url;
    }
}