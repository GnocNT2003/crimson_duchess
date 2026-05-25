export const config = {
  discord: {
    token: process.env['DISCORD_TOKEN'] ?? '',
    appId: process.env['DISCORD_APP_ID'] ?? '',
    publicKey: process.env['DISCORD_PUBLIC_KEY'] ?? '',
    guildId: process.env['GUILD_ID'] ?? '',
    defaultVoiceChannelId: process.env['DEFAULT_VOICE_CHANNEL_ID'] ?? '',
  },
  server: {
    port: Number(process.env['PORT'] ?? 3000),
  },
} as const;
