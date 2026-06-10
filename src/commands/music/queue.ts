import { MessageFlags, SlashCommandBuilder } from "discord.js";
import type { ChatInputCommandInteraction } from "discord.js";
import type Command from "../../types/commandTypes.js";
import { createLogger } from "../../tools/logging.js";
import { extractYoutubeUrl } from "../../tools/youtubeHandler.js";
import { getTempDownloadDir, getMusicDownloadsDir } from "../../tools/filePathResolver.js";
import { YoutubeUrlType } from "../../types/youtubeUrlTypes.js";
import { queueAndDownloadMusic } from "../../tools/queueHandler.js";

const logger = createLogger("queue");

const queueCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Queue and download music from Youtube URL')
        .addStringOption((option) => 
            option
                .setName('url')
                .setDescription('The URL of the YouTube video to queue and download')
                .setRequired(true),
        )
        .addStringOption((option) => 
            option
                .setName('option')
                .setDescription('Download options for audio, \'temp\' for temporary store, \'download\' for long term store')
                .setChoices(
                    [
                        {name: 'temp', value: 'temp'},
                        {name: 'download', value: 'download'},
                    ]
                )
        ) as SlashCommandBuilder,

    async execute(interaction: ChatInputCommandInteraction) {
        let url = interaction.options.getString('url', true);
        const downloadOption = interaction.options.getString('option', true) || 'temp';
        const downloadDir = downloadOption === 'temp'? getTempDownloadDir() : getMusicDownloadsDir();
            
        logger.sep();
        logger.log(`START QUEUE ${downloadOption.toUpperCase()}`);

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
    
            await queueAndDownloadMusic(url, interaction.guild, downloadDir, logger);
            await interaction.editReply(`The audio for URL: \`${url}\` has been added to the queue.`);
        } catch (error) {
            logger.log(`Error while trying to play music: ${String(error)}`);
            await interaction.editReply(
                'An error occurred while playing the music.'
            );
        }
    },
}

export default queueCommand;