import { SlashCommandBuilder } from '@discordjs/builders';
import type { ChatInputCommandInteraction } from "discord.js";
import type Command from "../../types/commandTypes.js";
import { createLogger } from '../../tools/logging.js';
import { AudioPlayerStatus, getVoiceConnection } from '@discordjs/voice';
import { getSubscribedAudioPlayer } from '../../tools/voiceConnect.js';

const logger = createLogger("pause");

const pauseCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pause the currently playing music'),
    
    async execute(interaction: ChatInputCommandInteraction) {
        logger.sep();
        logger.log('START PAUSE');
        const connection = getVoiceConnection(interaction.guildId!);

        await interaction.deferReply();

        try {
            if (connection) {
                const player = getSubscribedAudioPlayer(interaction.guild!);
                if (player) {
                    if (player.state.status === AudioPlayerStatus.Paused) {
                        logger.log('Audio player is already paused');
                        await interaction.editReply('Music is already paused.');
                        return;
                    }

                    logger.log('Pausing audio player');
                    player.pause();
                    await interaction.editReply('Music paused.');
                } else {
                    logger.log('No active audio player found to pause');
                    await interaction.editReply('No music is currently playing to pause.');
                    return;
                };
            };
        } catch (error) {
            logger.log(`Error while trying to pause music: ${String(error)}`);
            await interaction.editReply(
                'An error occurred while trying to pause the music.'
            );
        };
    }
};

export default pauseCommand;
