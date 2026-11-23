"""Render the deterministic Canvas film, preview frames, or a single spread."""

import argparse
import base64
import functools
import http.server
from pathlib import Path
import shutil
import subprocess
from threading import Thread

from playwright.sync_api import sync_playwright


SCENE = Path(__file__).resolve().parent
ROOT = SCENE.parents[1]
FPS = 30
AUDIO_FILTER = 'loudnorm=I=-17:TP=-1.5:LRA=7,aresample=48000'


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


def capture(browser_page, args):
    browser_page.wait_for_function('Boolean(window.__film)', timeout=30_000)
    duration = browser_page.evaluate('window.__film.duration')
    if args.stills:
        args.output.mkdir(parents=True, exist_ok=True)
        for t in args.stills:
            encoded = browser_page.evaluate("""t => {
                const film = window.__film;
                film.frame(t);
                return film.canvas.toDataURL('image/png').split(',')[1];
            }""", t)
            (args.output / f'{args.format}-{t:05.2f}.png').write_bytes(base64.b64decode(encoded))
        return

    start = args.start
    end = min(args.end if args.end is not None else duration, duration)
    audio = [
        '-i', str(args.audio), '-af', AUDIO_FILTER, '-c:a', 'aac', '-b:a', '192k', '-shortest',
    ] if args.audio else []
    video = [
        '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'fast', '-crf', '17', '-threads', '5',
        '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p',
        '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
        '-g', '15', '-movflags', '+faststart',
    ]
    args.output.parent.mkdir(parents=True, exist_ok=True)
    temporary = args.output.with_name(args.output.stem + '.rendering.mp4')
    command = ['ffmpeg', '-v', 'error', '-y', '-f', 'image2pipe', '-framerate', str(FPS),
               '-vcodec', 'mjpeg', '-i', 'pipe:0', *audio, *video, str(temporary)]
    first, last = round(start * FPS), round(end * FPS)
    with subprocess.Popen(command, stdin=subprocess.PIPE) as ffmpeg:
        try:
            for offset in range(first, last, 10):
                data = browser_page.evaluate("""([offset, count, fps]) => {
                    const film = window.__film;
                    return Array.from({length: count}, (_, i) => {
                        film.frame((offset + i) / fps);
                        return film.canvas.toDataURL('image/jpeg', .96).split(',')[1];
                    });
                }""", [offset, min(10, last - offset), FPS])
                for encoded in data:
                    ffmpeg.stdin.write(base64.b64decode(encoded))
                if (offset - first) % 150 == 0:
                    print(f'{args.format} {(offset - first) / FPS:.0f}s / {(last - first) / FPS:.1f}s', flush=True)
        finally:
            ffmpeg.stdin.close()
        if ffmpeg.wait():
            raise RuntimeError(f'ffmpeg failed for {args.format}')
    temporary.replace(args.output)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--format', choices=('horizontal', 'vertical'), required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--preview', action='store_true')
    parser.add_argument('--single')
    parser.add_argument('--start', type=float, default=0)
    parser.add_argument('--end', type=float)
    parser.add_argument('--stills', type=float, nargs='+')
    parser.add_argument('--audio', type=Path)
    args = parser.parse_args()

    handler = functools.partial(QuietHandler, directory=ROOT)
    chrome = shutil.which('google-chrome')
    with http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler) as server, sync_playwright() as pw:
        Thread(target=server.serve_forever, daemon=True).start()
        browser = pw.chromium.launch(executable_path=chrome, headless=True, args=['--disable-dev-shm-usage'])
        page = browser.new_page()
        page.on('pageerror', lambda error: print(error, flush=True))
        relative = SCENE.relative_to(ROOT).as_posix()
        url = f'http://127.0.0.1:{server.server_port}/{relative}/?capture=1&format={args.format}'
        if args.preview:
            url += '&preview=1'
        if args.single:
            url += '&single=' + args.single
        page.goto(url)
        capture(page, args)
        browser.close()
        server.shutdown()


if __name__ == '__main__':
    main()
