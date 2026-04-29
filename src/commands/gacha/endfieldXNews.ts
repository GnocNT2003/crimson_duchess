import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import type { ChatInputCommandInteraction } from "discord.js";
import type Command from "../../types/commandTypes.js";
import { createLogger } from "../../tools/logging.js";
import { chromium } from "playwright";

const ENDFIELD_X_NEWS_URL = "https://x.com/AKEndfield";
const logger = createLogger("endfield-x-news");

async function fetchLatestNewsLink(): Promise<{ url: string, content: string, imageUrl?: string }> {
    logger.sep();
    logger.log(`START ${ENDFIELD_X_NEWS_URL}`);
    logger.log(`Launching browser`);
    const browser = await chromium.launch({ headless: true });
    try {
        const context = await browser.newContext({ locale: 'vi-VN' });
        const page = await context.newPage();

        logger.log(`Navigating to ${ENDFIELD_X_NEWS_URL}`);
        await page.goto(ENDFIELD_X_NEWS_URL, { waitUntil: 'load', timeout: 30000 });
        logger.log(`Page loaded: ${page.url()}`);

        const tweetFeed = page.locator('article.r-1loqt21[data-testid="tweet"]');
        try {
            const tweets = tweetFeed.nth(1);
            await tweets.click();
            logger.log(`Clicked on the second tweet to open details.`);

            const latestNewsLink = page.url().replace(/\/photo\/\d+$/, '');
            logger.log(`Latest news link: ${latestNewsLink}`);

            const newsContent = await page.locator('article div[dir="auto"] span').first().textContent();
            logger.log(`News content: ${newsContent ? newsContent.trim() : "No content found"}`);
            const imageSrc = await page.locator('article img[alt="Hình ảnh"]').first().getAttribute('src');
            logger.log(`Image URL: ${imageSrc ? imageSrc : "No image found"}`);

            return { url: latestNewsLink, content: newsContent ? newsContent.trim() : "No content found", imageUrl: imageSrc ?? undefined };
        }
        catch (error) {
            logger.log(`Error occurred while fetching latest news: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    finally {
        logger.log(`Closing browser`);
        await browser.close();
        logger.sep();
    }
}

const endfieldXNewsCommand: Command = {
    data: new SlashCommandBuilder()
        .setName("endfield-x-news")
        .setDescription("Get the latest news from Arknights Endfield X page."),

    execute: async (interaction: ChatInputCommandInteraction) => {
        await interaction.deferReply();

        try {
            const { url: latestNewsLink, content: newsContent, imageUrl } = await fetchLatestNewsLink();
            const embeddedReply = new EmbedBuilder()
                .setTitle("Arknights Endfield (@AKEndfield)")
                .setURL(latestNewsLink)
                // .setDescription(newsContent)
                .setImage(imageUrl || latestNewsLink + "/photo/1")
                .setThumbnail(imageUrl || latestNewsLink + "/photo/1")
                .setTimestamp()
                .setColor(0x1DA1F2);
            await interaction.editReply({ content: newsContent, embeds: [embeddedReply] });
        } catch (error) {
            await interaction.editReply(
                `Failed to fetch latest news: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }
}

export default endfieldXNewsCommand;
