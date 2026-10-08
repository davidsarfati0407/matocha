#!/usr/bin/env python3
"""Balance music under foley, duck the bed where the foley speaks, master to -14 LUFS / -2.3 dBTP (headroom for AAC)."""

import json
import os
import subprocess

import numpy as np
from scipy import signal
from scipy.io import wavfile

HERE = os.path.dirname(__file__)
AUD = os.path.join(HERE, "..", "assets", "audio")
SR = 48000


def lufs(path):
    out = subprocess.run(
        ["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "loudnorm=print_format=json", "-f", "null", "-"],
        capture_output=True, text=True).stderr
    js = json.loads(out[out.rindex("{"):out.rindex("}") + 1])
    return float(js["input_i"])


def load(path):
    sr, x = wavfile.read(path)
    assert sr == SR
    return x.T.astype(np.float64) / 32768.0


def save(path, x):
    wavfile.write(path, SR, (np.clip(x, -1, 1).T * 32767).astype(np.int16))


music_p = os.path.join(AUD, "music.raw.wav")
sfx_p = os.path.join(AUD, "sfx.raw.wav")
m = load(music_p) * 10 ** ((-17.5 - lufs(music_p)) / 20)
s = load(sfx_p) * 10 ** ((-17.0 - lufs(sfx_p)) / 20)

# duck the bed by up to ~4 dB while the foley is busy (50 ms attack / 250 ms release feel)
env = np.sqrt(np.mean(s ** 2, axis=0))
b, a = signal.butter(1, 4.0 / (SR / 2))
env = signal.filtfilt(b, a, env)
env /= env.max() + 1e-9
duck = 1.0 - 0.37 * np.clip(env * 1.6, 0, 1)
mix = m * duck + s

pre = os.path.join(AUD, "soundtrack.pre.wav")
save(pre, mix / (np.max(np.abs(mix)) + 1e-9) * 0.9)

# two-pass loudnorm → final soundtrack
first = subprocess.run(
    ["ffmpeg", "-hide_banner", "-nostats", "-i", pre, "-af",
     "loudnorm=I=-14:TP=-2.3:LRA=11:print_format=json", "-f", "null", "-"],
    capture_output=True, text=True).stderr
js = json.loads(first[first.rindex("{"):first.rindex("}") + 1])
flt = ("loudnorm=I=-14:TP=-2.3:LRA=11:measured_I={input_i}:measured_TP={input_tp}:"
       "measured_LRA={input_lra}:measured_thresh={input_thresh}:offset={target_offset}:linear=true").format(**js)
final = os.path.join(AUD, "soundtrack.wav")
subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", pre, "-af", flt, "-ar", str(SR),
                "-c:a", "pcm_s16le", final], check=True)
os.remove(pre)
print("final LUFS", lufs(final))
