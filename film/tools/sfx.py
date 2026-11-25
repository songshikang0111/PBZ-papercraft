"""Synthesise a chapter's SFX track from its event log (no samples: filtered noise, partials and envelopes).

    python film/tools/sfx.py work/film/renders/01-valley/01-valley-sfx.json out.wav

Paper sounds stay soft, low and dull (the skill's sound law: flaps, folds, rustles); the fight gets its own small
kit: whooshes, chain jingles, a dull metal clang for parries, paper-tear hits, splashes, a rising charge and a boom.
Everything is seeded, so a re-render gives the same track. Music is the user's: this is the effects stem only.
"""
import json, sys
import numpy as np

SR = 48000
rng = np.random.default_rng(7)
CHAPTER = None


def env(n, a=0.004, d=0.2, curve=1.0):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / max(d, 1e-4)) ** curve
    return e


def onepole(x, fc, kind='low'):
    a = np.exp(-2 * np.pi * fc / SR); y = np.empty_like(x); s = 0.0
    for i in range(len(x)):
        s = (1 - a) * x[i] + a * s; y[i] = s
    return y if kind == 'low' else x - y


def band(x, lo, hi):
    return onepole(onepole(x, hi), lo, 'high')


def sweep_band(x, f0, f1, q=3.0):
    """a state-variable bandpass whose centre glides f0 -> f1 (a whoosh)"""
    n = len(x); fc = np.geomspace(f0, f1, n); y = np.zeros(n); lo = bp = 0.0
    for i in range(n):
        f = 2 * np.sin(np.pi * fc[i] / SR)
        hp = x[i] - lo - bp / q; bp += f * hp; lo += f * bp; y[i] = bp
    return y


def noise(sec):
    return rng.standard_normal(int(sec * SR))


def tone(freqs, sec, decays, amps=None):
    t = np.arange(int(sec * SR)) / SR; out = np.zeros_like(t)
    for k, (f, d) in enumerate(zip(freqs, decays)):
        out += (amps[k] if amps else 1) * np.sin(2 * np.pi * f * t + rng.random() * 6) * np.exp(-t / d)
    return out


def flap(size=0.5, up=True):
    sec = 0.12 + 0.12 * size; x = noise(sec)
    x = band(x, 180 + 200 * (1 - size), 1400 + 1800 * (1 - size)) * env(len(x), 0.006 if up else 0.002, 0.03 + 0.05 * size)
    thump = tone([70 + 60 * (1 - size)], sec, [0.05 + 0.05 * size]) * 0.6 * size
    return (x + thump) * 0.5


def whoosh(sec=0.3, f0=300, f1=2200, amp=1.0):
    x = noise(sec); y = sweep_band(x, f0, f1, 2.2); n = len(y)
    e = np.sin(np.pi * np.linspace(0, 1, n)) ** 1.6
    return y * e * amp * 0.9


def thump(f=55, sec=0.5, d=0.16, amp=1.0):
    t = np.arange(int(sec * SR)) / SR; fr = f * (1 + 1.2 * np.exp(-t / 0.03))
    ph = 2 * np.pi * np.cumsum(fr) / SR
    return np.sin(ph) * np.exp(-t / d) * amp


def tear(sec=0.25, amp=0.6):
    x = noise(sec); crackle = (rng.random(len(x)) < 0.02) * rng.standard_normal(len(x)) * 3
    return band(x * 0.4 + crackle, 500, 5000) * env(len(x), 0.002, sec * 0.4) * amp


def splash(size=1.0):
    sec = 0.9 * size + 0.3; x = noise(sec)
    body = band(x, 400, 6000) * env(len(x), 0.01, 0.18 * size)
    drops = np.zeros(len(x))
    for _ in range(int(18 * size)):
        i = int(rng.random() * len(x) * 0.8); f = 700 + rng.random() * 1600; L = int(0.04 * SR)
        if i + L < len(x): drops[i:i + L] += np.sin(2 * np.pi * np.linspace(f, f * 1.6, L) * np.arange(L) / SR) * np.exp(-np.arange(L) / (0.008 * SR)) * 0.3
    return body * 0.7 + drops + np.pad(thump(65, 0.4, 0.12, 0.5 * size), (0, max(0, len(x) - int(0.4 * SR))))[:len(x)]


def clang():
    c = tone([620, 1180, 1730, 2650, 3900], 0.9, [0.35, 0.22, 0.16, 0.1, 0.06], [0.5, 0.35, 0.25, 0.15, 0.1])
    tr = band(noise(0.05), 1500, 9000) * env(int(0.05 * SR), 0.001, 0.01)
    c[:len(tr)] += tr
    return c * 0.55


def chain():
    out = whoosh(0.45, 250, 1800, 0.7); n = len(out)
    for k in range(9):
        i = int((0.05 + k * 0.04 + rng.random() * 0.02) * SR); j = tone([2300 + rng.random() * 1500, 4100 + rng.random() * 900], 0.08, [0.02, 0.012]) * 0.12
        if i + len(j) < n: out[i:i + len(j)] += j
    return out


# ---- recorded samples (film/SFX-REQUEST.md): when the user's files exist they replace the synthesized sound ----------
import pathlib, wave as _wave
AUDIO = pathlib.Path(__file__).resolve().parents[2] / 'work/film/audio'
# event type -> sample stems tried in order (the chapter's sfx first, then common/sfx). A stem 'name' rotates through
# name_01.., name_02..; a stem ending in _NN is that one file. The game pack (v2) is in work/film/audio/; see its report.
SAMPLES = {
    'guard': ['guard'], 'guardHeavy': ['guard_01', 'guard_03'], 'clang': ['guard_02'], 'deflect': ['parry_perfect'],
    'tellRed': ['telegraph_red'], 'tellBlue': ['telegraph_blue'], 'shadowOut': ['shadowstep_out'], 'shadowIn': ['shadowstep_in'],
    'hit': ['hit_flesh_02', 'hit_flesh_03'], 'heavy': ['hero_slash_heavy_02'], 'finisher': ['execute'], 'dash': ['dodge_02'],
}
SAMPLES_CH = {   # per chapter: the boss's own moves
    '01-valley': {'chain': ['chain_throw_01', 'chain_rattle_01', 'chain_hook_pull_01'], 'whoosh': ['sickle_swing']},
    '02-forest': {'serpent': ['serpent_emerge_01', 'serpent_strike_01', 'serpent_hiss_01', 'serpent_roar_01'], 'gust': ['ribbon_whip_01']},
    '03-village': {'whoosh': ['sword_qi_01']},
    '04-town': {'flame': ['fire_pillar_01'], 'pillar': ['fire_pillar_01'], 'cannon': ['fireball_01'], 'gust': ['sleeve_whoosh'], 'thud': ['pole_land_01', 'pole_land_03']},
    '05-camp': {'gust': ['wind_blade', 'gust_01'], 'bolt': ['lightning_thrust_01', 'electric_wave_blast_01']},
    '06-lake': {'ice': ['ice_wave_02', 'ice_wave_03', 'ice_spike_burst_01'], 'freeze': ['ice_freeze_01'], 'shatter': ['ice_shatter_01']},
    '07-prison': {'chain': ['ball_chain_swing_01'], 'saw': ['saw_cut', 'saw_spinup_01'], 'thud': ['ball_impact_01']},
    '08-estate': {'aim': ['cannon_aim_01'], 'cannon': ['cannon_fire_02'], 'boom': ['explosion_01', 'ground_slam'], 'rockfall': ['rock_fall'], 'chargeUp': ['cannon_charge_01']},
    '09-mountain': {'swordsGather': ['swords_gather_01'], 'swords': ['flying_swords_volley_01'], 'goldBurst': ['gold_burst_01'], 'dragon': ['dragon_roar_01'], 'bladeLock': ['blade_lock_01']},
}
LAYER = {'tellRed', 'tellBlue', 'guardHeavy', 'finisher', 'deflect'}   # sample on top of the synthesized sound
# loudness (dB RMS of the sounding part) and the longest a sample may ring (s) per event type
LEVEL = {'tellBlue': -16, 'tellRed': -17, 'deflect': -15, 'guard': -17, 'guardHeavy': -15, 'clang': -18, 'hit': -18, 'heavy': -19, 'dash': -24,
         'shadowOut': -18, 'shadowIn': -20, 'finisher': -15, 'boom': -15, 'cannon': -15, 'aim': -22, 'chargeUp': -20, 'swords': -17, 'swordsGather': -19,
         'goldBurst': -16, 'dragon': -15, 'bladeLock': -16, 'thud': -20, 'whoosh': -20, 'gust': -21, 'ice': -19, 'saw': -19, 'chain': -19, 'serpent': -17}
CAP = {'deflect': 1.6, 'shadowIn': 1.0, 'shadowOut': 0.7, 'hit': 0.9, 'heavy': 0.9, 'guard': 0.8, 'guardHeavy': 0.9, 'clang': 0.8, 'tellRed': 1.0,
       'cannon': 2.2, 'boom': 2.0, 'chargeUp': 2.5, 'swords': 3.0, 'swordsGather': 3.0, 'goldBurst': 3.0, 'bladeLock': 2.0, 'dragon': 3.0,
       'flame': 1.6, 'pillar': 1.8, 'saw': 1.4, 'freeze': 2.0, 'serpent': 1.6, 'gust': 1.4, 'chain': 1.6, 'rockfall': 1.5, 'ice': 1.2, 'dash': 0.6}
_cache, _rot = {}, {}
def _load(f):
    if f not in _cache:
        with _wave.open(str(f)) as w:
            sr, ch, n = w.getframerate(), w.getnchannels(), w.getnframes(); x = np.frombuffer(w.readframes(n), '<i2').astype(float) / 32768
        x = x.reshape(-1, ch).mean(1)
        if sr != SR: x = np.interp(np.arange(int(len(x) * SR / sr)) * sr / SR, np.arange(len(x)), x)
        _cache[f] = x
    return _cache[f]
def sample(kind, chapter=None, dur=None):
    stems = SAMPLES_CH.get(chapter, {}).get(kind, []) + SAMPLES.get(kind, [])
    dirs = ([AUDIO / chapter / 'sfx'] if chapter else []) + [AUDIO / 'common/sfx']
    files = []
    for stem in stems:
        pat = stem + '.wav' if stem[-3] == '_' and stem[-2:].isdigit() else stem + '_[0-9][0-9].wav'
        found = next((sorted(d.glob(pat)) for d in dirs if d.exists() and list(d.glob(pat))), [])
        files += found
    if not files: return None
    i = _rot.get(kind, 0); _rot[kind] = i + 1
    x = _load(files[i % len(files)]).copy()
    # trim the lead-in silence, cap the ring, match the loudness of the sounding part
    a = np.abs(x); on = np.where(a > a.max() * 0.03)[0]; x = x[max(0, on[0] - 48):] if len(on) else x
    cap = max(CAP.get(kind, 1.5), dur or 0)
    if len(x) > cap * SR: x = x[: int(cap * SR)]; k = int(0.2 * SR); x[-k:] *= np.linspace(1, 0, k) ** 2
    act = x[np.abs(x) > np.abs(x).max() * 0.1]; r = np.sqrt(np.mean(act ** 2)) if len(act) else 1e-3
    return x * (10 ** (LEVEL.get(kind, -18) / 20) / max(r, 1e-4))


_G = [1.0]   # the synthesized layer's level (lowered under a recorded sample)
def mix_at(buf, t, x, gain=1.0):
    i = int(t * SR)
    if i >= len(buf): return
    j = min(len(buf), i + len(x)); buf[i:j] += x[:j - i] * gain * _G[0]


def render(events, dur):
    buf = np.zeros(int((dur + 2) * SR))
    for e in events:
        t, k = e['t'], e['type']; size = e.get('size', 0.6)
        smp = sample(k, CHAPTER, e.get('dur'))
        _G[0] = 1.0
        if smp is not None:
            mix_at(buf, t, smp, 1.0)
            if k not in LAYER: continue
            _G[0] = 0.45   # layered: the synthesized body under the recorded sound
        # ---- v2 combat language and paper effects (synthesized until the recorded samples arrive)
        if k == 'guard': mix_at(buf, t, clang() * 0.8, 0.6); mix_at(buf, t, band(noise(0.18), 2500, 9000) * env(int(0.18 * SR), 0.001, 0.05), 0.35); continue
        if k == 'guardHeavy': mix_at(buf, t, clang(), 0.7); mix_at(buf, t, thump(70, 0.5, 0.12, 0.9), 0.6); mix_at(buf, t, band(noise(0.3), 1500, 9000) * env(int(0.3 * SR), 0.001, 0.08), 0.4); continue
        if k == 'deflect':
            mix_at(buf, t, tone([1320, 2640, 3960, 5280], 1.4, [0.6, 0.4, 0.25, 0.15], [0.5, 0.3, 0.18, 0.1]), 0.45); mix_at(buf, t, clang(), 0.5); mix_at(buf, t, thump(60, 0.6, 0.15, 0.8), 0.5); continue
        if k in ('tellRed', 'tellBlue'):
            f0 = 520 if k == 'tellRed' else 1180
            mix_at(buf, t, tone([f0, f0 * 1.5, f0 * 2.01], 0.7, [0.25, 0.18, 0.12], [0.5, 0.3, 0.2]), 0.4); mix_at(buf, t, whoosh(0.25, 3000, 600, 0.5), 0.3)
            if k == 'tellRed': mix_at(buf, t, thump(45, 0.6, 0.25, 0.7), 0.5)
            continue
        if k == 'shadowOut': mix_at(buf, t, whoosh(0.35, 2400, 300, 0.9), 0.6); mix_at(buf, t, tear(0.3, 0.7), 0.5); continue
        if k == 'shadowIn': mix_at(buf, t, whoosh(0.3, 300, 2400, 0.9), 0.6); mix_at(buf, t + 0.2, thump(80, 0.3, 0.06, 0.6), 0.5); continue
        if k == 'scream':
            d = 1.2; n = int(d * SR); tt = np.arange(n) / SR; f = 700 + 500 * np.sin(2 * np.pi * 5 * tt) + 900 * tt / d
            mix_at(buf, t, np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.05, 0.5) * 0.4 + band(noise(d), 1500, 7000) * env(n, 0.02, 0.4) * 0.6, 0.5); continue
        if k == 'tear': mix_at(buf, t, tear(0.4, 0.8), 0.6); continue
        if k == 'rockfall': mix_at(buf, t, thump(40, 1.0, 0.3, 1.2), 0.8); mix_at(buf, t, band(noise(0.5), 80, 1800) * env(int(0.5 * SR), 0.003, 0.15), 0.6); continue
        if k == 'aim': d = 0.6; n = int(d * SR); mix_at(buf, t, np.sin(2 * np.pi * 1800 * np.arange(n) / SR) * (np.arange(n) % int(SR * 0.08) < SR * 0.04) * 0.25, 0.5); continue
        if k in ('swordsGather', 'goldBurst'): mix_at(buf, t, tone([880, 1320, 1760, 2640], 1.6, [0.9, 0.6, 0.4, 0.25], [0.4, 0.3, 0.2, 0.1]) * env(int(1.6 * SR), 0.3, 1.0), 0.35); mix_at(buf, t, whoosh(0.9, 200, 3000, 0.7), 0.4); continue
        if k == 'swords':
            for i in range(14): mix_at(buf, t + i * 0.02 + rng.random() * 0.03, whoosh(0.18, 900, 5000, 0.5), 0.25)
            mix_at(buf, t + 0.25, thump(45, 1.0, 0.3, 1.0), 0.6); continue
        if k == 'pavilionShatter': mix_at(buf, t, tear(0.8, 1.0), 0.7); mix_at(buf, t, thump(40, 1.4, 0.45, 1.1), 0.7); mix_at(buf, t, band(noise(1.0), 200, 4000) * env(int(1.0 * SR), 0.005, 0.3), 0.5); continue
        if k == 'bladeLock': mix_at(buf, t, clang(), 0.8); mix_at(buf, t, band(noise(0.9), 2000, 9000) * env(int(0.9 * SR), 0.01, 0.4) * (0.6 + 0.4 * np.sin(2 * np.pi * 30 * np.arange(int(0.9 * SR)) / SR)), 0.35); continue
        if k == 'dragon': d = 1.6; n = int(d * SR); mix_at(buf, t, whoosh(d, 100, 900, 1.0) + onepole(noise(d), 180) * np.sin(np.linspace(0, np.pi, n)) * 2, 0.5); continue
        if k == 'rain': d = e.get('dur', 10); n = int(d * SR); mix_at(buf, t, band(noise(d), 1500, 9000) * np.minimum(1, np.arange(n) / SR / 1.0) * 0.12, 0.5); continue
        if k == 'gust': mix_at(buf, t, whoosh(0.8, 200, 1400, 1.0), 0.5); continue
        if k == 'freeze': mix_at(buf, t, band(noise(0.6), 2000, 9000) * env(int(0.6 * SR), 0.02, 0.2), 0.5); mix_at(buf, t, tone([2100, 3150, 4400], 0.8, [0.3, 0.2, 0.1]), 0.2); continue
        if k == 'shatter': mix_at(buf, t, band(noise(0.5), 1500, 10000) * env(int(0.5 * SR), 0.001, 0.1) * (1 + (rng.random(int(0.5 * SR)) < 0.02) * 5), 0.6); continue
        if k in ('riseMany', 'foldMany'):
            n = min(40, e.get('n', 30) // 6 + 8)
            for i in range(n): mix_at(buf, t + rng.random() * 2.6, flap(0.2 + rng.random() * 0.6, k == 'riseMany'), 0.18)
        elif k == 'rise': mix_at(buf, t, flap(size, True), 0.6)
        elif k == 'title': mix_at(buf, t, thump(48, 1.2, 0.5, 0.9) + np.pad(whoosh(0.5, 200, 900, 0.4), (0, int(0.7 * SR))), 0.7)
        elif k == 'steps':
            for i in range(int(e.get('dur', 1.2) / 0.17)): mix_at(buf, t + i * 0.17, band(noise(0.05), 200, 1800) * env(int(0.05 * SR), 0.002, 0.012), 0.25)
        elif k == 'land': mix_at(buf, t, splash(1.3), 0.8); mix_at(buf, t, thump(50, 0.8, 0.25, 1.0), 0.8)
        elif k == 'splash': mix_at(buf, t, splash(size), 0.6)
        elif k == 'slash': mix_at(buf, t, whoosh(0.28, 500, 3200, 0.9), 0.7)
        elif k == 'whoosh': mix_at(buf, t, whoosh(0.35, 250, 1600, 1.0), 0.7)
        elif k == 'chain': mix_at(buf, t, chain(), 0.7)
        elif k == 'clang': mix_at(buf, t, clang(), 0.6)
        elif k == 'hit': mix_at(buf, t, thump(80, 0.35, 0.09, 0.8), 0.7); mix_at(buf, t, tear(0.2, 0.6), 0.6)
        elif k == 'heavy': mix_at(buf, t, whoosh(0.45, 200, 2600, 1.1), 0.75); mix_at(buf, t + 0.12, thump(60, 0.5, 0.14, 0.9), 0.7)
        elif k in ('dash', 'leap'): mix_at(buf, t, whoosh(0.25 if k == 'dash' else 0.35, 300, 1400, 0.6), 0.5)
        elif k == 'thud': mix_at(buf, t, thump(55, 0.6, 0.2, 1.0), 0.7); mix_at(buf, t, band(noise(0.3), 150, 1200) * env(int(0.3 * SR), 0.003, 0.08), 0.4)
        elif k == 'blink': mix_at(buf, t, whoosh(0.32, 3200, 500, 0.9), 0.55); mix_at(buf, t, tear(0.2, 0.5), 0.3)
        elif k == 'petals': mix_at(buf, t, band(noise(1.4), 1500, 7000) * np.sin(np.linspace(0, np.pi, int(1.4 * SR))) ** 2, 0.12)
        elif k in ('charge', 'chargeUp'):
            d = e.get('dur', 1.3); n = int(d * SR); tt = np.arange(n) / SR
            rum = onepole(noise(d), 160) * (tt / d) ** 1.5 * 3
            hum = np.sin(2 * np.pi * np.cumsum(np.linspace(45, 110, n)) / SR) * (tt / d) ** 2 * 0.5
            flutter = band(noise(d), 800, 4000) * (0.5 + 0.5 * np.sin(2 * np.pi * 18 * tt)) * (tt / d) * 0.3
            mix_at(buf, t, rum + hum + flutter, 0.7)
        elif k == 'boom': mix_at(buf, t, thump(38, 2.0, 0.6, 1.2), 0.9); mix_at(buf, t, band(noise(1.2), 80, 2500) * env(int(1.2 * SR), 0.005, 0.3), 0.6); mix_at(buf, t, tear(0.5, 0.8), 0.5)
        elif k == 'finisher':
            mix_at(buf, t - 0.08, whoosh(0.3, 600, 4200, 1.2), 0.8); mix_at(buf, t + 0.05, thump(45, 1.2, 0.35, 1.2), 0.9)
            mix_at(buf, t + 0.05, tear(0.6, 1.0), 0.6); mix_at(buf, t + 0.14, whoosh(0.3, 600, 4200, 1.0), 0.6)
        elif k == 'slap': mix_at(buf, t, thump(70, 0.4, 0.08, 0.8), 0.6); mix_at(buf, t, band(noise(0.15), 200, 2500) * env(int(0.15 * SR), 0.001, 0.03), 0.5)
        elif k == 'chime':   # a guqin pluck and its ring
            for i, f in enumerate([196, 294, 392]): mix_at(buf, t + i * 0.35, tone([f, f * 2, f * 3.01], 1.6, [0.9, 0.5, 0.25], [0.6, 0.25, 0.1]) * env(int(1.6 * SR), 0.003, 1.2), 0.35)
        elif k == 'ice': mix_at(buf, t, band(noise(0.25), 2500, 9000) * env(int(0.25 * SR), 0.001, 0.05), 0.5); mix_at(buf, t, tone([1800, 2700, 3900], 0.4, [0.12, 0.08, 0.05]), 0.15)
        elif k == 'roll': d = e.get('dur', 1); n = int(d * SR); mix_at(buf, t, onepole(noise(d), 300) * (0.5 + 0.5 * np.sin(2 * np.pi * 9 * np.arange(n) / SR)) * 2.5 + band(noise(d), 300, 2000) * 0.3, 0.6)
        elif k == 'flame': mix_at(buf, t, whoosh(0.5, 150, 1200, 1.0) + band(noise(0.5), 80, 900) * env(int(0.5 * SR), 0.02, 0.2) * 0.8, 0.7)
        elif k == 'pillar': mix_at(buf, t, whoosh(0.6, 120, 2400, 1.0), 0.6); mix_at(buf, t, tone([440, 660, 880], 1.5, [0.6, 0.4, 0.3], [0.2, 0.12, 0.08]), 0.25)
        elif k == 'serpent': d = e.get('dur', 2); n = int(d * SR); mix_at(buf, t, onepole(noise(d), 200) * np.sin(np.linspace(0, np.pi, n)) * 2 + band(noise(d), 3000, 8000) * np.sin(np.linspace(0, np.pi, n)) * 0.15, 0.6)
        elif k == 'rays': mix_at(buf, t, whoosh(0.4, 1200, 6000, 0.9), 0.55); mix_at(buf, t, tone([2200, 3300], 0.5, [0.2, 0.12]), 0.12)
        elif k == 'saw': d = e.get('dur', 1.5); n = int(d * SR); tt = np.arange(n) / SR; mix_at(buf, t, (np.sign(np.sin(2 * np.pi * 180 * tt)) * 0.3 + band(noise(d), 1500, 6000) * 0.6) * np.minimum(1, tt / 0.1) * np.minimum(1, (d - tt) / 0.2), 0.35)
        elif k == 'cannon': mix_at(buf, t, thump(42, 1.2, 0.3, 1.2), 0.9); mix_at(buf, t, band(noise(0.6), 60, 1500) * env(int(0.6 * SR), 0.002, 0.15), 0.7)
        elif k == 'bolt': mix_at(buf, t, band(noise(0.5), 800, 9000) * env(int(0.5 * SR), 0.001, 0.08) * (1 + (rng.random(int(0.5 * SR)) < 0.03) * 4), 0.6); mix_at(buf, t + 0.05, thump(50, 1.0, 0.4, 0.8), 0.6)
        elif k == 'stamp': mix_at(buf, t, thump(60, 0.6, 0.12, 1.0), 0.7); mix_at(buf, t, band(noise(0.12), 300, 3000) * env(int(0.12 * SR), 0.001, 0.02), 0.5)
    _G[0] = 1.0
    # a small room: a decaying noise impulse response, kept short and dull
    ir_n = int(0.6 * SR); ir = onepole(rng.standard_normal(ir_n), 2500) * np.exp(-np.arange(ir_n) / (0.12 * SR)) * 0.08; ir[0] = 1.0
    wet = np.fft.irfft(np.fft.rfft(buf, len(buf) + ir_n) * np.fft.rfft(ir, len(buf) + ir_n))[:len(buf)]
    out = wet[:int(dur * SR)]
    peak = np.max(np.abs(out)) or 1
    out = np.tanh(out / peak * 1.4) / np.tanh(1.4) * 0.89   # gentle limiting, ~ -1 dBFS
    return out


def main():
    src, dst = sys.argv[1], sys.argv[2]
    global CHAPTER
    CHAPTER = pathlib.Path(src).stem.replace('-sfx', '')
    d = json.load(open(src)); t0 = d.get('from', 0)
    ev = [dict(e, t=e['t'] - t0) for e in d['events'] if e['t'] >= t0 - 0.5]
    out = render(ev, d['duration'])
    pcm = (np.stack([out, out], 1) * 32767).astype('<i2')
    import wave
    with wave.open(dst, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
    print('sfx ->', dst, f'{len(ev)} events')


if __name__ == '__main__':
    main()
