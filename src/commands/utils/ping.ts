import { SlashCommandBuilder } from '@discordjs/builders';
import type { ChatInputCommandInteraction } from 'discord.js';
import type Command from '../../types/commandTypes.js';

const pingCommand: Command = {
    data: new SlashCommandBuilder().setName('ping').setDescription('Replies with Pong! Useful for checking if the bot is responsive and to see the latency.'),

    async execute(interaction: ChatInputCommandInteraction) {        
        await interaction.reply('🏓 Pong! The latency is ' + interaction.client.ws.ping + 'ms.');
    }
}

export default pingCommand;