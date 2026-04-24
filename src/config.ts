export const config = {
  discord: {
    token: process.env['DISCORD_TOKEN'] ?? '',
    clientId: process.env['DISCORD_CLIENT_ID'] ?? '',
    guildId: process.env['DISCORD_GUILD_ID'] ?? '',
  },
  server: {
    port: Number(process.env['PORT'] ?? 3000),
  },
} as const;
