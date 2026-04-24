export const config = {
  discord: {
    token: process.env['DISCORD_TOKEN'] ?? '',
    appId: process.env['DISCORD_APP_ID'] ?? '',
    publicKey: process.env['DISCORD_PUBLIC_KEY'] ?? '',
    guildId: process.env['DISCORD_GUILD_ID'] ?? '',
  },
  server: {
    port: Number(process.env['PORT'] ?? 3000),
  },
} as const;
