"""Export deterministic 24 fps tests or stills from the same Papercraft camera rail."""

import argparse
import base64
import functools
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import shutil
import subprocess
from threading import Thread

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[2]
FPS = 24
SIZE = {'horizontal': (1280, 720), 'vertical': (720, 1280)}


class MediaHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


def stills(page, out, times):
    out.mkdir(exist_ok=True, parents=True)
    for t in times:
        image, metrics = page.evaluate("""t => {
            const shot=window.__valley;
            shot.go(t);
            return [shot.capture().toDataURL('image/png').split(',')[1], shot.metrics()];
        }""", t)
        (out / f'{t:05.2f}.png').write_bytes(base64.b64decode(image))
        print(metrics, flush=True)


def movie(page, output, audio, limit):
    output.parent.mkdir(exist_ok=True,parents=True)
    frames = round(min(limit or 999, page.evaluate('window.__valley.duration')) * FPS)
    temp = output.with_suffix('.rendering.mp4')
    audio_options = ['-i', str(audio), '-c:a', 'aac', '-b:a', '160k', '-shortest'] if audio else []
    command = [
        'ffmpeg','-v','error','-y','-f','image2pipe','-framerate',str(FPS),'-vcodec','mjpeg',
        '-i','pipe:0',*audio_options,'-c:v','libx264','-profile:v','high','-threads','4','-preset','fast','-crf','17',
        '-vf','scale=out_color_matrix=bt709:out_range=tv,format=yuv420p','-colorspace','bt709',
        '-color_primaries','bt709','-color_trc','bt709','-color_range','tv','-g','12','-movflags','+faststart',str(temp),
    ]
    with subprocess.Popen(command,stdin=subprocess.PIPE) as proc:
        try:
            for i in range(0,frames,6):
                images=page.evaluate("""([first,count,fps]) => Array.from({length:count},(_,j)=>{
                    const shot=window.__valley;
                    shot.go((first+j)/fps);
                    return shot.capture().toDataURL('image/jpeg', .95).split(',')[1];
                })""",[i,min(6,frames-i),FPS])
                for payload in images:
                    proc.stdin.write(base64.b64decode(payload))
                if i%60==0:
                    print(f'{i}/{frames} frames',flush=True)
        finally:
            proc.stdin.close()
        if proc.wait():
            raise RuntimeError('ffmpeg failed')
    temp.replace(output)


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--format',choices=SIZE,required=True)
    parser.add_argument('--output',type=Path,required=True)
    parser.add_argument('--stills',type=float,nargs='+')
    parser.add_argument('--audio',type=Path)
    parser.add_argument('--limit',type=float)
    graphics = parser.add_mutually_exclusive_group()
    graphics.add_argument('--software',action='store_true')
    graphics.add_argument('--gpu',action='store_true')
    args=parser.parse_args()
    width,height=SIZE[args.format]
    handler=functools.partial(MediaHandler,directory=ROOT)
    with ThreadingHTTPServer(('127.0.0.1',0),handler) as server, sync_playwright() as pw:
        Thread(target=server.serve_forever,daemon=True).start()
        overrides = []
        if args.software:
            overrides = ['--use-angle=swiftshader']
        elif args.gpu:
            overrides = ['--use-gl=angle', '--use-angle=gl', '--enable-gpu', '--ignore-gpu-blocklist']
        browser=pw.chromium.launch(executable_path=shutil.which('google-chrome'), headless=True,
                                   args=['--disable-dev-shm-usage','--enable-unsafe-swiftshader',*overrides])
        page=browser.new_page(viewport={'width':width,'height':height})
        page.on('pageerror',lambda error: print(error,flush=True))
        page.on('console',lambda msg: print(msg.text,flush=True) if msg.type in ('error','warning') else None)
        page.goto(f'http://127.0.0.1:{server.server_port}/demos/weeping-creek/?capture&size={width}x{height}')
        page.wait_for_function('window.__valley?.ready',timeout=45000)
        device=page.evaluate("""() => {
          const gl=window.__valley.H.renderer.getContext();
          const d=gl.getExtension('WEBGL_debug_renderer_info');
          return d?gl.getParameter(d.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);
        }""")
        print(device,flush=True)
        if args.stills:
            stills(page,args.output,args.stills)
        else:
            movie(page,args.output,args.audio,args.limit)
        browser.close()
        server.shutdown()


if __name__=='__main__':
    main()
