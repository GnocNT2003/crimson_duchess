import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import type { ChatInputCommandInteraction } from 'discord.js';
import type Command from '../../types/commandTypes.js';
import { createLogger } from '../../tools/logging.js';
import { getLawDownloadsDir } from '../../tools/filePathResolver.js';

const logger = createLogger('crawl');

async function crawlAndDownload(pageUrl: string, downloadsDir: string): Promise<string> {
    logger.sep();
    logger.log(`START CRAWL`);
    logger.log(`Launching browser`);
    const browser = await chromium.launch({ headless: true });
    try {
        const context = await browser.newContext({ acceptDownloads: true });
        const page = await context.newPage();

        logger.log(`Navigating to ${pageUrl}`);
        await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        logger.log(`Page loaded: ${page.url()}`);

        const docLink = await page.evaluate(() => {
            const link = document.querySelectorAll('a.view-file')[0] as HTMLAnchorElement | undefined;
            return link?.href || null;
        });
        if (!docLink) {
            throw new Error('No PDF link found on the page.');
        }

        const response = await fetch(docLink);
        if (!response.ok) {
            throw new Error(`Failed to fetch document: ${response.status} ${response.statusText}`);
        }
        logger.log(`Found document link: ${docLink}`);

        const buffer = await response.arrayBuffer();
        const filename = docLink.split('/').pop() || `document_${Date.now()}.pdf`;
        logger.log(`Downloading document as ${filename}`);
        fs.writeFileSync(path.join(downloadsDir, filename), Buffer.from(buffer));

        return filename;
    } finally {
        logger.log(`Closing browser`);
        await browser.close();
    }
}

const crawlCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('crawl')
        .setDescription('Download a Vietnamese legal document PDF from a URL')
        .addStringOption((option) =>
            option
                .setName('url')
                .setDescription('The document page URL to crawl')
                .setRequired(true),
        ) as SlashCommandBuilder,

    async execute(interaction: ChatInputCommandInteraction) {
        const url = interaction.options.getString('url', true);

        try {
            new URL(url);
        } catch {
            await interaction.reply({ content: 'Invalid URL provided.',
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        await interaction.deferReply();

        try {
            const downloadsDir = getLawDownloadsDir();
            const filename = await crawlAndDownload(url, downloadsDir);
            await interaction.editReply(`PDF downloaded successfully: \`${filename}\``);
        } catch (error) {
            await interaction.editReply(
                `Failed to download PDF: ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    },
};

export default crawlCommand;
