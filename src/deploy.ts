import { Collection, REST, Routes } from 'discord.js';
import { config } from './config.js';
import gettAllCommands from './tools/commandHandler.js';
import type Command from './types/commandTypes.js';

export async function deployCommands() {
    const token = config.discord.token;
    const appId = config.discord.appId;

    const commands = new Collection<string, Command>();
    await gettAllCommands(commands);

    const commandData = commands.map(command => command.data.toJSON());

    const rest = new REST().setToken(token);

    try {
        console.log(`Started refreshing ${commandData.length} application (/) commands.`);
		// The put method is used to fully refresh all commands in the guild with the current set
		await rest.put(Routes.applicationCommands(appId), { body: commandData });
        console.log(`Successfully reloaded ${commandData.length} application (/) commands.`);
		
    } catch (error) {
        console.error('Error deploying commands:', error);
        throw error;
    }
}

(() => {
    void deployCommands().then(() => {
        console.log('Successfully registered application commands.');
    })
    .catch((error) => {
        console.error('Error registering application commands:', error);
    });
})();