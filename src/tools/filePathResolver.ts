import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const __projectRoot = path.resolve(__dirname, '..', '..');

export function getMusicDownloadsDir(): string {
    const dir = path.join(__projectRoot, 'downloads', 'musics');
    fs.mkdirSync(dir, { recursive: true });
    return dir;
}

export function getLawDownloadsDir(): string {
    // src/commands/law -> src/commands -> src -> project root (dev)
    // dist/commands/law -> dist/commands -> dist -> project root (prod)
    const dir = path.join(__projectRoot, 'downloads', 'laws');
    fs.mkdirSync(dir, { recursive: true });
    return dir;
}

export function getTempDownloadDir(): string {
    const dir = path.join(__projectRoot, 'temp');
    fs.mkdirSync(dir, { recursive: true });
    return dir;
}

export function getMusicDownloadsFiles(): string[] {
    const dir = path.join(__projectRoot, 'downloads', 'musics');
    if (!fs.existsSync(dir)) {
        return [];
    }
    const files = fs.readdirSync(dir).filter(file => file.endsWith('.mp3'));
    return files;
}

export { __projectRoot, __dirname, __filename };
