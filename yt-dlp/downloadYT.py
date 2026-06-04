import json
import sys
import yt_dlp

def download_audio(url: str, download_dir: str):
    
    # def progress_hook(d):
    #     if d['status'] == 'downloading':
    #         print(json.dumps({
    #             "status": "downloading",
    #             "percent": d.get('_percent_str', '0%').strip(),
    #             "speed": d.get('_speed_str', 'N/A').strip(),
    #             "eta": d.get('_eta_str', 'N/A').strip()
    #         }), flush=True)
    #     elif d['status'] == 'finished':
    #         print(json.dumps({
    #             "status": "finished",
    #             "filename": d['filename']
    #         }), flush=True)
    
    ydl_opts = {
        'format': 'bestaudio/best',
        # 'postprocessors': [{
        #     'key': 'FFmpegExtractAudio',
        #     'preferredcodec': 'mp3',
        #     'preferredquality': '192',
        # }],
        'outtmpl': f'{download_dir}/%(title)s.%(ext)s',
        # 'progress_hooks': [progress_hook],
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        print(json.dumps({
            "status": "done",
            "filename": info.get('title') + info.get('ext', '.mp3'),
            "duration": info.get('duration'),
        }), flush=True)

if __name__ == "__main__":
    data = json.loads(sys.stdin.read())
    download_audio(data['url'], data.get('downloadDir', '.'))