import type { Client } from 'discord.js';
import { Events } from 'discord.js';

export function registerReadyEvent(client: Client) {
  client.once(Events.ClientReady, (readyClient) => {
    console.log(`✅ Ready! Logged in as ${readyClient.user.tag}`);
  });
}
