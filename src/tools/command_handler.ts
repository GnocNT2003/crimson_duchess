import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
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

export default async function setAllCommands(commands: Collection<string, Command>) {
    
    const commandDirPath = path.join(__dirname, 'commands');
    const commandFolder = fs.readdirSync(commandDirPath);

    for (const folder of commandFolder) {
        const folderPath = path.join(commandDirPath, folder);
        const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.ts'));

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