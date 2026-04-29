import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import type { ChatInputCommandInteraction } from "discord.js";
import type Command from "../../types/commandTypes.js";
import { log, logSep } from "../../tools/logging.js";
import { chromium } from "playwright";

const ENDFIELD_X_NEWS_URL = "https://x.com/AKEndfield";

async function fetchLatestNewsLink(commandName: string): Promise<{ url: string, content: string , imageUrl?: string}> {
    logSep(commandName);
    log(commandName, `START ${ENDFIELD_X_NEWS_URL}`);
    log(commandName, `Launching browser`);
    const browser = await chromium.launch({ headless: true });
    try {
        const context = await browser.newContext({ locale: 'vi-VN' });
        const page = await context.newPage();

        log(commandName, `Navigating to ${ENDFIELD_X_NEWS_URL}`);
        await page.goto(ENDFIELD_X_NEWS_URL, { waitUntil: 'load', timeout: 30000 });
        log(commandName, `Page loaded: ${page.url()}`);
        
        const tweetFeed = page.locator('article.r-1loqt21[data-testid="tweet"]');
        try {
            const tweets = tweetFeed.nth(1);
            await tweets.click();
            log(commandName, `Clicked on the second tweet to open details.`);

            const latestNewsLink = page.url().replace(/\/photo\/\d+$/, '');;
            log(commandName, `Latest news link: ${latestNewsLink}`);
            
            const newsContent = await page.locator('article div[dir="auto"] span').first().textContent();
            const imageSrc = await page.locator('article img[alt="Hình ảnh"]').first().getAttribute('src');

            return { url: latestNewsLink, content: newsContent? newsContent.trim() : "No content found", imageUrl: imageSrc? imageSrc : undefined };
        }
        catch (error) {
            log(commandName, `Error occurred while fetching latest news: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }
    finally {
        log(commandName, `Closing browser`);
        await browser.close();
        logSep(commandName);
    }

}

const endfieldXNewsCommand: Command = {
    data: new SlashCommandBuilder()
        .setName("endfield-x-news")
        .setDescription("Get the latest news from Arknights Endfield X page."),

    execute: async (interaction: ChatInputCommandInteraction) => {
        await interaction.deferReply();

        
        try {
            const { url: latestNewsLink, content: newsContent, imageUrl } = await fetchLatestNewsLink(interaction.commandName);
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