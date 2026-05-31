import type Command from "../../types/commandTypes.js";
import { SlashCommandBuilder } from 'discord.js';
import type { ChatInputCommandInteraction,  } from "discord.js";
import { getVoiceConnection } from "@discordjs/voice";
import { createLogger } from "../../tools/logging.js";
import { getSubscribedAudioPlayer } from "../../tools/voiceHandler.js";

const logger = createLogger("stop");

const stopCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stop the music and leave the voice channel'),

    async execute(interaction: ChatInputCommandInteraction) {
        logger.sep();
        logger.log('START STOP');
        logger.log('Getting current voice connection');
        const connection = getVoiceConnection(interaction.guildId!);

        await interaction.deferReply();

        try {
            if (connection) {
                const player = getSubscribedAudioPlayer(connection);
                if (player) {
                    logger.log('Stopping audio player');
                    player.stop();
                }
    
                logger.log('Destroying voice connection to stop music and leave channel');
                connection.destroy();
                await interaction.editReply(
                    'Music stopped and left the voice channel.'
                );
            } else {
                logger.log('No active voice connection found');
                await interaction.editReply(
                    'Not currently connected to a voice channel.'
                );
            };
        } catch (error) {
            logger.log(`Error while trying to stop music: ${String(error)}`);
            await interaction.editReply(
                'An error occurred while trying to stop the music.'
            );
        };
    },
}

export default stopCommand;