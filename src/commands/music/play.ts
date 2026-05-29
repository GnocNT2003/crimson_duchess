import type { Guild, ChatInputCommandInteraction } from "discord.js";
import { MessageFlags, SlashCommandBuilder } from "discord.js";
import type Command from "../../types/commandTypes.js";
import { createLogger } from "../../tools/logging.js";
import { getOrCreateAudioPlayer, getOrJoinVoiceChannel } from "../../tools/voiceHandler.js";
import { createAudioResource } from "@discordjs/voice";
import { downloadAudioFromYoutube } from "../../tools/youtubeHandler.js";
import { getTempDownloadDir } from "../../tools/filePathResolver.js";
import path from "path";

const logger = createLogger("play");

async function joinChannelAndStreamMusic(url: string, guild: Guild, downloadDir: string) {
    logger.log('Getting current voice connection or joining new voice channel');
    const connection = getOrJoinVoiceChannel(guild);

    logger.log(`Creating or getting audio player for streaming from URL: ${url}`);
    const player = getOrCreateAudioPlayer(connection);

    const filename = await downloadAudioFromYoutube(url, downloadDir, logger)
    const filePath = path.join(downloadDir, filename)

    try {
        // await pipeline(stream, outStreamFile);
        logger.log('Creating audio resource')
        const resource = createAudioResource(filePath);
    
        logger.log('Playing audio resource');
        player.play(resource);
        connection.subscribe(player);
        
    } catch (error) {
        if (error instanceof Error) {
            throw error
        };
        throw new Error(`Error on creating audio resource: ${String(error)}`)
    }
}

const playCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play server background music from Youtube URL')
        .addStringOption((option) => 
            option
                .setName('url')
                .setDescription('The URL of the YouTube video to play')
                .setRequired(true),
        ) as SlashCommandBuilder,

    async execute(interaction: ChatInputCommandInteraction) {
        const url = interaction.options.getString('url', true);
        const tempDownloadDir = getTempDownloadDir();
        
        logger.sep();
        logger.log('START PLAY');

        try {
            const hostname = new URL(url).hostname;
            if (!(hostname.includes('youtube') || hostname.includes('youtu.be'))) {
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
            if (!interaction.guild) {
                logger.log('No guild found in interaction');
                await interaction.editReply('This command can only be used in a server.');
                return;
            }

            await joinChannelAndStreamMusic(url, interaction.guild, tempDownloadDir);
            await interaction.editReply(`Now playing from URL: \`${url}\``);

        } catch (error) {
            logger.log(`Error while trying to play music: ${String(error)}`);
            await interaction.editReply(
                'An error occurred while playing the music.'
            );
        }
    },
};

export default playCommand;