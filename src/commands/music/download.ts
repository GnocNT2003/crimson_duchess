import { MessageFlags, SlashCommandBuilder } from "discord.js";
import type { ChatInputCommandInteraction } from "discord.js";
import type Command from "../../types/commandTypes.js";
import { createLogger } from "../../tools/logging.js";
import { chromium } from "playwright";
import { expect } from "playwright/test";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const YOUTUBE_AUDIO_CONVERTER_URL = 'https://v3.y2mate.nu/';

const logger = createLogger("download");

function getTempDownloadsDir(): string {
    const projectRoot = path.resolve(__dirname, '..', '..', '..');
    const dir = path.join(projectRoot, 'temp');
    fs.mkdirSync(dir, { recursive: true });
    return dir;
}

async function downloadAudioFromYoutube(url: string, downloadDir: string): Promise<string> {
    logger.sep();
    logger.log(`START downloading audio from ${url}`);
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
    finally {
        logger.log('Closing browser');
        await browser.close();
        logger.sep();
    }
}

const downloadCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('download')
        .setDescription('Download audio from a YouTube video URL')
        .addStringOption((option) =>
            option
                .setName('url')
                .setDescription('The Youtube URL to download audio from')
                .setRequired(true),
        ) as SlashCommandBuilder,

    async execute(interaction: ChatInputCommandInteraction) {
        const url = interaction.options.getString('url', true);

        try {
            const hostname = new URL(url).hostname;
            // logger.log(`Parsed hostname from URL: ${hostname}`);
            if (!hostname.includes('youtube')) {
                await interaction.reply({content: 'Invalid hostname. Required Youtube url.',
                    flags: MessageFlags.Ephemeral
                });
                return;
            };
        } catch {
            await interaction.reply({content: 'Invalid URL provided.', 
                flags: MessageFlags.Ephemeral
            });
            return;
        }
        
        await interaction.deferReply();

        try {
            const downloadsDir = getTempDownloadsDir();
            const filename = await downloadAudioFromYoutube(url, downloadsDir);
            await interaction.editReply(`Audio downloaded successfully: \`${filename}\``);
        } catch (error) {
            await interaction.editReply(
                `Failed to download audio: ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    },
};

export default downloadCommand;