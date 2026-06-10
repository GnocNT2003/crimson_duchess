import { MessageFlags, SlashCommandBuilder } from "discord.js";
import type { ChatInputCommandInteraction } from "discord.js";
import type Command from "../../types/commandTypes.js";
import { createLogger } from "../../tools/logging.js";
import { getMusicDownloadsDir } from "../../tools/filePathResolver.js";
import { extractYoutubeUrl } from "../../tools/youtubeHandler.js";
import { YoutubeUrlType } from "../../types/youtubeUrlTypes.js";
import { queueAndDownloadMusic } from "../../tools/queueHandler.js";

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
        let url = interaction.options.getString('url', true);
        const downloadsDir = getMusicDownloadsDir();

        logger.sep();
        logger.log(`START DOWNLOAD`);

        try {
            url = extractYoutubeUrl(url, YoutubeUrlType.Video); 
        } catch (error) {
            logger.log(`Invalid URL provided: ${String(error)}`);
            await interaction.reply({content: 'Invalid URL provided.', 
                flags: MessageFlags.Ephemeral
            });
            return;
        };
        
        await interaction.deferReply();

        try {
            if (!interaction.guild) {
                logger.log('No guild found in interaction');
                await interaction.editReply('This command can only be used in a server.');
                return;
            }
            
            await queueAndDownloadMusic(url, interaction.guild, downloadsDir, logger);
            await interaction.editReply(`The audio for URL: \`${url}\` has been added to the queue.`);
        } catch (error) {
            logger.log(`Error while trying to play music: ${String(error)}`);
            await interaction.editReply(
                'An error occurred while playing the music.'
            );
        }
    },
};

export default downloadCommand;