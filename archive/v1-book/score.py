"""Synthesize an original subdued score and close paper foley for the film."""

import argparse
from pathlib import Path
import numpy as np
from scipy import signal
from scipy.io.wavfile import write


SR = 48000
OPENING = 4.5
PAGE = 7.5
PAGES = 9
DURATION = OPENING + PAGE * PAGES + 4
RNG = np.random.default_rng(669)


def tone(freq, seconds, kind):
    t = np.arange(round(seconds * SR)) / SR
    phase = 2 * np.pi * freq * t
    if kind == 'air':
        env = np.minimum(1, t / .9) * np.minimum(1, (seconds - t) / 1.3)
        return env * (.72 * np.sin(phase + .12 * np.sin(t * 15)) + .19 * np.sin(phase * 2.004))
    env = (1 - np.exp(-t * 210)) * np.exp(-t * 2.05)
    return env * (.64 * np.sin(phase) + .22 * np.sin(phase * 2.007) + .10 * np.sin(phase * 3.02) +
                  .07 * np.exp(-t * 6) * np.sin(phase * 5.06))


def paper(seconds, center, gain):
    t = np.arange(round(seconds * SR)) / SR
    n = RNG.standard_normal(len(t))
    n = signal.sosfilt(signal.butter(2, [145, 3240], fs=SR, btype='bandpass', output='sos'), n)
    env = np.exp(-((t - center) / (.21 * seconds)) ** 2) * np.sin(np.pi * t / seconds) ** 1.5
    return gain * n * env


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    result = np.zeros((round(SR * DURATION), 2), dtype=np.float32)

    def insert(at, wave, gain, pan=0.0):
        offset = round(at * SR)
        length = min(len(wave), len(result) - offset)
        if length > 0:
            result[offset:offset + length, :] += wave[:length, None] * np.array([1 - pan, 1 + pan]) * gain

    def pluck(at, frequency, gain, pan):
        wave = tone(frequency, 2.5, 'pluck')
        insert(at, wave, gain, pan)
        insert(at + .116, wave, gain * .20, -.26 * pan)
        insert(at + .231, wave, gain * .12, -.44 * pan)

    modes = [(98, 146.8, 196), (87.3, 130.8, 174.6), (98, 146.8, 220), (110, 164.8, 220),
             (98, 146.8, 196), (87.3, 130.8, 196), (82.41, 123.5, 164.8), (98, 146.8, 220),
             (73.42, 110, 146.8)]
    pluck(.26, 146.8, .16, -.16)
    pluck(1.26, 196, .12, .17)
    pluck(2.75, 98, .12, -.12)
    for index, (root, fifth, high) in enumerate(modes):
        t = OPENING + index * PAGE
        insert(t + .08, paper(.89, .42, .52), .64, -.13)
        insert(t + .81, paper(.38, .20, .37), .43, .22)
        insert(t + 2.53, paper(.53, .23, .29), .49, .15)
        insert(t + 6.70, paper(.56, .29, .31), .57, -.16)
        insert(t + .18, tone(root / 2, 7.1, 'air'), .087, -.10)
        insert(t + .43, tone(fifth, 6.3, 'air'), .043, .23)
        pluck(t + 1.12, root * 2, .12, -.23)
        pluck(t + 1.58, fifth * 2, .069, .14)
        pluck(t + 2.82, root, .19, .09)
        pluck(t + 3.64, high * 2, .065, -.15)
        pluck(t + 5.2, high, .09, .18)
    t = OPENING + PAGE * PAGES
    insert(t + .12, paper(.84, .38, .51), .64, -.11)
    pluck(t + .99, 98, .16, .05)
    pluck(t + 1.34, 196, .11, -.11)
    result[-SR:] *= np.linspace(1, 0, SR)[:, None]
    args.output.parent.mkdir(parents=True, exist_ok=True)
    write(args.output, SR, np.int16(np.clip(result * .89, -.99, .99) * 32767))


if __name__ == '__main__':
    main()
