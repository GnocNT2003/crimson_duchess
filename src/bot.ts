import { Client, GatewayIntentBits } from 'discord.js';
import { config } from './config.js';
import { registerReadyEvent } from './events/ready.js';

export function createBot() {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  registerReadyEvent(client);

  return client;
}

export async function startBot() {
  const client = createBot();
  await client.login(config.discord.token);
  return client;
}
