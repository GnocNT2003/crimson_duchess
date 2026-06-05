import type { Guild } from "discord.js";
import { downloadAudioFromYTbyScript } from "./youtubeHandler.js";
import type { Logger } from "./logging.js";
import { QueueItemStatus, type QueueItem } from "../types/queueTypes.js";


export function getMusicInQueue(
    musicQueue: QueueItem[], 
    option: 'url' | 'title' | 'filePath' | 'status', 
    value: string
): { item: QueueItem | undefined, index: number } {
    const itemIndex = musicQueue.findIndex(item => item[option] === value);
    if (itemIndex === -1) {
        return { item: undefined, index: -1 };
    }
    return { item: musicQueue[itemIndex], index: itemIndex };
}

// export function listMusicTitlesInQueue(musicQueue: QueueItem[]): string[] {
//     return musicQueue.map(item => item.title);
// }

export async function queueAndDownloadMusic(
    url: string, 
    guild: Guild, 
    downloadDir: string, 
    logger: Logger
): Promise<QueueItem> {
    const musicQueue = guild.client.queue;
    const { item: existingItem } = getMusicInQueue(musicQueue, 'url', url);
    let filePath, title: string;

    if (!existingItem) {
            logger.log(`Downloading audio from URL: ${url}`);
            ({filePath, title } = await downloadAudioFromYTbyScript(url, downloadDir, logger));
            const newQueueItem: QueueItem = { url, title, filePath, status: QueueItemStatus.Ready };

            musicQueue.push(newQueueItem);
            return newQueueItem;
        } else {
            logger.log(`Audio for URL: ${url} already exists in queue, skipping download`);
            // filePath = existingItem.filePath;
            // title = existingItem.title;
        }
    return existingItem;
}