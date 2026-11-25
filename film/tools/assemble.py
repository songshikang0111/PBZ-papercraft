"""Join the rendered chapters into the full film: video with short cross-dissolves at the slide-down joins, the SFX
stems concatenated with matching crossfades, and a preview with the SFX muxed in. Music is the user's, laid later.

    python film/tools/assemble.py [--fade 0.6]

Reads work/film/renders/<chapter>/<chapter>.mp4 and <chapter>-sfx.wav for every chapter that has them, in film order;
writes work/film/renders/full/ (papercraft-full.mp4 silent, papercraft-mix.wav or -sfx.wav, papercraft-preview.mp4,
and stem-music/vo/sfx.wav when the chapters were mixed). The joined audio is loudness-normalised to -14 LUFS.
"""
import argparse, json, pathlib, subprocess

ROOT = pathlib.Path(__file__).resolve().parents[2]
R = ROOT / 'work/film/renders'
ORDER = ['01-valley', '02-forest', '03-village', '04-town', '05-camp', '06-lake', '07-prison', '08-estate', '09-mountain', '10-ending']


def dur(p):
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'json', str(p)], capture_output=True, text=True)
    return float(json.loads(r.stdout)['format']['duration'])


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--fade', type=float, default=0.6); ap.add_argument('--only', nargs='*'); ap.add_argument('--out', default='full'); a = ap.parse_args()
    chs = [c for c in ORDER if (R / c / f'{c}.mp4').exists() and (R / c / f'{c}-sfx.wav').exists() and (not a.only or c in a.only)]
    out = R / a.out; out.mkdir(exist_ok=True)
    # the full mix (game music + voice + SFX, film/tools/mix.py) when every chapter has one, else the SFX stem alone
    kind = 'mix' if all((R / c / f'{c}-mix.wav').exists() for c in chs) else 'sfx'
    print('chapters:', chs, '| audio:', kind)
    vids = [R / c / f'{c}.mp4' for c in chs]; wavs = [R / c / f'{c}-{kind}.wav' for c in chs]
    ds = [dur(v) for v in vids]
    args = []
    for v in vids: args += ['-i', str(v)]
    for w in wavs: args += ['-i', str(w)]
    n, f = len(vids), a.fade
    fv, fa, last_v, last_a, off = [], [], '[0:v]', f'[{n}:a]', ds[0]
    for i in range(1, n):
        off -= f
        fv.append(f'{last_v}[{i}:v]xfade=transition=fade:duration={f}:offset={off:.3f}[v{i}]'); last_v = f'[v{i}]'
        fa.append(f'{last_a}[{n + i}:a]acrossfade=d={f}[a{i}]'); last_a = f'[a{i}]'
        off += ds[i]
    graph = ';'.join(fv + fa) if n > 1 else f'[0:v]null[v0];[{n}:a]anull[a0]'
    if n == 1: last_v, last_a = '[v0]', '[a0]'
    graph += f';{last_a}loudnorm=I=-14:TP=-1.0:LRA=11,aresample=48000[aout]'; last_a = '[aout]'
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', *args, '-filter_complex', graph, '-map', last_v, '-map', last_a,
                    '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p',
                    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
                    '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', str(out / 'papercraft-preview.mp4')], check=True)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(out / 'papercraft-preview.mp4'), '-an', '-c:v', 'copy', str(out / 'papercraft-full.mp4')], check=True)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(out / 'papercraft-preview.mp4'), '-vn', '-c:a', 'pcm_s16le', str(out / f'papercraft-{kind}.wav')], check=True)
    if kind == 'mix':   # the stems, joined the same way, for re-balancing in the edit
        for stem in ('music', 'vo', 'sfx', 'amb'):
            ws = [R / c / f'{c}-{stem}.wav' for c in chs]
            if not all(w.exists() for w in ws): continue
            ins = sum((['-i', str(w)] for w in ws), []); g, la = [], '[0:a]'
            for i in range(1, n): g.append(f'{la}[{i}:a]acrossfade=d={f}[s{i}]'); la = f'[s{i}]'
            gr = ';'.join(g) if g else '[0:a]anull[s0]'; la = la if g else '[s0]'
            subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', *ins, '-filter_complex', gr, '-map', la, '-c:a', 'pcm_s16le',
                            str(out / f'stem-{stem}.wav')], check=True)
    print('->', out, f'{dur(out / "papercraft-preview.mp4"):.1f} s')


if __name__ == '__main__':
    main()
