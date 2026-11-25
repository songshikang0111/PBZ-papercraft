"""Generate transparent paper-sticker PNGs with codex's built-in image tool.

    python film/tools/gen.py film/jobs/hero.json [id ...] [--force] [--jobs 3]

A job file is a list of {id, out, inputs: [{path, role}], prompt}. Every output lands at work/film/stickers/<out>,
and every run is appended to work/film/stickers/log.jsonl (prompt, inputs, result) so the set can be audited and
regenerated. The shared style block (STYLE) is prepended to every prompt, so a whole set reads as one paper world.
"""
import argparse, json, pathlib, subprocess, sys, time
from concurrent.futures import ThreadPoolExecutor

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / 'work/film/stickers'

STYLE = (
    "Create ONE new illustration for an upright papercraft pop-up diorama: a matte printed cut-paper piece made of "
    "crisp large flat planes in 2-4 value steps per colour, subtle paper grain, fine dark-brown cut edges at the "
    "silhouette, chunky readable shapes (nothing thin or spiky), no gloss, no glow, no gradients that look like CG. "
    "Keep the somber wuxia palette of Phantom Blade Zero: muted, desaturated, dark inks, one restrained accent colour. "
    "The whole subject must sit inside the canvas with at least 8% clear margin on every side. "
    "Background: fully transparent alpha. No ground plane, no cast shadow, no text, no letters, no logo, no signature, "
    "no frame, no white sticker halo or border."
)

TASK = (
    "Use your built-in image generation tool to make the image described below. Then save it as a PNG with a real "
    "transparent alpha channel at {out} (create folders as needed). If the generated image has an opaque plain "
    "background, remove that background with Python (PIL/numpy: flood from the borders, keep the subject) so the "
    "corners are transparent. Verify with PIL that the file is RGBA and its four corners have alpha 0, then print "
    "DONE {out}. Do not do anything else and do not modify any other file.\n\n"
)


def run(job, force=False):
    out = OUT / job['out']
    if out.exists() and not force:
        return job['id'], 'skip (exists)'
    out.parent.mkdir(parents=True, exist_ok=True)
    roles = ''.join(f"Input image {i + 1} ({pathlib.Path(x['path']).name}): {x['role']}\n" for i, x in enumerate(job.get('inputs', [])))
    prompt = TASK.format(out=out) + STYLE + '\n\n' + (roles + '\n' if roles else '') + job['prompt']
    cmd = ['codex', 'exec', '--skip-git-repo-check', '-s', 'workspace-write', '-C', str(OUT)]
    for x in job.get('inputs', []):
        cmd += ['-i', str(ROOT / x['path'])]
    cmd += ['-']
    t0 = time.time()
    r = subprocess.run(cmd, input=prompt, capture_output=True, text=True, cwd=ROOT, timeout=900)
    ok = out.exists()
    rec = {'id': job['id'], 'out': job['out'], 'ok': ok, 'secs': round(time.time() - t0), 'inputs': job.get('inputs', []),
           'prompt': job['prompt'], 'tail': (r.stdout or '')[-400:] + (r.stderr or '')[-400:]}
    with open(OUT / 'log.jsonl', 'a') as f:
        f.write(json.dumps(rec, ensure_ascii=False) + '\n')
    return job['id'], 'ok' if ok else 'FAILED: ' + rec['tail'][-300:]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('jobfile'); ap.add_argument('ids', nargs='*'); ap.add_argument('--force', action='store_true'); ap.add_argument('--jobs', type=int, default=3)
    a = ap.parse_args()
    jobs = json.load(open(a.jobfile))
    if a.ids:
        jobs = [j for j in jobs if j['id'] in a.ids]
    with ThreadPoolExecutor(a.jobs) as ex:
        for jid, msg in ex.map(lambda j: run(j, a.force), jobs):
            print(f'{jid}: {msg}', flush=True)


if __name__ == '__main__':
    sys.exit(main())
