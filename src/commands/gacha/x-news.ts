import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import type { ChatInputCommandInteraction } from "discord.js";
import type Command from "../../types/commandTypes.js";
import { createLogger } from "../../tools/logging.js";
import { chromium } from "playwright";

const GAME_OPTIONS = [
    { name: "Genshin Impact",        value: "genshin",  url: "https://x.com/GenshinImpact",    displayName: "Genshin Impact (@GenshinImpact)",         color: 0x4A90D9 },
    { name: "Honkai Star Rail",       value: "hsr",      url: "https://x.com/HonkaiStarRail",   displayName: "Honkai: Star Rail (@HonkaiStarRail)",      color: 0x9B59B6 },
    { name: "Zenless Zone Zero",      value: "zzz",      url: "https://x.com/ZZZ_EN",           displayName: "Zenless Zone Zero (@ZZZ_EN)",              color: 0xF39C12 },
    { name: "Chaos Zero Nightmare",   value: "czn",      url: "https://x.com/ChaosZeroNM",      displayName: "Chaos Zero Nightmare (@ChaosZeroNM)",      color: 0xE74C3C },
    { name: "Arknights Endfield",     value: "endfield", url: "https://x.com/AKEndfield",       displayName: "Arknights Endfield (@AKEndfield)",         color: 0x1DA1F2 },
    { name: "Azur Lane",              value: "azurlane", url: "https://x.com/AzurLane_EN",      displayName: "Azur Lane (@AzurLane_EN)",                 color: 0x3498DB },
] as const;

type GameValue = typeof GAME_OPTIONS[number]["value"];

const GAME_MAP = Object.fromEntries(
    GAME_OPTIONS.map((g) => [g.value, g])
) as Record<GameValue, typeof GAME_OPTIONS[number]>;

const logger = createLogger("x-news");

async function fetchLatestTweet(xUrl: string): Promise<{ url: string; content: string; imageUrl?: string }> {
    logger.sep();
    logger.log(`START ${xUrl}`);
    logger.log(`Launching browser`);
    const browser = await chromium.launch({ headless: true });
    try {
        const context = await browser.newContext({ locale: "vi-VN" });
        const page = await context.newPage();

        logger.log(`Navigating to ${xUrl}`);
        await page.goto(xUrl, { waitUntil: "load", timeout: 30000 });
        logger.log(`Page loaded: ${page.url()}`);

        const tweetFeed = page.locator('article.r-1loqt21[data-testid="tweet"]');
        try {
            const tweet = tweetFeed.nth(1);
            await tweet.click();
            logger.log(`Clicked on the second tweet to open details.`);

            const tweetUrl = page.url().replace(/\/photo\/\d+$/, "");
            logger.log(`Tweet URL: ${tweetUrl}`);

            const content = await page.locator('article div[dir="auto"] span').first().textContent();
            logger.log(`Content: ${content ? content.trim() : "No content found"}`);

            const imageSrc = await page.locator('article img[alt="Hình ảnh"]').first().getAttribute("src");
            logger.log(`Image URL: ${imageSrc ?? "No image found"}`);

            return {
                url: tweetUrl,
                content: content ? content.trim() : "No content found",
                imageUrl: imageSrc ?? undefined,
            };
        } catch (error) {
            logger.log(`Error fetching tweet: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    } finally {
        logger.log(`Closing browser`);
        await browser.close();
        logger.sep();
    }
}

const xNewsCommand: Command = {
    data: new SlashCommandBuilder()
        .setName("x-news")
        .setDescription("Get the latest news from a gacha game's X page.")
        .addStringOption((option) =>
            option
                .setName("game")
                .setDescription("The gacha game to fetch news for.")
                .setRequired(true)
                .addChoices(...GAME_OPTIONS.map((g) => ({ name: g.name, value: g.value })))
        ) as SlashCommandBuilder,

    execute: async (interaction: ChatInputCommandInteraction) => {
        await interaction.deferReply();

        const gameValue = interaction.options.getString("game", true) as GameValue;
        const game = GAME_MAP[gameValue];

        try {
            const { url: tweetUrl, content, imageUrl } = await fetchLatestTweet(game.url);
            const embed = new EmbedBuilder()
                .setTitle(game.displayName)
                .setURL(tweetUrl)
                .setImage(imageUrl ?? tweetUrl + "/photo/1")
                .setThumbnail(imageUrl ?? tweetUrl + "/photo/1")
                .setTimestamp()
                .setColor(game.color);
            await interaction.editReply({ content, embeds: [embed] });
        } catch (error) {
            await interaction.editReply(
                `Failed to fetch latest news: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    },
};

export default xNewsCommand;
