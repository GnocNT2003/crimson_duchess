import type { Client, Interaction } from 'discord.js';
import { Events, MessageFlags } from 'discord.js';

async function handleInteraction(client: Client, interaction: Interaction) {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        await interaction.reply({
            content: 'This command is not recognized by the bot.',
            flags: MessageFlags.Ephemeral
        });
        return;
    }
    
    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`Error executing command ${interaction.commandName}:`, error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: 'There was an error while executing this command!',
                flags: MessageFlags.Ephemeral
            });
        } else {
            await interaction.reply({
                content: 'There was an error while executing this command!',
                flags: MessageFlags.Ephemeral
            });
        }
    }
}

export function registerInteractionCreateEvent(client: Client) {
    client.on(Events.InteractionCreate, (interaction: Interaction) => {
        void handleInteraction(client, interaction);
    });
}