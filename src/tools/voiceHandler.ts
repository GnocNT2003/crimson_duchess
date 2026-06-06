import type { VoiceConnection } from "@discordjs/voice";
import { 
    getVoiceConnection, 
    joinVoiceChannel, 
    createAudioPlayer, 
    NoSubscriberBehavior, 
    VoiceConnectionStatus, 
    createAudioResource, 
    AudioPlayerStatus 
} from "@discordjs/voice";
// import type { AudioPlayer } from "@discordjs/voice";
import type { Guild } from 'discord.js';
import { config } from '../config.js';
import { QueueItemStatus } from "../types/queueTypes.js";
import { getMusicInQueue } from "./queueHandler.js";

const { defaultVoiceChannelId } = config.discord;

export function getOrJoinVoiceChannel(guild: Guild): VoiceConnection {
    const connection: VoiceConnection = getVoiceConnection(guild.id) || joinVoiceChannel({
            channelId: defaultVoiceChannelId,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
    });

    // connection.on

    return connection;
};

export function getSubscribedAudioPlayer(
    connection: VoiceConnection
) {
    const state = connection.state;
    if (state.status !== VoiceConnectionStatus.Destroyed) {
        const player = state.subscription?.player;
        if (player) {
            // if (player.state.status === AudioPlayerStatus.Playing) {
            //     player.stop()
            // }
            return player;
        };
        return;
    }
};

export function initializeAudioPlayer(connection: VoiceConnection, guild?: Guild) {
    let player = getSubscribedAudioPlayer(connection);
    let isCreated = false
    
    if (player) return {player, isCreated};
    // throw new Error('No voice connection currently found.')
    player = createAudioPlayer({
        behaviors: {
            noSubscriber: NoSubscriberBehavior.Pause,
        },
    });
    isCreated = true;

    // const player = subcribedPlayer.player
    // const isCreated = subcribedPlayer.isCreated

    player.on('stateChange', (oldState, newState) => {
        if (oldState.status !== newState.status) {
            console.log(`Audio player state changed from ${oldState.status} to ${newState.status}`);
        }
    });

    player.on('error', error => {
        throw new Error(`Error on audio player: ${String(error)}`)
    });

    if (guild) {
        // connection.subscribe(player);
        const musicQueue = guild.client.queue;
        player.on(AudioPlayerStatus.Idle, () => {
            console.log('Audio player is idle, checking for next item in queue');
            const { item: currentItem, index: currentIndex } = getMusicInQueue(musicQueue, 'status', QueueItemStatus.Playing);
            if (currentItem) {
                console.log(`Finished playing: ${currentItem.title}`);
                currentItem.status = QueueItemStatus.Ready; // Mark the current item as ready again or remove it from the queue

                if (currentIndex === musicQueue.length - 1) {
                    console.log('No more items in queue, stopping playback');
                    return player;
                }

                const nextItem = musicQueue[currentIndex + 1];
                console.log(`Next item in queue: ${nextItem.title}, starting playback`);
                nextItem.status = QueueItemStatus.Playing;
                const resource = createAudioResource(nextItem.filePath);
                player.play(resource);
            }
        });
    }

    return {player, isCreated};
};