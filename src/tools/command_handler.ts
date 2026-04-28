import fs from 'fs';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import type Command from '../types/commandTypes.js';
import type { Collection } from 'discord.js';

function isCommand(value: unknown): value is Command {
    return (
        typeof value === 'object' &&
        value !== null &&
        'data' in value &&
        'execute' in value &&
        typeof (value as Command).execute === 'function'
    );
}

export default async function gettAllCommands(commands: Collection<string, Command>) {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    
    const commandDirPath = path.join(__dirname, '..', 'commands');
    const commandFolder = fs.readdirSync(commandDirPath);

    for (const folder of commandFolder) {
        const folderPath = path.join(commandDirPath, folder);
        const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const filePath = path.join(folderPath, file);
            const module = await import(pathToFileURL(filePath).href) as Record<string, unknown>;

            const command = module.default;
            if (isCommand(command)) {
                commands.set(command.data.name, command);
            }
        }
    }
    return commands;
}