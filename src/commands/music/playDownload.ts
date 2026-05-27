import { SlashCommandBuilder } from "discord.js";
import type { AutocompleteInteraction, ChatInputCommandInteraction } from "discord.js";
import type Command from "../../types/commandTypes.js";
import { createLogger } from "../../tools/logging.js";
import { getMusicDownloadsFiles, __projectRoot } from "../../tools/filePathResolver.js";
import { createAudioResource } from "@discordjs/voice";
import path from "path";
import type { Guild } from 'discord.js';
import { getOrCreateAudioPlayer, getOrJoinVoiceChannel } from "../../tools/voiceHandler.js";
import fs from "fs";

const logger = createLogger("play-download");

function joinChannelAndPlay(filename: string, guild: Guild) {
    logger.log('Getting current voice connection or joining new voice channel');
    const connection = getOrJoinVoiceChannel(guild);

    logger.log(`Creating or getting audio player and resource for file: ${filename}`);
    const player = getOrCreateAudioPlayer(connection);
    const filePath = path.join(__projectRoot, 'downloads', 'musics', `${filename}.mp3`);
    if (!fs.existsSync(filePath)) {
        logger.log(`Audio file not found: ${filePath}`);
        throw new Error(`File not found: ${filename}`);
    }
    const resource = createAudioResource(filePath);
    
    logger.log('Playing audio resource');
    player.play(resource);
    connection.subscribe(player);
    // player.on(AudioPlayerStatus.Playing, () => {
    //     logger.log('Audio player is playing');
    // });
};

const playDownloadCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('play-download')
        .setDescription('Play server background music from downloaded YT video options')
        .addStringOption((option) => 
            option
                .setName('videoname')
                .setDescription('The name of the video to play')
                .setAutocomplete(true)
                .setRequired(true),
        ) as SlashCommandBuilder,

    async execute(interaction: ChatInputCommandInteraction) {
        const videoname = interaction.options.getString('videoname', true);
        const guild = interaction.guild;

        logger.sep();
        logger.log('START PLAYDOWNLOAD');

        await interaction.deferReply();

        try {
            if (!guild) {
                logger.log('No guild found in interaction');
                await interaction.editReply('This command can only be used in a server.');
                return;
            }

            joinChannelAndPlay(videoname, guild);
            await interaction.editReply(`Now playing: \`${videoname}\``);

        } catch (error) {
            logger.log(`Error while trying to play music: ${String(error)}`);
            await interaction.editReply(
                `Failed to play downloaded music: ${error instanceof Error ? error.message : String(error)}`
            );
        }     
    },

    async autocomplete(interaction: AutocompleteInteraction) {
		const focusedValue = interaction.options.getFocused().toString(); 
		const choices = getMusicDownloadsFiles().map(file => file.replace('.mp3', ''));
		const filtered = choices.filter((choice) => choice.startsWith(focusedValue)).slice(0, 5);
		await interaction.respond(filtered.map((choice) => ({ name: choice, value: choice })));
	},
};

export default playDownloadCommand;
