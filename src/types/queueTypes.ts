export interface QueueItem {
    url: string;
    title: string;
    filePath: string;
    status: QueueItemStatus;
}

export enum QueueItemStatus {
    Error = 'error',
    Downloading = 'downloading',
    Ready = 'ready',
    Playing = 'playing'
}