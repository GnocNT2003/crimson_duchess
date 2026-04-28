import type { ChatInputCommandInteraction, Collection } from "discord.js";
import { SlashCommandBuilder } from "discord.js";
import type Command from "../../types/commandTypes.js";

function formatCommandInfo(command: Command): string {
    const name = command.data.name;
    const description = command.data.description || 'No description available.';
    return `**/${name}**: ${description}`;
}

function generateHelpMessage(commands: Collection<string, Command>): string {
    const commandListHelpMessages = Array.from(commands.values())
        .map(formatCommandInfo)
        .join('\n');
    return `Here are the available commands:\n\n${commandListHelpMessages}`;
}

const helpCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Provides information about available commands and how to use them.'),

    async execute(interaction: ChatInputCommandInteraction) {
        const helpMessage = generateHelpMessage(interaction.client.commands);
        await interaction.reply({ content: helpMessage });
    }
}

export default helpCommand;