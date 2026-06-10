import type { Guild, ChatInputCommandInteraction, AutocompleteInteraction } from "discord.js";
import { MessageFlags, SlashCommandBuilder } from "discord.js";
import type Command from "../../types/commandTypes.js";
import { createLogger } from "../../tools/logging.js";
import { initializeAudioPlayer, getOrJoinVoiceChannel } from "../../tools/voiceHandler.js";
import { createAudioResource } from "@discordjs/voice";
import { extractYoutubeUrl } from "../../tools/youtubeHandler.js";
import { getMusicDownloadsDir, getMusicDownloadsFiles, getTempDownloadDir } from "../../tools/filePathResolver.js";
import { YoutubeUrlType } from "../../types/youtubeUrlTypes.js";
import { getMusicInQueue, queueAndDownloadMusic } from "../../tools/queueHandler.js";
import { QueueItemStatus, type QueueItem } from "../../types/queueTypes.js";
import fs from "fs";
import path from "path";

const logger = createLogger("play");

function joinChannelAndStreamMusic(musicItem: QueueItem, guild: Guild) {
    logger.log('Getting current voice connection or joining new voice channel');
    const connection = getOrJoinVoiceChannel(guild);
    // logger.log(connection.id)

    logger.log(`Creating or getting audio player for streaming from file: ${musicItem.filePath}`);
    const {player, isCreated} = initializeAudioPlayer(connection, guild);

    // Handle between new audio and already created audio
    const musicQueue = guild.client.queue;
    if (isCreated) {
        logger.log('New audio was created!');
    }
    else {
        // Get the current playing music
        const { item: currentItem } = getMusicInQueue(musicQueue, 'status', QueueItemStatus.Playing);

        // Check if the new played music is the same as the currently playing one
        if (currentItem) {
            if (currentItem.title !== musicItem.title && currentItem.filePath !== musicItem.filePath && currentItem.url !== musicItem.url) {
                currentItem.status = QueueItemStatus.Ready;
            }
        }
    }
    
    try {
        logger.log('Creating audio resource')
        const resource = createAudioResource(musicItem.filePath);
    
        logger.log('Playing audio resource');
        player.play(resource);
        if (isCreated) {
            connection.subscribe(player);
        }

        // Update the status of the queue item to 'playing'
        musicItem.status = QueueItemStatus.Playing;

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
        .setDescription('Play server background music from multiple sources')
        .addSubcommand((subcommand) =>
            subcommand
                .setName('youtube')
                .setDescription('Play music from Youtube URL')
                .addStringOption((option) =>
                    option
                        .setName('url')
                        .setDescription('The URL of the YouTube video to play')
                        .setRequired(true),
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('queue')
                .setDescription('Play music from the queue')
                .addStringOption((option) =>
                    option
                        .setName('name')
                        .setDescription('The name and file path of the queued music to play')
                        .setRequired(true)
                        .setAutocomplete(true),
                )
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName('download')
                .setDescription('Play music from downloaded YT video options')
                .addStringOption((option) => 
                    option
                        .setName('name')
                        .setDescription('The name and file path of the download music to play. Should include extension.')
                        .setRequired(true)
                        .setAutocomplete(true),
                )
        ) as SlashCommandBuilder,

    async execute(interaction: ChatInputCommandInteraction) {
        logger.sep();
        logger.log('START PLAY');

        if (!interaction.guild) {
            logger.log('No guild found in interaction');
            await interaction.editReply('This command can only be used in a server.');
            return;
        }

        await interaction.deferReply();
        
        const subcommand = interaction.options.getSubcommand();
        logger.log('Executing play command with ' + subcommand + ' subcommand');
        // let filePath: string = '';
        let musicItem: QueueItem;

        if (subcommand === 'youtube') {
            let url = interaction.options.getString('url', true).trim() || '';
            const tempDownloadDir = getTempDownloadDir();
            
            try {
                url = extractYoutubeUrl(url, YoutubeUrlType.Video); 
            } catch (error) {
                logger.log(`Invalid URL provided: ${String(error)}`);
                await interaction.reply({content: 'Invalid URL provided.', 
                    flags: MessageFlags.Ephemeral
                });
                return;
            };

            // const { filePath: fileDownloadPath } = await queueAndDownloadMusic(url, interaction.guild, tempDownloadDir, logger);
            musicItem = await queueAndDownloadMusic(url, interaction.guild, tempDownloadDir, logger);
            // filePath = fileDownloadPath;
        }
        else {
            const filename = interaction.options.getString('name', true).trim();
            const musicQueue = interaction.guild.client.queue;

            if (subcommand === 'queue') {
                const { item: existingItem } = getMusicInQueue(musicQueue, 'title', filename);
                if (!existingItem) {
                    logger.log(`No music found in queue with title: ${filename}`);
                    await interaction.reply({
                        content: `No music found in queue with title: \`${filename}\``, 
                        flags: MessageFlags.Ephemeral
                    });
                    return;
                }
                musicItem = existingItem;
            }
            else { // subcommand === 'download'
                const musicDownloadDir = getMusicDownloadsDir();
                const filePath = path.join(musicDownloadDir, filename);
                if (!fs.existsSync(filePath)) {
                    logger.log(`No audio file found in download with name: ${filename}`);
                    await interaction.reply({
                        content: `No audio file found in download with name: \`${filename}\``, 
                        flags: MessageFlags.Ephemeral
                    });
                    return;
                };
                musicItem = {
                    url: filePath,
                    title: filename,
                    filePath: filePath,
                    status: QueueItemStatus.Ready
                };
                musicQueue.push(musicItem);
            }
            // filePath = existingItem?.filePath as string;
        }
        
        try {
            joinChannelAndStreamMusic(musicItem, interaction.guild);
            if (subcommand === "queue") {
                await interaction.editReply(`Now playing from file: \`${musicItem.filePath}\``);
            }
            else {
                await interaction.editReply(`Now playing from URL: \`${musicItem.url}\``);
            }
        } catch (error) {
            logger.log(`Error while trying to play music: ${String(error)}`);
            await interaction.editReply(
                'An error occurred while playing the music.'
            );
        }
    },

    async autocomplete(interaction: AutocompleteInteraction) {
        const subcommand = interaction.options.getSubcommand();
        logger.log('Command name in autocomple: ' + subcommand);
        const focusedValue = interaction.options.getFocused().toString();
        const musicQueue = interaction.client.queue;

        let filtered: string[];
        let suggestion: {name: string, value: string}[];
        if (subcommand === 'queue') {
            const choices = musicQueue.map(item => item.title);
            filtered = choices.filter((choice) => choice.includes(focusedValue)).slice(0, 10);
            suggestion = filtered.map((choice) => ({ name: choice, value: choice }));
        }
        else {
            const choices = getMusicDownloadsFiles();
		    filtered = choices.filter((choice) => choice.includes(focusedValue)).slice(0, 10);
            suggestion = filtered.map((choice) => ({ name: choice.replace(/\.[^./]+$/, ''), value: choice }));
        }
        await interaction.respond(suggestion);
    },
};

export default playCommand;