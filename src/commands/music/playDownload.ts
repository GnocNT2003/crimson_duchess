import { SlashCommandBuilder } from "discord.js";
import type { AutocompleteInteraction, ChatInputCommandInteraction, Guild } from "discord.js";
import type Command from "../../types/commandTypes.js";
import { createLogger } from "../../tools/logging.js";
import { getMusicDownloadsFiles, __projectRoot } from "../../tools/filePathResolver.js";
import { joinVoiceChannel, createAudioPlayer, createAudioResource, NoSubscriberBehavior , getVoiceConnection } from "@discordjs/voice";
import type { VoiceConnection } from "@discordjs/voice";
import path from "path";
import { config } from '../../config.js';

const { defaultVoiceChannelId } = config.discord;
const logger = createLogger("play-download");
// const availableMusicFiles = getMusicDownloadsFiles().map(file => {
//     return {
//         name: file.replace('.mp3', '').slice(0, 100), // Limit the name to 100 characters
//         value: path.join(__projectRoot, 'downloads', 'musics', file),
//     };
// });

function joinChannelAndPlay(filename: string, guild: Guild) {
    logger.sep();
    logger.log('START PLAYDOWNLOAD');
    
    logger.log('Getting current voice connection or joining new voice channel');
    const connection: VoiceConnection = getVoiceConnection(guild.id) || joinVoiceChannel({
        channelId: defaultVoiceChannelId,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
        selfMute: false,
        selfDeaf: false,
    });

    logger.log(`Creating audio player and resource for file: ${filename}`);
    const player = createAudioPlayer({
        behaviors: {
		    noSubscriber: NoSubscriberBehavior.Pause,
	},
    });
    const filePath = path.join(__projectRoot, 'downloads', 'musics', `${filename}.mp3`);
    const resource = createAudioResource(filePath);
    
    logger.log('Playing audio resource');
    player.play(resource);
    connection.subscribe(player);
    logger.log('Audio is now playing');
    logger.sep();
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

        await interaction.deferReply();

        try {
            if (!guild) {
                await interaction.editReply('This command can only be used in a server.');
                return;
            }

            joinChannelAndPlay(videoname, guild);
            await interaction.editReply(`Now playing: \`${videoname}\``);

        } catch (error) {
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
