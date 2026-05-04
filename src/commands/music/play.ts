import { MessageFlags, SlashCommandBuilder } from "discord.js";
import type { ChatInputCommandInteraction } from "discord.js";
import type Command from "../../types/commandTypes.js";
// import { createLogger } from "../../tools/logging.js";

const playCommand: Command = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play server background music from YT video URL')
        .addStringOption((option) =>
            option
                .setName('url')
                .setDescription('The Youtube URL to play')
                .setRequired(true),
        ) as SlashCommandBuilder,

    async execute(interaction: ChatInputCommandInteraction) {
        const url = interaction.options.getString('url', true);

        try {
            const hostname = new URL(url).hostname;
            if (hostname !== 'youtube') {
                await interaction.reply({content: 'Invalid hostname. Required Youtube url.',
                    flags: MessageFlags.Ephemeral
                })
            };
            return;
        } catch {
            await interaction.reply({content: 'Invalid URL provided.', 
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        await interaction.deferReply();
    },
};

export default playCommand;