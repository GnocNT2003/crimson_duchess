export interface QueueItem {
    url: string;
    title: string;
    filePath: string;
}

export enum QueueItemStatus {
    Error = 'error',
    Downloading = 'downloading',
    Ready = 'ready',
    Playing = 'playing'
}