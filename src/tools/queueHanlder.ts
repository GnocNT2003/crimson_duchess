import type { Guild } from "discord.js";
import { downloadAudioFromYTbyScript } from "./youtubeHandler.js";
import type { Logger } from "./logging.js";
import type { QueueItem } from "../types/queueTypes.js";


export function getMusicInQueue(
    musicQueue: QueueItem[], 
    option: 'url' | 'title', 
    value: string
): QueueItem | undefined {
    return musicQueue.find(item => item[option] === value);
}

// export function listMusicTitlesInQueue(musicQueue: QueueItem[]): string[] {
//     return musicQueue.map(item => item.title);
// }

export async function queueAndDownloadMusic(
    url: string, 
    guild: Guild, 
    downloadDir: string, 
    logger: Logger
): Promise<{filePath: string, title: string}> {
    const musicQueue = guild.client.queue;
    const existingItem = getMusicInQueue(musicQueue, 'url', url);
    let filePath, title: string;

    if (!existingItem) {
            logger.log(`Downloading audio from URL: ${url}`);
            ({filePath, title } = await downloadAudioFromYTbyScript(url, downloadDir, logger));
            musicQueue.push({ url, title, filePath });
        } else {
            logger.log(`Audio for URL: ${url} already exists in queue, skipping download`);
            filePath = existingItem.filePath;
            title = existingItem.title;
        }
    return { filePath, title};
}