import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { config } from './config.js';
import { registerReadyEvent } from './events/ready.js';
import type Command from './types/commandTypes.js';
import setAllCommands from './tools/command_handler.js';

declare module 'discord.js' {
  export interface Client {
    commands: Collection<string, Command>;
  }
}

export async function createBot() {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  registerReadyEvent(client);

  client.commands = new Collection<string, Command>();
  await setAllCommands(client.commands);

  return client;
}

export async function startBot() {
  const client = await createBot();
  await client.login(config.discord.token);
  return client;
}
