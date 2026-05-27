import type { VoiceConnection } from "@discordjs/voice";
import { getVoiceConnection, joinVoiceChannel, createAudioPlayer, NoSubscriberBehavior, VoiceConnectionStatus } from "@discordjs/voice";
import type { Guild } from 'discord.js';
import { config } from '../config.js';

const { defaultVoiceChannelId } = config.discord;

export function getOrJoinVoiceChannel(guild: Guild): VoiceConnection {
    const connection: VoiceConnection = getVoiceConnection(guild.id) || joinVoiceChannel({
            channelId: defaultVoiceChannelId,
            guildId: guild.id,
            adapterCreator: guild.voiceAdapterCreator,
    });

    return connection;
};

export function getSubscribedAudioPlayer(connection: VoiceConnection) {
    
    const state = connection.state;
    if (state.status === VoiceConnectionStatus.Ready) {
        const player = state.subscription?.player;
        if (player) {
            return player;
        } else {
            return;
        }
    }
};

export function getOrCreateAudioPlayer(connection: VoiceConnection) {
    const player = getSubscribedAudioPlayer(connection) || createAudioPlayer({
        behaviors: {
            noSubscriber: NoSubscriberBehavior.Pause,
        },
    });

    player.on('error', error => {
        throw new Error(`Error on audio player: ${String(error)}`)
    })

    return player;
};