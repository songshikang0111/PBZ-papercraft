"""Render a chapter: review stills at given times, or the whole clip frame by frame, plus its SFX track.

    uv run --with playwright --with numpy --with scipy python film/tools/render.py film/chapters/01-valley stills 3 7.5 18 24.5
    uv run --with playwright --with numpy --with scipy python film/tools/render.py film/chapters/01-valley video [--from 0 --to 35]

Serves the repository root (the chapter pages load the skill kit and the local stickers from it), opens the page in
headless Chrome with the GPU, steps the harness's fixed clock and screenshots the page (the WebGL frame plus the 2D
overlay). Output: work/film/renders/<chapter>/ (stills, frames/, <chapter>.mp4 silent, <chapter>-sfx.wav,
<chapter>-sfx.json, and <chapter>-preview.mp4 with the SFX muxed in). Music is laid by the user in the edit.
"""
import argparse, functools, http.server, json, os, pathlib, shutil, subprocess, sys, threading, time

ROOT = pathlib.Path(__file__).resolve().parents[2]


def serve():
    class Q(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a): pass
        def end_headers(self):
            self.send_header('Cache-Control', 'no-store'); super().end_headers()
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Q, directory=str(ROOT)))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv.server_address[1]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('chapter'); ap.add_argument('mode', choices=['stills', 'video', 'events']); ap.add_argument('times', nargs='*', type=float)  # stills: real seconds; negative = before the end
    ap.add_argument('--size', default='1920x1080'); ap.add_argument('--from', dest='t0', type=float, default=0); ap.add_argument('--to', dest='t1', type=float, default=None)
    ap.add_argument('--fps', type=int, default=30); ap.add_argument('--ss', default='1')
    a = ap.parse_args()
    from playwright.sync_api import sync_playwright
    W, H = map(int, a.size.split('x'))
    chap = pathlib.Path(a.chapter).resolve().relative_to(ROOT)
    name = chap.name
    out = ROOT / 'work/film/renders' / name; out.mkdir(parents=True, exist_ok=True)
    port = serve()
    url = f'http://127.0.0.1:{port}/{chap.as_posix()}/index.html?capture&size={W}x{H}' + (f'&ss={a.ss}' if a.ss != '1' else '')
    errors, logs = [], []
    with sync_playwright() as p:
        b = p.chromium.launch(channel='chrome', headless=True, args=['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=vulkan', '--enable-unsafe-swiftshader'])
        pg = b.new_page(viewport={'width': W, 'height': H})
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.on('console', lambda m: logs.append(f'{m.type}: {m.text}') if m.type in ('error', 'warning') else None)
        t = time.time(); pg.goto(url)
        ok = False
        for _ in range(1200):
            if errors: break
            if pg.evaluate('!!(window.__film && window.__papercraft && window.__papercraft.ready)'): ok = True; break
            time.sleep(0.5)
        if not ok:
            for e in errors: print('PAGE ERROR', e)
            for l in logs[:40]: print(l[:400])
            raise SystemExit(1)
        print(f'build {time.time() - t:.1f} s, pieces {pg.evaluate("__papercraft.pieces")}, cards in frame {pg.evaluate("__papercraft.cards()")}')
        dur = pg.evaluate('__film.duration')
        if a.mode == 'events':   # the sound / voice event log only (for tools/mix.py --probe), no frames
            json.dump({'duration': dur, 'from': 0, 'events': pg.evaluate('__film.sfx')}, open(out / f'{name}-sfx-events.json', 'w'), ensure_ascii=False, indent=0)
            print('->', (out / f'{name}-sfx-events.json').relative_to(ROOT))
        elif a.mode == 'stills':
            for T in a.times:
                if T < 0: T = round(dur + T, 2)   # negative: seconds before the end
                pg.evaluate(f'() => {{ __papercraft.restart(); __papercraft.step({T}, 60); }}')
                f = out / f'still-{T:05.2f}.png'; pg.screenshot(path=str(f)); print('->', f.relative_to(ROOT))
        else:
            t1 = a.t1 if a.t1 is not None else dur
            fdir = out / 'frames'
            if fdir.exists(): shutil.rmtree(fdir)
            fdir.mkdir()
            pg.evaluate(f'() => {{ __papercraft.restart(); if ({a.t0} > 0) __papercraft.step({a.t0}, 60); }}')
            n = round((t1 - a.t0) * a.fps); t = time.time()
            for i in range(n):
                pg.evaluate(f'() => __papercraft.step({1 / a.fps}, {a.fps})')
                pg.screenshot(path=str(fdir / f'f_{i:05d}.png'))
                if i % 60 == 0: print(f'  frame {i}/{n}  {time.time() - t:.0f} s', flush=True)
            sfx = pg.evaluate('__film.sfx')
            json.dump({'duration': t1 - a.t0, 'from': a.t0, 'events': sfx}, open(out / f'{name}-sfx.json', 'w'), ensure_ascii=False, indent=0)
            mp4 = out / f'{name}.mp4'
            subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(a.fps), '-i', str(fdir / 'f_%05d.png'),
                            '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p', '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'slow', '-crf', '17',
                            '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-movflags', '+faststart', str(mp4)], check=True)
            wav = out / f'{name}-sfx.wav'
            subprocess.run([sys.executable, str(ROOT / 'film/tools/sfx.py'), str(out / f'{name}-sfx.json'), str(wav)], check=True)
            subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(mp4), '-i', str(wav), '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', str(out / f'{name}-preview.mp4')], check=True)
            print('->', mp4.relative_to(ROOT), '+ sfx')
        b.close()
    for e in errors: print('PAGE ERROR', e)
    for l in logs[:30]:
        if 'willReadFrequently' not in l: print(l[:300])


if __name__ == '__main__':
    main()
