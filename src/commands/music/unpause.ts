import { SlashCommandBuilder } from '@discordjs/builders';
import type { ChatInputCommandInteraction } from "discord.js";
import type Command from "../../types/commandTypes.js";
import { createLogger } from '../../tools/logging.js';
import { AudioPlayerStatus, getVoiceConnection } from '@discordjs/voice';
import { getSubscribedAudioPlayer } from '../../tools/voiceHandler.js';

const logger = createLogger("unpause");

const pauseCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('unpause')
        .setDescription('Unpause the currently playing music'),
    
    async execute(interaction: ChatInputCommandInteraction) {
        logger.sep();
        logger.log('START UNPAUSE');
        const connection = getVoiceConnection(interaction.guildId!);

        await interaction.deferReply();

        try {
            if (connection) {
                const player = getSubscribedAudioPlayer(connection);
                if (player) {
                    if (player.state.status === AudioPlayerStatus.Playing) {
                        logger.log('Audio player is already playing');
                        await interaction.editReply('Music is already playing.');
                        return;
                    }

                    logger.log('Unpausing audio player');
                    player.unpause();
                    await interaction.editReply('Music unpaused.');
                } else {
                    logger.log('No active audio player found to unpause');
                    await interaction.editReply('No music is currently playing to unpause.');
                    return;
                };
            };
        } catch (error) {
            logger.log(`Error while trying to unpause music: ${String(error)}`);
            await interaction.editReply(
                'An error occurred while trying to unpause the music.'
            );
        };
    },
};

export default pauseCommand;
