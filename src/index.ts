import 'dotenv/config';
import { startBot } from './bot.js';
import { startServer } from './server.js';

startServer();
await startBot();
