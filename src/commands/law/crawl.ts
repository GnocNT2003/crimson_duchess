import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import type { ChatInputCommandInteraction } from 'discord.js';
import type Command from '../../types/commandTypes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getDownloadsDir(): string {
    // src/commands/law -> src/commands -> src -> project root (dev)
    // dist/commands/law -> dist/commands -> dist -> project root (prod)
    const projectRoot = path.resolve(__dirname, '..', '..', '..');
    const dir = path.join(projectRoot, 'downloads');
    fs.mkdirSync(dir, { recursive: true });
    return dir;
}

function extractFilename(contentDisposition: string, fallbackUrl: string): string {
    const match = contentDisposition.match(/filename\*?=(?:UTF-8'')?([^;\n]+)/i);
    if (match) {
        try {
            return decodeURIComponent(match[1].replace(/['"]/g, '').trim());
        } catch {
            return match[1].replace(/['"]/g, '').trim();
        }
    }
    const urlPath = new URL(fallbackUrl).pathname;
    return path.basename(urlPath) || `document_${Date.now()}.pdf`;
}

const SEPARATOR = `[crawl] ${'─'.repeat(60)}`;

function log(message: string): void {
    console.log(`[crawl] ${new Date().toISOString()} ${message}`);
}

async function crawlAndDownload(pageUrl: string, downloadsDir: string): Promise<string> {
    console.log(SEPARATOR);
    log(`START ${pageUrl}`);
    log(`Launching browser`);
    const browser = await chromium.launch({ headless: true });
    try {
        const context = await browser.newContext({ acceptDownloads: true });
        const page = await context.newPage();

        log(`Navigating to ${pageUrl}`);
        await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        log(`Page loaded: ${page.url()}`);

        // Strategy 1: find a PDF URL embedded in the page (iframe/embed/object/anchor)
        log(`Scanning page for embedded PDF URL`);
        const embeddedPdfUrl = await page.evaluate((): string | null => {
            const selectors: string[] = [
                'embed[src]',
                'object[data]',
                'iframe[src]',
                'a[href]',
            ];
            for (const sel of selectors) {
                for (const el of Array.from(document.querySelectorAll(sel))) {
                    const src =
                        el instanceof HTMLObjectElement
                            ? el.data
                            : el instanceof HTMLAnchorElement
                              ? el.href
                              : (el as HTMLIFrameElement | HTMLEmbedElement).src;
                    if (src && /\.pdf(\?|#|$)/i.test(src)) return src;
                }
            }
            return null;
        });

        if (embeddedPdfUrl) {
            log(`Found embedded PDF URL: ${embeddedPdfUrl}`);
            log(`Fetching PDF via request`);
            const response = await page.request.get(embeddedPdfUrl);
            if (!response.ok()) throw new Error(`HTTP ${response.status()} fetching PDF`);
            const buffer = await response.body();
            log(`Received ${buffer.byteLength} bytes`);
            const filename = extractFilename(
                response.headers()['content-disposition'] ?? '',
                embeddedPdfUrl,
            );
            const safeName = /\.pdf$/i.test(filename) ? filename : `${filename}.pdf`;
            const savePath = path.join(downloadsDir, safeName);
            fs.writeFileSync(savePath, buffer);
            log(`Saved to ${savePath}`);
            return safeName;
        }

        // Strategy 2: click a download button/link and intercept the download event
        log(`No embedded PDF found, looking for download button`);
        const downloadTrigger = await page.$(
            '[class*="download" i], [id*="download" i], ' +
            'a:has-text("Tải về"), a:has-text("Tải xuống"), a:has-text("Tải"), ' +
            'button:has-text("Tải")',
        );

        if (downloadTrigger) {
            log(`Found download trigger, clicking`);
            const downloadPromise = page.waitForEvent('download');
            await downloadTrigger.click();
            log(`Waiting for download event`);
            const download = await downloadPromise;
            const filename = download.suggestedFilename() || `document_${Date.now()}.pdf`;
            const savePath = path.join(downloadsDir, filename);
            log(`Download started: ${filename}`);
            await download.saveAs(savePath);
            log(`Saved to ${savePath}`);
            return filename;
        }

        throw new Error('No PDF link or download button found on the page.');
    } finally {
        log(`Closing browser`);
        await browser.close();
        console.log(SEPARATOR);
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
            const downloadsDir = getDownloadsDir();
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
