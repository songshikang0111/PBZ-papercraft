"""Original stream, folded-card foley and sparse plucked notes for the pilot."""

import argparse
from pathlib import Path

import numpy as np
from scipy import signal
from scipy.io.wavfile import write


SR=48000
SECONDS=14.5
RNG=np.random.default_rng(1238)


def noise(t, low, high):
    raw=RNG.standard_normal(t.size)
    return signal.sosfilt(signal.butter(2,[low,high],fs=SR,btype='bandpass',output='sos'),raw)


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('output',type=Path)
    args=parser.parse_args()
    t=np.arange(round(SECONDS*SR))/SR
    bed=.095*(.3+.7*np.clip(t/14,0,1))*noise(t,190,1350)
    open_tail=np.minimum(1,np.minimum(t/.25,(SECONDS-t)/.52))
    out=np.stack((bed+.014*noise(t,82,280),bed+.021*noise(t,88,265)),axis=1)

    def add(start,wave,magnitude,pan):
        index=round(start*SR)
        out[index:index+len(wave)] += wave[:,None]*magnitude*np.array((1-pan,1+pan))

    rise_events=[(.45,.15,-.22),(1.44,.16,-.24),(4.89,.20,.08),(7.44,.18,-.24),(8.02,.17,.20),(9.44,.24,.12)]
    for at,level,pan in rise_events:
        ts=np.arange(round(SR*.68))/SR
        soft=np.exp(-((ts-.22)/.116)**2)*np.sin(np.pi*ts/.68)
        add(at,soft*noise(ts,270,2350),level,pan)
    for at,freq,level,pan in ((.15,146.8,.11,-.11),(1.92,110,.12,-.14),(3.22,196,.075,.16),
                              (5.33,98,.15,-.08),(7.6,147,.105,.14),(9.95,73.4,.18,.03),
                              (10.2,146.8,.088,-.22),(12.6,110,.08,.12)):
        ts=np.arange(round(SR*1.65))/SR
        phase=2*np.pi*freq*ts
        envelope=(1-np.exp(-ts*155))*np.exp(-ts*2.15)
        wave=envelope*(.63*np.sin(phase)+.22*np.sin(phase*2.008)+.10*np.sin(phase*3.02))
        add(at,wave,level,pan)
        if at+1.78<SECONDS:
            add(at+.13,wave,level*.19,-pan)
    args.output.parent.mkdir(parents=True,exist_ok=True)
    write(args.output,SR,np.int16(np.clip(out*open_tail[:,None],-.98,.98)*32767))


if __name__=='__main__':
    main()
