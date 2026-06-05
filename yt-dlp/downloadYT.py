import json
import sys
import yt_dlp

def download_audio(url: str, download_dir: str):
    
    def progress_hook(d):
        if d['status'] == 'downloading':
            print(json.dumps({
                "status": "downloading",
                "progress": f"{d['downloaded_bytes']} bytes / {d['total_bytes']} bytes",
                "speed": f"{d['speed']} bytes/s",
                "eta": f"{d['eta']} seconds"
            }), flush=True)
        elif d['status'] == 'finished':
            print(json.dumps({
                "status": "finished",
                "filename": d['filename']
            }), flush=True)
    
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': f'{download_dir}/%(title)s.%(ext)s',
        'windowsfilenames': True,
        'quiet': True,
        'progress_hooks': [progress_hook],
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        print(json.dumps({
            "status": "done",
            "title": info.get('title'),
            "duration": info.get('duration'),
        }), flush=True)

if __name__ == "__main__":
    data = json.loads(sys.stdin.read())
    download_audio(data['url'], data.get('downloadDir', '.'))