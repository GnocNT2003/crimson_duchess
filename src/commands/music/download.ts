import { MessageFlags, SlashCommandBuilder } from "discord.js";
import type { ChatInputCommandInteraction } from "discord.js";
import type Command from "../../types/commandTypes.js";
import { createLogger } from "../../tools/logging.js";
import { getMusicDownloadsDir } from "../../tools/filePathResolver.js";
import { downloadAudioFromYTbyScript } from "../../tools/youtubeHandler.js";

const logger = createLogger("download");

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

        logger.sep();
        logger.log(`START DOWNLOAD`);

        try {
            const hostname = new URL(url).hostname;
            // logger.log(`Parsed hostname from URL: ${hostname}`);
            if (!hostname.includes('youtube')) {
                logger.log(`Invalid hostname: ${hostname}. Required Youtube url.`);
                await interaction.reply({content: 'Invalid hostname. Required Youtube url.',
                    flags: MessageFlags.Ephemeral
                });
                return;
            };
        } catch {
            logger.log(`Invalid URL provided: ${url}`);
            await interaction.reply({content: 'Invalid URL provided.', 
                flags: MessageFlags.Ephemeral
            });
            return;
        };
        
        await interaction.deferReply();

        try {
            const downloadsDir = getMusicDownloadsDir();
            // const filename = await downloadAudioFromYTbyWeb(url, downloadsDir, logger);
            const { filePath } = await downloadAudioFromYTbyScript(url, downloadsDir, logger);
            await interaction.editReply(`Audio downloaded successfully: \`${filePath}\``);
        } catch (error) {
            logger.log(`Error while trying to download audio: ${String(error)}`);
            await interaction.editReply(
                `Failed to download audio: ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    },
};

export default downloadCommand;