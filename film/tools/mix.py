"""Mix a chapter's final soundtrack: the synthesized SFX stem + game music (cut to the chapter's beats) + boss/elite/hero
voice, with the music ducked under the voice. Audio only — the frames are untouched, so a remix takes seconds.

    python film/tools/mix.py [chapter ...]        # default: every chapter that has <ch>-sfx.json
    python film/tools/mix.py --probe <chapter>    # print the music excerpt choices and trimmed voice lengths
    python film/tools/mix.py --phrases <wav ...>  # list the spoken phrases of voice clips (for film.voice seg)

Voices (v3): a chapter's scene writes its own voice cues with film.voice(t, file, { seg, cap, gain }) on the beat
and in the right phase; they arrive here as 'vo' events. Chapters without any fall back to the CH table below.

Reads   work/film/renders/<ch>/<ch>-sfx.json, <ch>-sfx.wav, <ch>.mp4 and work/film/audio/ (the game audio pack).
Writes  work/film/renders/<ch>/<ch>-mix.wav, <ch>-music.wav, <ch>-vo.wav (stems) and <ch>-preview.mp4 (re-muxed).

Timeline per chapter (from the event log): map music under the intro and elites -> boss P1 from the arena rise ->
music dips during the phase charge and P2 hits on the phase boom -> music drops out at the finisher -> the outro sting
lands with the 斩 stamp and fades with the slide-down.
"""
import argparse, json, pathlib, subprocess, sys, wave
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parents[2]
R = ROOT / 'work/film/renders'
A = ROOT / 'work/film/audio'
SR = 48000
ORDER = ['01-valley', '02-forest', '03-village', '04-town', '05-camp', '06-lake', '07-prison', '08-estate', '09-mountain', '10-ending']

# ── per-chapter plan ────────────────────────────────────────────────────────────────────────────────────────────────
# music: map / p1 / p2 (/ p3 at a time) / end.  elites: one voice per elite moment (None = silent).
# boss: entry line, phase cry, P2 line, attack/hurt/death grunts.  Paths are relative to work/film/audio/<ch>/.
CH = {
    '01-valley': dict(
        music=dict(map='music/mus_map.wav', p1='music/mus_boss_p1_intro.wav', p2='music/mus_boss_p2_intro.wav', end='music/mus_end.wav'),
        boss_t=14.02, elites=[None, 'vo/pengmeng_line_01.wav', 'vo/ahua_line_01.wav'],
        entry='vo/zhuiming_p1_line_01.wav', phase='vo/zhuiming_phase_01.wav', p2line='vo/zhuiming_p2_line_02.wav',
        attack=['vo/zhuiming_attack_01.wav'], hurt=['vo/zhuiming_hurt_01.wav', 'vo/zhuiming_hurt_02.wav'], death=None,
        extra_sfx=[('sfx/parry_01.wav', 'clang', 0.9)]),
    '02-forest': dict(
        music=dict(map='music/mus_map.wav', p1='music/mus_boss_p1.wav', p2='music/mus_boss_p2.wav', end='music/mus_end.wav'),
        boss_t=14.1, elites=['vo/huaqianxiao_attack_heavy_01.wav', 'vo/jingye_line_01.wav', 'vo/tiekuang_line_01.wav'],
        entry='vo/baichilian_attack_02.wav', phase='vo/baichilian_charge_01.wav', p2line='vo/baichilian_p2_line_01.wav',
        attack=['vo/baichilian_attack_01.wav'], hurt=['vo/baichilian_hurt_01.wav', 'vo/baichilian_hurt_02.wav'], death='vo/baichilian_death_02.wav',
        extra_sfx=[('sfx/execute_01.wav', 'finisher', 1.0)]),
    '03-village': dict(
        music=dict(map='music/mus_map.wav', p1='music/mus_boss_p1.wav', p2='music/mus_boss_p2.wav', p3=('music/mus_boss_p3.wav', 27.2), end='music/mus_end.wav'),
        boss_t=14.0, elites=['vo/zhuobi_line_01.wav', 'vo/yuzan_attack_heavy_01.wav', 'vo/danghui_encounter_line_01.wav'],
        entry='vo/muxiaokui_line_01.wav', phase='vo/muxiaokui_charge_01.wav', p2line='vo/muxiaokui_attack_01.wav',
        attack=['vo/muxiaokui_attack_02.wav'], hurt=['vo/muxiaokui_hurt_01.wav', 'vo/muxiaokui_hurt_02.wav'], death='vo/muxiaokui_death_02.wav',
        more=[('vo/yuyao_encounter_line_01.wav', 'evt:splash')]),
    '04-town': dict(
        music=dict(map='music/mus_map.wav', p1='music/mus_boss_p1_intro.wav', p2='music/mus_boss_p2.wav', trans='music/mus_boss_p2_transition.wav', end='music/mus_end.wav'),
        boss_t=18.14, elites=['vo/huoliuxing_line_01.wav', None, 'vo/changhong_line_01.wav'],
        entry='vo/wushizunzhu_line_03.wav', phase='vo/wushizunzhu_attack_01.wav', p2line='vo/wushizunzhu_line_01.wav',
        attack=['vo/wushizunzhu_attack_02.wav'], hurt=['vo/wushizunzhu_hurt_01.wav'], death='vo/wushizunzhu_death_01.wav'),
    '05-camp': dict(
        music=dict(map='music/mus_map.wav', p1='music/mus_boss_p1_intro.wav', p2='music/mus_boss_p1.wav', end='music/mus_end.wav'),
        boss_t=14.2, elites=['vo/wanjun_attack_heavy_01.wav', 'vo/hongyinvjianke_encounter_line_01.wav', None],
        entry='vo/yubi_attack_01.wav', phase='vo/yubi_attack_02.wav', p2line=None,
        attack=[], hurt=['vo/yubi_hurt_01.wav', 'vo/yubi_hurt_02.wav'], death=None,
       
        more=[('vo/yubi_post_battle_line_01.wav', 'evt:stamp+0.6')]),
    '06-lake': dict(
        music=dict(map='music/mus_map.wav', p1='music/mus_boss_p1.wav', p2='music/mus_boss_p1.wav', end='music/mus_end.wav'),
        boss_t=14.1, elites=[None, None, '../04-town/vo/youlong_hurt_01.wav'],
        entry='vo/fengxuedaoke_p1_line_05.wav', phase='vo/fengxuedaoke_attack_01.wav', p2line='vo/fengxuedaoke_p1_line_01.wav',
        attack=['vo/fengxuedaoke_attack_02.wav'], hurt=['vo/fengxuedaoke_hurt_01.wav', 'vo/fengxuedaoke_hurt_02.wav'], death='vo/fengxuedaoke_death_01.wav'),
    '07-prison': dict(
        music=dict(map='music/mus_map.wav', p1='music/mus_boss_p1_intro.wav', p2='music/mus_boss_p2_intro.wav', end='music/mus_end.wav'),
        boss_t=14.0, elites=['vo/bifeng_hurt_01.wav', 'vo/kuiyanyan_attack_heavy_01.wav', None],
        entry='vo/huangxingzi_attack_01.wav', phase='vo/huangxingzi_attack_02.wav', p2line=None,
        attack=[], hurt=['vo/huangxingzi_hurt_01.wav', 'vo/huangxingzi_hurt_02.wav'], death='vo/huangxingzi_death_01.wav'),
    '08-estate': dict(
        music=dict(map='music/mus_map.wav', p1='music/mus_boss_p1_intro.wav', p2='music/mus_boss_p2.wav', end='music/mus_end.wav'),
        boss_t=14.1, elites=['vo/yuding_attack_heavy_01.wav', None],
        entry='vo/leidang_p1_line_01.wav', phase='vo/leidang_charge_02.wav', p2line='vo/leidang_p2_line_01.wav',
        attack=[], hurt=['vo/leidang_hurt_01.wav', 'vo/leidang_hurt_02.wav'], death='vo/leidang_death_01.wav',
        more=[('vo/leidang_p1_line_03.wav', 'evt:line_leidang')]),
    '09-mountain': dict(
        music=dict(map='music/mus_map.wav', p1='music/mus_boss_p1.wav', p2='music/mus_boss_p2_intro.wav', end='music/mus_end.wav'),
        boss_t=14.1, elites=['vo/lizhe_juzhe_attack_heavy_01.wav', 'vo/lengtu_line_01.wav', 'vo/menghua_line_01.wav'],
        entry='vo/zuoshang_p1_line_01.wav', phase='vo/zuoshang_charge_01.wav', p2line='vo/zuoshang_p2_line_01.wav',
        attack=['vo/zuoshang_attack_01.wav'], hurt=['vo/zuoshang_hurt_01.wav', 'vo/zuoshang_hurt_02.wav'], death='vo/zuoshang_death_01.wav',
        extra_sfx=[('sfx/boss_break_01.wav', 'boom', 0.9)]),
}

# v5 music choices (the appendix-1 pack): map tracks with melody, battle tracks chained intro -> loop so they never run out
MUSIC5 = {
    '01-valley': dict(map='music/mus_map_full.wav', p1='music/mus_boss_p1_intro.wav', p2='music/mus_boss_p2_intro.wav', title=('../common/music/mus_title_night.wav', 7.5)),
    '02-forest': dict(map='music/map_states/mus_map_forest_2_loop.wav', p1='music/mus_boss_p1.wav', p2='music/mus_boss_p2.wav'),
    '03-village': dict(map='music/mus_map_full.wav', p1='music/mus_boss_p1.wav', p2='music/mus_boss_p2.wav'),
    '04-town': dict(map='music/mus_map_full.wav', p1=['music/mus_boss_p1_intro.wav', 'music/mus_boss_p1.wav'], p2='music/mus_boss_p2.wav'),
    '05-camp': dict(map='music/mus_map_full.wav', p1='music/mus_boss_p1_intro.wav', p2='music/mus_boss_p1_intro.wav'),
    '06-lake': dict(map='music/mus_map_full.wav', p1='music/mus_boss_p1.wav', p2='music/mus_boss_p1.wav'),
    '07-prison': dict(map='music/mus_map_full.wav', p1=['music/mus_boss_p1_intro.wav', 'music/mus_boss_p1.wav'], p2=['music/mus_boss_p2_intro.wav', 'music/mus_boss_p2.wav']),
    '08-estate': dict(map='music/map_states/mus_map_villa_later_loop.wav', p1='music/mus_boss_p1_intro.wav', p2=['music/mus_boss_p2_intro.wav', 'music/mus_boss_p2.wav']),
    '09-mountain': dict(map='music/mus_map_full.wav', p1='music/mus_boss_p1.wav', p2='music/mus_boss_p2_intro.wav'),
}

# ambience beds per chapter (v2 pack): (file relative to work/film/audio/<ch>/, dB RMS); looped, faded, under everything
AMB = {
    '01-valley': [('sfx/ambience_waterfall_01.wav', -35), ('sfx/ambience_stream_01.wav', -37)],
    '02-forest': [('sfx/ambience_forest_wind_01.wav', -34)],
    '03-village': [('../02-forest/sfx/ambience_forest_wind_01.wav', -38), ('../06-lake/sfx/ambience_lake_reeds_01.wav', -38)],
    '04-town': [('sfx/ambience_town_night_01.wav', -35), ('sfx/ambience_town_fire_01.wav', -39)],
    '05-camp': [('sfx/ambience_camp_01.wav', -35), ('sfx/ambience_camp_flag_01.wav', -38)],
    '06-lake': [('sfx/ambience_lake_snow_01.wav', -35), ('sfx/ambience_lake_reeds_01.wav', -38)],
    '07-prison': [('sfx/ambience_shrine_01.wav', -34)],
    '08-estate': [('../04-town/sfx/ambience_town_night_01.wav', -38)],
    '09-mountain': [('sfx/ambience_mountain_snow_01.wav', -34)],
}

# levels (linear gains applied after loudness matching)
RMS_MUSIC = 10 ** (-21 / 20)      # boss music body
RMS_MAP = 10 ** (-23 / 20)        # exploration music under the elites (v4: fuller)
RMS_VO = 10 ** (-17 / 20)
RMS_GRUNT = 10 ** (-20 / 20)
SFX_GAIN = 10 ** (-5 / 20)
DUCK = 10 ** (-8 / 20)            # music under voice


# ── io ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
def read(p):
    with wave.open(str(p), 'rb') as w:
        assert w.getframerate() == SR and w.getsampwidth() == 2, p
        x = np.frombuffer(w.readframes(w.getnframes()), '<i2').astype(np.float32) / 32768
        x = x.reshape(-1, w.getnchannels())
    if x.shape[1] == 1: x = np.repeat(x, 2, 1)
    return x[:, :2]


def write(p, x):
    pcm = (np.clip(x, -1, 1) * 32767).astype('<i2')
    with wave.open(str(p), 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())


def rms(x):
    return float(np.sqrt(np.mean(x ** 2)) + 1e-9)


def env(x, hop=SR // 20):
    m = x.mean(1) if x.ndim == 2 else x
    n = len(m) // hop
    return np.sqrt((m[:n * hop].reshape(n, hop) ** 2).mean(1) + 1e-12)


def trim(x, thr_db=-42, pad=0.04):
    """Cut leading/trailing silence of a voice clip."""
    e = env(x, SR // 100); thr = e.max() * 10 ** (thr_db / 20)
    on = np.where(e > thr)[0]
    if not len(on): return x
    a = max(0, on[0] * SR // 100 - int(pad * SR)); b = min(len(x), (on[-1] + 1) * SR // 100 + int(pad * 3 * SR))
    return x[a:b]


def segments(x, gap=0.35, thr_db=-34):
    """Split a voice clip into its spoken phrases (pauses longer than `gap` s below thr_db of the peak)."""
    hop = SR // 100; e = env(x, hop); on = e > e.max() * 10 ** (thr_db / 20)
    out, start, quiet = [], None, 0
    for i, v in enumerate(on):
        if v:
            if start is None: start = i
            quiet = 0
        elif start is not None:
            quiet += 1
            if quiet * hop >= gap * SR: out.append((start, i - quiet + 1)); start, quiet = None, 0
    if start is not None: out.append((start, len(on)))
    out = [(a, b) for a, b in out if (b - a) * hop > 0.15 * SR] or [(0, len(on))]
    return [x[max(0, a * hop - SR // 25): min(len(x), b * hop + SR // 10)] for a, b in out]


def fade(x, fi=0.0, fo=0.0):
    x = x.copy(); n = len(x)
    if fi > 0: k = min(n, int(fi * SR)); x[:k] *= np.linspace(0, 1, k)[:, None] ** 2
    if fo > 0: k = min(n, int(fo * SR)); x[n - k:] *= np.linspace(1, 0, k)[:, None] ** 2
    return x


def place(buf, t, x, g=1.0):
    i = int(round(t * SR))
    if i < 0: x = x[-i:]; i = 0
    n = min(len(x), len(buf) - i)
    if n > 0: buf[i:i + n] += x[:n] * g


# ── music excerpts ──────────────────────────────────────────────────────────────────────────────────────────────────
def onset(x, hop=SR // 100):
    """Spectral-flux-ish onset strength at 100 Hz (low band weighted, so kicks and taiko hits win)."""
    m = x.mean(1); n = len(m) // hop
    fr = m[:n * hop].reshape(n, hop) * np.hanning(hop)
    S = np.abs(np.fft.rfft(fr, axis=1))
    w = 1 / (1 + np.arange(S.shape[1]) / 8)            # favour lows
    f = np.maximum(0, np.diff(np.log1p(S * 50), axis=0)) @ w
    return np.concatenate([[0], f])


def pick(x, length, lo=0.0, hi=None, strong_start=True, level='high'):
    """Choose an excerpt start (s): the window of `length` with the target energy, starting on a strong onset."""
    e = env(x, SR // 10); dur = len(x) / SR
    hi = dur - length if hi is None else min(hi, dur - length)
    if hi <= lo: return max(0.0, min(lo, dur - length))
    L = int(length * 10); c = np.concatenate([[0], np.cumsum(e)])
    starts = np.arange(int(lo * 10), int(hi * 10) + 1)
    mean = (c[starts + L] - c[starts]) / L
    head = (c[starts + 20] - c[starts]) / 20 if strong_start else mean
    if level == 'high':
        score = mean / mean.max() + 0.6 * head / head.max()
    else:                                               # a calm but not empty stretch
        target = np.percentile(mean, 45); score = -np.abs(mean - target) / (mean.max() + 1e-9) + 0.2 * head / head.max()
    s0 = starts[int(np.argmax(score))] / 10
    # snap to the strongest onset within ±0.6 s
    o = onset(x); a, b = int(max(0, s0 - 0.6) * 100), int(min(dur - length, s0 + 0.6) * 100)
    if b > a: s0 = (a + int(np.argmax(o[a:b]))) / 100
    return max(0.0, s0)


def clip(x, start, length, fi, fo, target):
    seg = x[int(start * SR): int((start + length) * SR)]
    if len(seg) < int(length * SR): seg = np.concatenate([seg, np.zeros((int(length * SR) - len(seg), 2), np.float32)])
    body = seg[: int(min(length, 6) * SR)]
    g = target / rms(body if rms(body) > 1e-4 else seg)
    return fade(seg, fi, fo) * min(g, 8.0)


# ── cues ────────────────────────────────────────────────────────────────────────────────────────────────────────────
def cues(ev, dur):
    T = lambda k: sorted(e['t'] for e in ev if e['type'] == k)
    steps = T('steps'); charge = T('charge'); fin = T('finisher'); stamp = T('stamp')
    arena = sorted(e['t'] for e in ev if e['type'] == 'riseMany' and e.get('group') == 'arena') or [t for t in T('riseMany') if 11.5 < t < 18]
    c = dict(dur=dur, arena=arena[0] if arena else 15.0, run=steps[1] if len(steps) > 2 else 15.3,
             charge=charge[0], fin=fin[0], stamp=stamp[0], out=steps[-1],
             elites=[e['t'] for e in ev if e['type'] == 'rise' and abs(e.get('size', 0) - 0.7) < 1e-6])
    c['boom'] = min((t for t in T('boom') if t > c['charge']), default=c['charge'] + 1.3)
    c['dash'] = [t for t in T('dash') if c['run'] < t < c['fin']]
    c['heavy'] = [t for t in T('heavy') if c['run'] < t < c['fin']]
    c['hits'] = [t for t in T('hit') if c['run'] < t < c['fin']]
    c['ev'] = ev
    return c


# ── chapter mix ─────────────────────────────────────────────────────────────────────────────────────────────────────
# the opening and the ending (v4): a music bed + the SFX stem. The title theme is a slot: work/film/audio/common/music/
# title_theme.wav (opening) / ending_theme.wav (ending) are used when they exist, else a stand-in from the pack.
TITLE = {'00-opening': (['common/music/title_theme.wav', '01-valley/music/mus_boss_p1_intro.wav'], 0.0, 0.15, 1.4),
         '10-ending': (['common/music/mus_credits_theme_ending_edit.wav', 'common/music/ending_theme.wav', '09-mountain/music/mus_end.wav'], 0.0, 0.4, 2.0)}


def build_title(ch, probe=False):
    d = json.load(open(R / ch / f'{ch}-sfx.json')); dur = d['duration']; N = int(dur * SR)
    files, start, fi, fo = TITLE[ch]; f = next(A / x for x in files if (A / x).exists())
    print(f'{ch}: music', f.relative_to(A))
    if probe: return
    x = read(f); music = pad(clip(x, start, dur, fi, fo, RMS_MUSIC * 1.35), 0, N)
    sfx = pad(read(R / ch / f'{ch}-sfx.wav')[:N], 0, N) * SFX_GAIN; mix = music + sfx
    mix *= min(1.0, 0.94 / (np.max(np.abs(mix)) or 1)); out = R / ch
    write(out / f'{ch}-music.wav', music); write(out / f'{ch}-mix.wav', mix)
    for stem in ('vo', 'amb'): write(out / f'{ch}-{stem}.wav', np.zeros((N, 2), np.float32))
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(out / f'{ch}.mp4'), '-i', str(out / f'{ch}-mix.wav'),
                    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', str(out / f'{ch}-preview.mp4')], check=True)


def build(ch, probe=False):
    if ch in TITLE: return build_title(ch, probe)
    src = R / ch / (f'{ch}-sfx-events.json' if probe and (R / ch / f'{ch}-sfx-events.json').exists() else f'{ch}-sfx.json')
    d = json.load(open(src)); dur = d['duration']; t0 = d.get('from', 0)
    ev = [dict(e, t=e['t'] - t0) for e in d['events'] if e.get('type')]
    c = cues(ev, dur); P = CH[ch]; base = A / ch
    N = int(dur * SR)
    music = np.zeros((N, 2), np.float32); vo = np.zeros((N, 2), np.float32); spans = []; lines = []   # spans: voice activity
    log = []

    # music (v5): one continuous bed. map -> (crossfade) boss P1 -> (crossfade through the phase change) boss P2 -> end
    # sting on the stamp. Every segment is filled to its length (the files of a segment are chained, then looped), never
    # left silent; under voices the bed is only ducked. MUSIC5 overrides the per-chapter files.
    M = dict(P['music']); M.update(MUSIC5.get(ch, {}))
    def bed(spec, length, start=None):
        files = spec if isinstance(spec, list) else [spec]
        xs = [trim(read(base / f), thr_db=-40, pad=0.05) for f in files]   # no silent heads/decay tails between files
        x = xs[0]
        for y in xs[1:]:   # chain with a 0.6 s crossfade
            xf = min(int(1.2 * SR), len(x) // 2, len(y) // 2); y = y.copy()
            x = np.concatenate([x[:-xf], x[-xf:] * np.linspace(1, 0, xf)[:, None] + y[:xf] * np.linspace(0, 1, xf)[:, None], y[xf:]])
        if start is None:   # skip a silent head: begin a beat before the music gets going
            e = env(xs[0], SR // 2); db = 20 * np.log10(e + 1e-9); start = max(0.0, np.argmax(db > -30) / 2 - 0.5)
        x = x[int(start * SR):]
        while len(x) < length * SR + SR:   # loop with a 1 s crossfade
            xf = SR; y = x.copy(); y[:xf] *= np.linspace(0, 1, xf)[:, None]; x = np.concatenate([x[:-xf], x[-xf:] * np.linspace(1, 0, xf)[:, None] + y[:xf], y[xf:]])
        return x[: int(length * SR)], start
    def lay(x, t, fi, fo, target):
        body = x[: int(min(len(x) / SR, 8) * SR)]; g = target / rms(body if rms(body) > 1e-4 else x)
        place(music, t, fade(x, fi, fo) * min(g, 8.0))
    t_p1 = c['arena'] - 0.6; t_p2 = c['boom'] - 0.4; t_end = c['fin'] + 0.15
    t0 = 0.0
    if M.get('title'):   # the film's title over the opening of chapter one
        ttl, L = M['title']; x, _ = bed(ttl, L + 1.5, start=0.0); lay(x, 0, 0.3, 1.5, RMS_MUSIC * 0.95); t0 = L; log.append(('title', ttl, L))
    s = pick(read(base / M['map']), t_p1 - t0 + 1.5, lo=4, level='high')
    x, _ = bed(M['map'], t_p1 - t0 + 1.5, start=s); lay(x, t0, 0.8 if t0 else 0.6, 1.4, RMS_MAP); log.append(('map', M['map'], s))
    x, s1 = bed(M['p1'], t_p2 - t_p1 + 0.8); lay(x, t_p1, 0.4, 0.8, RMS_MUSIC); log.append(('p1', M['p1'], round(s1, 2)))
    p2 = M['p2']
    if p2 == M['p1'] and not isinstance(p2, list):   # one battle track for both phases: carry on further into it
        x, s2 = bed(p2, t_end - t_p2, start=s1 + (t_p2 - t_p1) + 4)
    else: x, s2 = bed(p2, t_end - t_p2)
    # v6: P2 no longer cuts at the finisher; it sinks under the execution and is gone as the stamp lands
    x2, _ = bed(p2, c['stamp'] + 0.1 - t_p2, start=s2) if c['stamp'] > t_end else (x, 0)
    lay(x2, t_p2, 0.4, max(0.15, c['stamp'] + 0.1 - c['fin']), RMS_MUSIC * 1.1); log.append(('p2', p2, round(s2, 2)))
    en = trim(read(base / M['end']), thr_db=-40, pad=0.02); Le = dur - c['stamp'] + 0.1
    s = pick(en, min(Le, len(en) / SR), hi=8, strong_start=True)
    sting = clip(en, s, Le, 0.02, 1.6, RMS_MUSIC * 0.85); place(music, c['stamp'] - 0.05, sting); log.append(('end', M['end'], s))
    e = env(sting, SR // 10); live = np.where(e > e.max() * 10 ** (-16 / 20))[0]
    tail = c['stamp'] - 0.05 + ((live[-1] + 1) / 10 if len(live) else 0)
    if dur - tail > 1.5:   # the sting is over before the chapter: a quiet map bed carries the outro to the cut
        L = dur - tail + 2.5; x, _ = bed(M['map'], L, start=pick(read(base / M['map']), L, lo=4, level='calm'))
        lay(x, tail - 2.5, 2.0, 1.2, RMS_MAP * 0.75); log.append(('outro', M['map'], round(tail, 2)))

    # voice ------------------------------------------------------------------------------------------------------
    def say(rel, t, kind='vo', cap=None, g=1.0, after=None, seg=None, limit=None):
        if not rel: return
        if not (base / rel).exists(): log.append(('MISSING', rel, round(t, 2))); return
        x = read(base / rel)
        if seg == 'squeeze':   # the whole line with its long pauses closed up
            ph = segments(x); x = np.concatenate([np.concatenate([p, np.zeros((int(0.18 * SR), 2), np.float32)]) for p in ph])
        elif seg is not None: x = segments(x)[min(seg, len(segments(x)) - 1)]
        x = trim(x)
        full = len(x) / SR
        if cap and kind != 'vo' and len(x) > cap * SR: x = fade(x[: int(cap * SR)], 0, 0.25)   # grunts only: lines play whole
        x = fade(x, 0.005, 0.06)
        tgt = RMS_VO if kind == 'vo' else RMS_GRUNT
        loud = env(x, SR // 50); act = x[:len(loud) * (SR // 50)][np.repeat(loud > loud.max() * 0.1, SR // 50)] if len(loud) else x
        x = x * min(tgt / rms(act if len(act) else x), 12) * g
        if after is not None:                             # don't step on the previous voice
            t0 = t
            while any(a - 0.05 <= t < b - 0.08 or a - 0.05 <= t + len(x) / SR * 0.5 < b for a, b in spans): t += 0.05
            if limit is not None and t - t0 > limit: log.append(('dropped', rel, round(t0, 2))); return
        if kind == 'vo':   # v4 checks: a line never overlaps another line and ends before the chapter folds away
            end = t + len(x) / SR
            for a, b, r2 in lines:
                if t < b - 0.05 and end > a + 0.05: log.append(('OVERLAP', rel, round(t, 2), round(end, 2), 'with', r2, round(a, 2), round(b, 2)))
            if end > dur - 0.45: log.append(('SPILL', rel, round(t, 2), round(end, 2), 'chapter', round(dur, 2)))
            lines.append((t, end, rel))
        place(vo, t, x); spans.append((t, t + len(x) / SR)); log.append(('vo', rel, round(t, 2), round(len(x) / SR, 2)))

    scene_vo = [e for e in ev if e['type'] == 'vo']
    if scene_vo:
        # v3: the scene writes every boss / elite voice cue itself (film.voice), on the beat and in the right phase.
        # Lines first (never moved), then the grunts, each shifted off any line it would step on (or dropped).
        for e in sorted(scene_vo, key=lambda e: (e.get('kind') != 'line', e['t'])):
            line = e.get('kind') == 'line'
            say(e['file'], e['t'], 'vo' if line else 'grunt', cap=e.get('cap', 4.8 if line else 1.4), g=e.get('gain', 1.0),
                after=None if line else True, seg=e.get('seg'), limit=None if line else 0.5)
        if P.get('hero_line'): say(P['hero_line'][0], P['hero_line'][1], cap=2.2, after=True)
        for t in c['dash'][:2]: say(f'../hero/hero_attack_0{1 + int(t) % 3}.wav', t + 0.05, 'grunt', g=0.8, after=True, limit=0.3)
        say('../hero/hero_execute_01.wav', c['fin'] - 0.05, 'grunt', g=0.9, after=True, limit=0.3)
    if not scene_vo:   # v2 fallback: voices placed from the CH table
        for i, (t, rel) in enumerate(zip(c['elites'], P['elites'])):
            say(rel, t + 0.55, 'vo' if 'line' in rel else 'grunt', cap=2.7) if rel else None
        if P.get('hero_line'): say(P['hero_line'][0], P['hero_line'][1], cap=2.2)
        say(P['entry'], P['boss_t'] + 0.15, 'vo' if 'line' in P['entry'] else 'grunt', cap=3.4)
        for t in c['dash'][:2]: say(f'../hero/hero_attack_0{1 + int(t) % 3}.wav', t + 0.05, 'grunt', g=0.8)
        for t in [h for h in c['heavy'] if h > P['boss_t'] + 2][:1]: say('../hero/hero_attack_heavy_01.wav', t - 0.45, 'grunt', g=0.85)
        for i, rel in enumerate(P['attack'][:1]):
            t = next((h for h in c['hits'] if h > P['boss_t'] + 2.6), None)
            if t: say(rel, t - 0.5, 'grunt', cap=1.2, after=True)
        hurts = [h for h in c['hits'] if h < c['charge'] - 1.0 and h > P['boss_t'] + 1]
        for rel, t in zip(P['hurt'][:1], hurts[-1:]): say(rel, t + 0.03, 'grunt', cap=1.2, after=True)
        say(P['phase'], c['charge'] + 0.1, 'grunt', cap=1.6, g=1.1)
        if P['p2line']: say(P['p2line'], c['boom'] + 0.35, 'vo' if 'line' in P['p2line'] else 'grunt', cap=3.2)
        for rel, t in P.get('more', []):
            if isinstance(t, str):   # 'evt:<type>[+dt]': the first event of that type (after the boss enters)
                name, _, dt = t[4:].partition('+'); t = next((e['t'] for e in ev if e['type'] == name and e['t'] > P['boss_t']), None)
                if t is None: continue
                t += float(dt or 0)
            say(rel, t, 'vo', cap=4.6 if 'post' in rel else 2.6, after=True)
        say('../hero/hero_execute_01.wav', c['fin'] - 0.05, 'grunt', g=0.9)
        if P['death']: say(P['death'], c['fin'] + 0.45, 'grunt', cap=1.8)
        elif P['hurt']: say(P['hurt'][-1], c['fin'] + 0.45, 'grunt', cap=1.2)

    # game sfx sweeteners
    for rel, at, g in P.get('extra_sfx', []):
        t = {'clang': next((e['t'] for e in ev if e['type'] == 'clang' and e['t'] > c['run']), None),
             'finisher': c['fin'], 'boom': c['boom']}[at]
        if t is not None: place(vo, t, read(base / rel) * g * 0.5)

    if probe:
        for l in log: print('  ', *l)
        return

    # duck the music under voice (80 ms attack, 350 ms release)
    act = np.zeros(N, np.float32)
    for a, b in spans: act[int(a * SR): int(b * SR)] = 1
    k = SR // 100; n = N // k; a_ = act[:n * k].reshape(n, k).max(1)
    g = np.ones(n, np.float32); cur = 1.0
    for i in range(n):
        tgt = DUCK if a_[i] else 1.0
        cur += (tgt - cur) * (0.12 if tgt < cur else 0.03); g[i] = cur
    gain = np.repeat(g, k); gain = np.concatenate([gain, np.full(N - len(gain), gain[-1] if len(gain) else 1)])
    music *= gain[:, None]

    # ambience: each bed looped with a 1 s crossfade, faded in and out with the chapter, dipped 4 dB under voice
    amb = np.zeros((N, 2), np.float32)
    for rel, db in AMB.get(ch, []):
        if not (base / rel).exists(): continue
        x = read(base / rel); x = x * (10 ** (db / 20) / rms(x)); xf = int(SR); out = np.zeros((N, 2), np.float32); i = 0
        while i < N:
            seg = x.copy()
            if i: seg[:xf] *= np.linspace(0, 1, xf)[:, None]
            seg[-xf:] *= np.linspace(1, 0, xf)[:, None]
            place(out, i / SR, seg); i += len(x) - xf
        amb += fade(out, 1.2, 1.5)
    amb *= (1 - (1 - 10 ** (-4 / 20)) * (1 - gain) / (1 - DUCK))[:, None]
    sfx = read(R / ch / f'{ch}-sfx.wav')[:N]; sfx = pad(sfx, 0, N) * SFX_GAIN
    mix = music + vo + sfx + amb
    peak = np.max(np.abs(mix)) or 1
    mix = np.tanh(mix * 1.15) / np.tanh(1.15) if peak > 0.9 else mix
    mix *= min(1.0, 0.94 / (np.max(np.abs(mix)) or 1))
    out = R / ch
    write(out / f'{ch}-music.wav', music); write(out / f'{ch}-amb.wav', amb); write(out / f'{ch}-vo.wav', vo); write(out / f'{ch}-mix.wav', mix)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(out / f'{ch}.mp4'), '-i', str(out / f'{ch}-mix.wav'),
                    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', str(out / f'{ch}-preview.mp4')], check=True)
    print(f'{ch}: mix -> {(out / f"{ch}-mix.wav").relative_to(ROOT)}  ({len(spans)} voice cues)')


def pad(x, t, N):
    out = np.zeros((N, 2), np.float32); place(out, t, x); return out


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('chapters', nargs='*'); ap.add_argument('--probe', action='store_true'); ap.add_argument('--phrases', action='store_true')
    ap.add_argument('--lengths', action='store_true')
    a = ap.parse_args()
    if a.lengths:   # the trimmed length of every voice clip, for the scenes to time their beats on (film/common/vo-lengths.json)
        out = {}
        for f in sorted(A.glob('*/vo/*.wav')):
            x = read(f); ph = segments(x)
            out[f.relative_to(A).as_posix()] = {'len': round(len(trim(x)) / SR, 2), 'squeeze': round(sum(len(trim(q)) for q in ph) / SR + 0.18 * (len(ph) - 1), 2),
                                                'seg': [round(len(trim(q)) / SR, 2) for q in ph]}
        dst = ROOT / 'film/common/vo-lengths.json'; json.dump(out, open(dst, 'w'), ensure_ascii=False, indent=0)
        print(len(out), 'clips ->', dst.relative_to(ROOT)); return
    if a.phrases:
        for f in a.chapters:
            x = read(A / f); ph = segments(x)
            print(f, f'{len(x) / SR:.1f}s', ' '.join(f'[{i}] {len(p) / SR:.1f}s' for i, p in enumerate(ph)))
        return
    chs = a.chapters or [c for c in ORDER if (R / c / f'{c}-sfx.json').exists()]
    for ch in chs:
        if a.probe: print(ch)
        build(ch, a.probe)


if __name__ == '__main__':
    main()
