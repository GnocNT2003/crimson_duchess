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

export function getSubscribedAudioPlayer(guild: Guild) {
    const connection = getVoiceConnection(guild.id);
    if (!connection) {
        throw new Error('No active voice connection found for this guild');
    }
    
    const state = connection.state;
    if (state.status === VoiceConnectionStatus.Ready) {
        const player = state.subscription?.player;
        if (player) {
            return player;
        } else {
            throw new Error('No audio player subscribed to the current voice connection');
        }
    }
};

export function getOrCreateAudioPlayer(guild: Guild) {
    const player = getSubscribedAudioPlayer(guild) || createAudioPlayer({
        behaviors: {
            noSubscriber: NoSubscriberBehavior.Pause,
        },
    });
    return player;
};