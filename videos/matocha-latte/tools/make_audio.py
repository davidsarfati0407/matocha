#!/usr/bin/env python3
"""
MATOCHA — "Iced latte" film soundtrack + foley, synthesized from scratch.

Deterministic (seeded) and license-clean: every sample is generated here.
Grid: 96 BPM, 1 bar = 2.5 s, 1 beat = 0.625 s, 30 s total (12 bars).
The cue times below mirror STORYBOARD.md / index.html — change both together.

Outputs (48 kHz, stereo, 16-bit WAV, pre-master):
  assets/audio/music.wav   original 96 BPM lo-fi house bed
  assets/audio/sfx.wav     foley + transitions aligned to the picture
Loudness is finished with ffmpeg loudnorm by tools/master_audio.sh.
"""

import os
import numpy as np
from scipy import signal

SR = 48000
DUR = 30.0
N = int(SR * DUR)
BEAT = 0.625
BAR = 2.5
OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "audio")


# ----------------------------------------------------------------- helpers
def rng(seed):
    return np.random.default_rng(seed)


def tt(n):
    return np.arange(n) / SR


def ns(sec):
    return int(round(sec * SR))


def sos_filter(x, kind, freq, order=2):
    nyq = SR / 2
    if kind == "bp":
        lo, hi = freq
        sos = signal.butter(order, [max(lo, 10) / nyq, min(hi, nyq * 0.98) / nyq], btype="band", output="sos")
    else:
        sos = signal.butter(order, min(freq, nyq * 0.98) / nyq, btype=kind, output="sos")
    return signal.sosfilt(sos, x)


def lp(x, f, o=2):
    return sos_filter(x, "low", f, o)


def hp(x, f, o=2):
    return sos_filter(x, "high", f, o)


def bp(x, lo, hi, o=2):
    return sos_filter(x, "bp", (lo, hi), o)


def stereo():
    return np.zeros((2, N), dtype=np.float64)


def place(buf, x, t0, gain=1.0, pan=0.0):
    """Add a mono (n,) or stereo (2,n) signal at time t0 with equal-power pan."""
    i0 = ns(t0)
    if x.ndim == 1:
        ang = (pan + 1) * np.pi / 4
        x = np.vstack([x * np.cos(ang), x * np.sin(ang)])
    n = x.shape[1]
    if i0 < 0:
        x = x[:, -i0:]
        n = x.shape[1]
        i0 = 0
    if i0 >= N:
        return
    n = min(n, N - i0)
    buf[:, i0:i0 + n] += x[:, :n] * gain


def env_ad(n, att, dec, curve=1.0):
    t = tt(n)
    a = np.clip(t / max(att, 1e-4), 0, 1)
    d = np.exp(-np.maximum(t - att, 0) / max(dec, 1e-4))
    return (a ** curve) * d


def fade_edges(x, fi=0.003, fo=0.01):
    n = x.shape[-1]
    i = min(ns(fi), n // 2)
    o = min(ns(fo), n // 2)
    w = np.ones(n)
    if i > 0:
        w[:i] = np.linspace(0, 1, i)
    if o > 0:
        w[-o:] = np.linspace(1, 0, o)
    return x * w


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def moving_band_noise(dur, f_from, f_to, q=1.2, seed=0, nseg=48):
    """Noise whose band centre glides f_from → f_to (exponential), overlap-add."""
    n = ns(dur)
    src = rng(seed).standard_normal(n + SR)
    out = np.zeros(n)
    hop = max(n // nseg, 64)
    win = 2 * hop
    w = np.hanning(win)
    for k in range(0, n, hop):
        frac = min(k / max(n - 1, 1), 1.0)
        fc = f_from * (f_to / f_from) ** frac
        lo, hi = fc / (1 + 1 / q), fc * (1 + 1 / q)
        seg = src[k:k + win + 2048]
        y = bp(seg, lo, hi, 2)[2048 // 2: 2048 // 2 + win]
        if len(y) < win:
            y = np.pad(y, (0, win - len(y)))
        end = min(k + win, n)
        out[k:end] += (y * w)[: end - k]
    return out / (np.max(np.abs(out)) + 1e-9)


def reverb_ir(rt=1.8, seed=7, damp=5200, pre=0.012):
    n = ns(rt * 1.2)
    t = tt(n)
    r = rng(seed)
    ir = np.zeros((2, n))
    for c in range(2):
        noise = r.standard_normal(n)
        decay = np.exp(-6.9 * t / rt)
        x = noise * decay
        # darker tail: blend a low-passed copy in as time goes on
        dark = lp(x, damp * 0.35, 2)
        mix = np.clip(t / rt, 0, 1)
        ir[c] = (1 - mix) * lp(x, damp, 2) + mix * dark
    ir[:, : ns(pre)] = 0
    # a few early reflections
    for d, g in [(0.017, 0.5), (0.029, 0.35), (0.041, 0.28), (0.057, 0.2)]:
        ir[0, ns(d)] += g
        ir[1, ns(d * 1.13)] += g
    ir /= np.sqrt(np.sum(ir ** 2) / 2)
    return ir


IR_ROOM = reverb_ir(1.6, seed=11)
IR_SMALL = reverb_ir(0.55, seed=12, damp=7000, pre=0.004)


def add_reverb(x, ir, wet):
    y = np.vstack([signal.fftconvolve(x[c], ir[c])[: x.shape[1]] for c in range(2)])
    return x + y * wet


def soft_clip(x, drive=1.0):
    return np.tanh(x * drive) / np.tanh(drive)


# ----------------------------------------------------------------- music voices
def keys_note(f, dur, vel=1.0, seed=0):
    """Electric-piano tine: 2-op FM with a decaying index + bell partial."""
    tail = 0.6
    n = ns(dur + tail)
    t = tt(n)
    idx = 1.8 * np.exp(-t / 0.18) + 0.25
    car = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * t))
    bell = 0.10 * np.sin(2 * np.pi * f * 7.02 * t) * np.exp(-t / 0.045)
    body = 0.35 * np.sin(2 * np.pi * f * 2.0 * t) * np.exp(-t / 0.5)
    tau = 1.25 * (220 / f) ** 0.35
    amp = env_ad(n, 0.004, tau)
    rel = np.ones(n)
    k = ns(dur)
    rel[k:] = np.exp(-tt(n - k) / 0.12)
    y = (car + bell + body) * amp * rel * vel
    return lp(y, 3800, 2)


def pad_note(f, dur, seed=0):
    n = ns(dur + 1.0)
    t = tt(n)
    y = np.zeros(n)
    for det, ph in [(-0.004, 0.0), (0.0035, 1.3)]:
        ff = f * (1 + det)
        for h in range(1, 14):
            if ff * h > 5000:
                break
            y += np.sin(2 * np.pi * ff * h * t + ph * h) / h
    a = np.clip(t / 0.7, 0, 1) ** 2
    r = np.ones(n)
    k = ns(dur)
    r[k:] = np.exp(-tt(n - k) / 0.35)
    return lp(y * a * r, 1500, 2) * 0.12


def bass_note(f, dur, vel=1.0):
    n = ns(dur + 0.05)
    t = tt(n)
    y = np.sin(2 * np.pi * f * t) + 0.28 * np.sin(2 * np.pi * 2 * f * t) + 0.08 * np.sin(2 * np.pi * 3 * f * t)
    a = env_ad(n, 0.006, 0.9)
    r = np.ones(n)
    k = ns(dur)
    r[k:] = np.exp(-tt(n - k) / 0.02)
    return soft_clip(y * a * r * vel, 1.6)


def kick(vel=1.0, seed=1):
    n = ns(0.5)
    t = tt(n)
    f = 46 + 110 * np.exp(-t / 0.032)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t / 0.26)
    click = hp(rng(seed).standard_normal(n), 2500) * np.exp(-t / 0.0035) * 0.25
    return soft_clip((body + click) * vel, 1.4)


def clap(vel=1.0, seed=2):
    n = ns(0.45)
    t = tt(n)
    nz = bp(rng(seed).standard_normal(n), 900, 5500)
    e = np.zeros(n)
    for d in (0.0, 0.009, 0.019):
        e += np.where(t >= d, np.exp(-(t - d) / 0.008), 0)
    e += np.where(t >= 0.026, np.exp(-(t - 0.026) / 0.11), 0) * 0.8
    tone = np.sin(2 * np.pi * 205 * t) * np.exp(-t / 0.05) * 0.25
    return (nz * e + tone) * vel * 0.9


def hat(open_=False, vel=1.0, seed=3):
    n = ns(0.4 if open_ else 0.08)
    t = tt(n)
    nz = hp(rng(seed).standard_normal(n), 7200, 2)
    metal = sum(np.sign(np.sin(2 * np.pi * f * t)) for f in (5200, 6930, 8170)) * 0.15
    e = np.exp(-t / (0.16 if open_ else 0.022))
    return (nz + hp(metal, 6000)) * e * vel * 0.5


def shaker(vel=1.0, seed=4):
    n = ns(0.12)
    t = tt(n)
    nz = bp(rng(seed).standard_normal(n), 4800, 11000)
    e = np.clip(t / 0.012, 0, 1) * np.exp(-np.maximum(t - 0.012, 0) / 0.04)
    return nz * e * vel * 0.55


def crash(seed=5, dur=2.4):
    n = ns(dur)
    t = tt(n)
    nz = hp(rng(seed).standard_normal(n), 3800, 2)
    ring = sum(np.sin(2 * np.pi * f * t + i) for i, f in enumerate((3150, 4470, 5910, 7390))) * 0.05
    return (nz * 0.6 + ring) * np.exp(-t / 0.8)


def sub_boom(dur=1.4):
    n = ns(dur)
    t = tt(n)
    f = 38 + 22 * np.exp(-t / 0.25)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t / 0.55) * np.clip(t / 0.004, 0, 1)


def vinyl(seed=9):
    r = rng(seed)
    x = lp(r.standard_normal(N), 5000) * 0.006
    pops = np.zeros(N)
    idx = r.integers(0, N, size=int(DUR * 7))
    pops[idx] = r.uniform(0.2, 1.0, size=idx.size) * r.choice([-1, 1], size=idx.size)
    pops = bp(pops, 900, 6000) * 0.09
    return x + pops


# ----------------------------------------------------------------- the song
CHORDS = {
    "Gmaj9": ([55, 59, 62, 66, 69], 43),
    "F#m9": ([54, 57, 61, 64, 68], 42),
    "Em9": ([52, 55, 59, 62, 66], 40),
    "A9sus": ([57, 62, 64, 67, 71], 45),
    "A13": ([57, 61, 66, 67, 71], 45),
    "Dmaj9": ([50, 54, 57, 61, 64, 69], 38),
}
# one entry per bar (bar 11 splits in half)
PROGRESSION = [
    ["Gmaj9"], ["Gmaj9"], ["F#m9"], ["Em9"], ["A9sus"], ["Gmaj9"],
    ["F#m9"], ["Em9"], ["A9sus"], ["Gmaj9"], ["Em9", "A13"], ["Dmaj9"],
]


def build_music():
    drums = stereo()
    bass = stereo()
    keys = stereo()
    pad = stereo()
    fx = stereo()
    kick_times = []

    for b, chords in enumerate(PROGRESSION):
        t0 = b * BAR
        half = BAR / len(chords)
        for ci, name in enumerate(chords):
            notes, root = CHORDS[name]
            ct = t0 + ci * half
            # pad under everything (louder in the intro and the breakdown)
            pad_gain = 1.6 if b in (0, 9) else 1.0
            if b == 11:
                pad_gain = 1.4
            for j, m in enumerate(notes):
                place(pad, pad_note(midi(m), half if b != 11 else 2.4, seed=b * 10 + j), ct, pad_gain, pan=(j - 2) * 0.25)
            if b == 0:
                continue  # intro: pad only
            # keys: long hit on the downbeat + a short anticipation on the and-of-3
            hits = [(0.0, 1.15, 1.0), (1.5625, 0.7, 0.62)] if len(chords) == 1 else [(0.0, 0.9, 0.95)]
            if b == 11:
                hits = [(0.0, 2.3, 1.0)]
            for (off, d, v) in hits:
                for j, m in enumerate(notes):
                    strum = j * 0.009
                    vel = v * (0.9 + 0.1 * np.cos(j * 1.7 + b))
                    place(keys, keys_note(midi(m), d, vel), ct + off + strum, 0.16, pan=(j - 2) * 0.18)
            # bass
            if b != 9:
                pattern = [(0.0, 0.5, 1.0, 0), (0.9375, 0.22, 0.75, 0), (1.25, 0.45, 0.9, 0), (2.1875, 0.2, 0.7, 12)]
                if len(chords) == 2:
                    pattern = [(0.0, 0.5, 1.0, 0), (0.9375, 0.22, 0.75, 0)]
                if b == 11:
                    pattern = [(0.0, 1.9, 1.0, 0)]
                if b in (6, 7):  # whisk section: a busier line
                    pattern = [(0.0, 0.3, 1.0, 0), (0.3125, 0.15, 0.6, 12), (0.9375, 0.22, 0.8, 0),
                               (1.25, 0.3, 0.9, 0), (1.5625, 0.15, 0.6, 7), (1.875, 0.2, 0.75, 0), (2.1875, 0.2, 0.7, 12)]
                for (off, d, v, iv) in pattern:
                    place(bass, bass_note(midi(root + iv), d, v), ct + off, 0.33)

        # ---- drums
        if b == 0:
            continue
        breakdown = b == 9
        last = b == 11
        for beat in range(4):
            bt = t0 + beat * BEAT
            if last and bt >= 29.3:
                break
            if not breakdown:
                if beat in (0, 2):
                    place(drums, kick(1.0, seed=100 + b), bt, 0.62)
                    kick_times.append(bt)
                if beat in (1, 3):
                    place(drums, clap(1.0, seed=200 + b * 4 + beat), bt, 0.36)
            # hats on the 8ths, accent the off-beats
            for h in range(2):
                ht = bt + h * BEAT / 2
                if last and ht >= 29.3:
                    break
                vel = 0.5 if h == 0 else 0.85
                if breakdown:
                    vel *= 0.45
                op = (beat == 3 and h == 1 and not breakdown)
                place(drums, hat(op, vel, seed=300 + b * 8 + beat * 2 + h), ht, 0.28, pan=0.22)
        if not breakdown and b != 11:
            place(drums, kick(0.55, seed=150 + b), t0 + 0.9375, 0.45)  # ghost kick, and-of-2
            kick_times.append(t0 + 0.9375)
        if b in (6, 7):  # whisk section — 16th shaker
            for s in range(16):
                st = t0 + s * BEAT / 4
                acc = [1.0, 0.45, 0.7, 0.5][s % 4]
                place(drums, shaker(acc, seed=400 + b * 16 + s), st, 0.32, pan=-0.3)

    # intro riser + impact into the 2.5 s drop
    rs = moving_band_noise(2.1, 250, 6500, q=1.6, seed=21)
    rs *= np.linspace(0, 1, rs.size) ** 2.2
    place(fx, rs, 0.4, 0.11, pan=0.0)
    place(fx, sub_boom(1.6), 2.5, 0.55)
    place(drums, kick(1.0, seed=99), 2.5, 0.6)
    kick_times.append(2.5)
    place(fx, crash(seed=31, dur=2.6), 2.5, 0.1, pan=0.25)

    # reverse cymbal into the hero reveal, crash on it
    rc = crash(seed=41, dur=2.0)[::-1]
    place(fx, rc, 25.0 - rc.size / SR, 0.16, pan=-0.2)
    place(fx, crash(seed=42, dur=2.6), 25.0, 0.13, pan=0.2)
    place(fx, sub_boom(1.2), 25.0, 0.4)
    # small lift into the whisk section
    rs2 = moving_band_noise(1.2, 600, 7000, q=2.0, seed=23)
    rs2 *= np.linspace(0, 1, rs2.size) ** 2
    place(fx, rs2, 13.8, 0.06)

    # sidechain pump on the melodic bus
    g = np.ones(N)
    tvec = tt(N)
    for k in kick_times:
        i = ns(k)
        seg = tvec[: N - i]
        g[i:] *= 1 - 0.38 * np.exp(-seg / 0.16)
    melodic = (keys + pad) * g
    melodic = add_reverb(melodic, IR_ROOM, 0.22)
    drums = add_reverb(drums, IR_SMALL, 0.12)
    bass = bass * (0.75 + 0.25 * g)

    mix = drums + bass + melodic + fx + np.vstack([vinyl(), vinyl(10)])
    # final bar: let the Dmaj9 ring, fade the last 0.6 s
    fade = np.ones(N)
    fade[ns(29.4):] = np.linspace(1, 0, N - ns(29.4)) ** 1.5
    mix *= fade
    # gentle glue: low shelf tidy + soft clip
    mix = np.vstack([hp(mix[c], 28, 2) for c in range(2)])
    mix /= np.max(np.abs(mix)) + 1e-9
    return soft_clip(mix * 1.15, 1.2) * 0.9


# ----------------------------------------------------------------- foley
def whoosh(dur, f_from, f_to, seed, peak=0.6):
    x = moving_band_noise(dur, f_from, f_to, q=1.3, seed=seed)
    t = np.linspace(0, 1, x.size)
    shape = np.sin(np.pi * np.clip((t / peak) * 0.5, 0, 0.5)) * (t <= peak) + (t > peak) * np.cos(
        np.pi * 0.5 * np.clip((t - peak) / (1 - peak), 0, 1))
    return x * shape


def pan_sweep(x, p0, p1):
    t = np.linspace(0, 1, x.size)
    p = p0 + (p1 - p0) * t
    ang = (p + 1) * np.pi / 4
    return np.vstack([x * np.cos(ang), x * np.sin(ang)])


def brush(dur, seed):
    n = ns(dur)
    t = np.linspace(0, 1, n)
    nz = bp(rng(seed).standard_normal(n), 2200, 7500)
    speed = np.sin(np.pi * t) ** 1.5
    grain = 0.7 + 0.3 * np.sin(2 * np.pi * 37 * tt(n))
    return nz * speed * grain


def thock(seed):
    n = ns(0.25)
    t = tt(n)
    body = np.sin(2 * np.pi * 118 * t) * np.exp(-t / 0.06)
    card = bp(rng(seed).standard_normal(n), 260, 1900) * np.exp(-t / 0.035)
    return body * 0.9 + card * 0.7


def creak(dur, seed):
    n = ns(dur)
    r = rng(seed)
    nz = bp(r.standard_normal(n), 450, 2600)
    am = np.abs(lp(r.standard_normal(n), 35)) * 6
    t = np.linspace(0, 1, n)
    return nz * np.clip(am, 0, 1.4) * np.sin(np.pi * t) ** 0.8


def tok(f, seed):
    n = ns(0.12)
    t = tt(n)
    y = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.028)
    y += np.sin(2 * np.pi * f * 2.7 * t) * np.exp(-t / 0.012) * 0.3
    y += bp(rng(seed).standard_normal(n), 1500, 6000) * np.exp(-t / 0.004) * 0.4
    return y


def rip(seed, dur=0.3):
    n = ns(dur)
    r = rng(seed)
    t = np.linspace(0, 1, n)
    bed = bp(r.standard_normal(n), 1800, 8000) * (t ** 0.6) * np.where(t < 0.93, 1, (1 - t) / 0.07)
    clicks = np.zeros(n)
    count = 90
    pos = np.sort((r.uniform(0, 1, count) ** 0.7) * (n - 400)).astype(int)
    clicks[pos] = r.uniform(0.4, 1, count)
    clicks = bp(clicks, 1500, 9000) * 6
    return bed * 0.55 + clicks * 0.5


def puff(seed, dur=0.35):
    n = ns(dur)
    t = tt(n)
    nz = lp(rng(seed).standard_normal(n), 1300)
    return nz * np.clip(t / 0.012, 0, 1) * np.exp(-t / 0.09)


def sand(dur, seed):
    n = ns(dur)
    r = rng(seed)
    t = np.linspace(0, 1, n)
    hiss = bp(r.standard_normal(n), 2800, 9500)
    grains = np.abs(lp(r.standard_normal(n), 180)) * 3
    env = np.clip(t / 0.06, 0, 1) * np.clip((1 - t) / 0.12, 0, 1)
    low = lp(r.standard_normal(n), 700) * 0.4
    return (hiss * np.clip(grains, 0.2, 1.3) + low) * env


def bubbles(dur, seed, rate, f_lo, f_hi, rise=1.0, tau=(0.008, 0.03)):
    """Minnaert-style bubbles: decaying sines whose pitch glides upward."""
    n = ns(dur)
    r = rng(seed)
    out = np.zeros(n)
    count = int(dur * rate)
    for _ in range(count):
        t0 = r.uniform(0, dur - 0.06)
        prog = t0 / dur
        f0 = r.uniform(f_lo, f_hi) * (1 + 0.8 * rise * prog)
        ta = r.uniform(*tau)
        m = ns(ta * 6)
        tb = tt(m)
        f = f0 * (1 + 2.2 * tb / (ta * 6))
        ph = 2 * np.pi * np.cumsum(f) / SR
        b = np.sin(ph) * np.exp(-tb / ta) * r.uniform(0.3, 1.0)
        i = ns(t0)
        out[i:i + m] += b[: max(0, min(m, n - i))]
    return out


def resonant_fill(x, f_from, f_to, nseg=40):
    """The 'glass filling' cue: a resonance that rises as the level rises."""
    n = x.size
    out = np.zeros(n)
    hop = max(n // nseg, 64)
    win = 2 * hop
    w = np.hanning(win)
    pad = np.pad(x, (0, win + 4096))
    for k in range(0, n, hop):
        frac = k / max(n - 1, 1)
        fc = f_from * (f_to / f_from) ** frac
        b, a = signal.iirpeak(fc / (SR / 2), 4.0)
        seg = signal.lfilter(b, a, pad[k:k + win + 4096])[: win]
        end = min(k + win, n)
        out[k:end] += (seg * w)[: end - k]
    return out


def pour_liquid(dur, seed, thick=False):
    n = ns(dur)
    r = rng(seed)
    t = np.linspace(0, 1, n)
    lo, hi = (380, 3200) if thick else (700, 5600)
    stream = bp(r.standard_normal(n), lo, hi)
    flow = 0.75 + 0.25 * lp(r.standard_normal(n), 9) * 4
    res = resonant_fill(stream, 420 if thick else 650, 1050 if thick else 1700)
    bub = bubbles(dur, seed + 1, 55 if thick else 90, 180 if thick else 380, 700 if thick else 1500,
                  tau=(0.012, 0.04) if thick else (0.006, 0.022))
    env = np.clip(t / 0.05, 0, 1) * np.clip((1 - t) / 0.1, 0, 1)
    return (stream * 0.35 * flow + res * 0.55 + bub * 0.5) * env


def whisk_stroke(seed, dur=0.15):
    n = ns(dur)
    t = tt(n)
    nz = bp(rng(seed).standard_normal(n), 1300, 6500)
    e = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 2
    slosh = lp(rng(seed + 7).standard_normal(n), 420) * e * 0.8
    return nz * e + slosh


def clink(seed, f0=2350):
    n = ns(0.6)
    t = tt(n)
    parts = [(1.0, 0.24, 1.0), (1.58, 0.17, 0.7), (2.26, 0.11, 0.5), (2.93, 0.07, 0.35)]
    y = sum(a * np.sin(2 * np.pi * f0 * m * t) * np.exp(-t / d) for (m, d, a) in parts)
    y += hp(rng(seed).standard_normal(n), 4000) * np.exp(-t / 0.003) * 0.6
    return y * 0.7


def plop(seed):
    n = ns(0.12)
    t = tt(n)
    f = 950 * np.exp(-t / 0.035) + 220
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t / 0.03) + bp(rng(seed).standard_normal(n), 900, 6000) * np.exp(-t / 0.05) * 0.5


def tick(seed):
    n = ns(0.05)
    t = tt(n)
    return np.sin(2 * np.pi * 2300 * t) * np.exp(-t / 0.006) + hp(rng(seed).standard_normal(n), 5000) * np.exp(
        -t / 0.002) * 0.4


def pop(seed):
    n = ns(0.18)
    t = tt(n)
    f = 260 + 900 * (1 - np.exp(-t / 0.03))
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t / 0.045)


def bell(f):
    n = ns(2.6)
    t = tt(n)
    idx = 2.4 * np.exp(-t / 0.5)
    y = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * 3.5 * t)) * np.exp(-t / 0.9)
    y += 0.4 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t / 0.4)
    return y * np.clip(t / 0.002, 0, 1)


def sheen_ting(seed):
    n = ns(1.0)
    t = tt(n)
    y = sum(np.sin(2 * np.pi * f * t) * np.exp(-t / 0.35) for f in (2637, 3951, 5274)) / 3
    return hp(y, 1500) * np.clip(t / 0.01, 0, 1)


def build_sfx():
    s = stereo()
    # 0 — the emblem draws itself, camera pulls back
    place(s, brush(0.75, 501), 0.04, 0.10, pan=-0.2)
    place(s, brush(0.5, 502), 0.3, 0.07, pan=0.25)
    place(s, pan_sweep(whoosh(1.55, 300, 2600, 503, peak=0.85), 0.3, -0.2), 0.95, 0.22)
    place(s, sheen_ting(504), 3.35, 0.05, pan=0.3)
    # 5 — Open
    place(s, tick(505), 5.0, 0.08)
    place(s, creak(0.55, 506), 5.05, 0.16, pan=0.1)
    place(s, thock(507), 5.5, 0.4, pan=0.05)
    for i in range(7):
        order = [3, 2, 4, 1, 5, 0, 6][i]
        place(s, tok(780 + 85 * ((i * 37) % 7), 510 + i), 5.45 + i * 0.055, 0.16, pan=(order - 3) * 0.2)
    place(s, pan_sweep(whoosh(1.25, 200, 3800, 520, peak=0.9), -0.1, 0.1), 6.25, 0.24)
    # 7.5 — Tear
    place(s, tick(521), 7.5, 0.08)
    place(s, rip(522), 8.06, 0.45, pan=0.15)
    place(s, puff(523), 8.16, 0.3, pan=0.1)
    place(s, pan_sweep(whoosh(1.3, 1800, 260, 524, peak=0.35), 0.25, -0.25), 8.42, 0.2)
    # 10 — Pour (powder)
    place(s, tick(525), 10.0, 0.08)
    place(s, sand(1.45, 526), 9.95, 0.22, pan=-0.05)
    place(s, puff(527, 0.5), 10.6, 0.16)
    place(s, tok(520, 528), 11.40, 0.22, pan=0.25)
    place(s, tok(470, 529), 11.58, 0.2, pan=0.25)
    place(s, pan_sweep(whoosh(0.5, 600, 3000, 530, peak=0.4), 0.1, 0.6), 11.72, 0.16)
    # 12.5 — water
    place(s, pour_liquid(1.75, 531), 12.88, 0.42, pan=0.05)
    # 15 — Whisk (iris + whisk in + strokes on the 16ths)
    place(s, tick(532), 15.3, 0.08)
    place(s, pan_sweep(whoosh(0.7, 300, 4200, 533, peak=0.55), -0.3, 0.3), 14.95, 0.2)
    place(s, pan_sweep(whoosh(0.45, 3000, 500, 534, peak=0.5), 0.0, 0.0), 15.12, 0.16)
    t0 = 15.546875
    k = 0
    while True:
        tc = t0 + k * 0.15625
        if tc > 18.72:
            break
        ramp = min(1.0, (tc - 15.55) / 0.25) * min(1.0, (18.75 - tc) / 0.25)
        place(s, whisk_stroke(540 + k, 0.15), tc - 0.075, 0.2 * max(ramp, 0.25), pan=0.18 if k % 2 == 0 else -0.18)
        k += 1
    place(s, bubbles(3.2, 545, 45, 500, 1400) * 0.6, 15.6, 0.25)
    place(s, pan_sweep(whoosh(0.35, 700, 5000, 546, peak=0.3), 0.0, 0.2), 18.72, 0.16)
    # 20 — Ice
    place(s, tick(547), 19.88, 0.08)
    for i, tc in enumerate((20.0, 20.3125, 20.625)):
        place(s, clink(550 + i, 2350 + i * 230), tc, 0.24, pan=(-0.25, 0.1, 0.3)[i])
        place(s, plop(553 + i), tc + 0.01, 0.2, pan=(-0.25, 0.1, 0.3)[i])
        if i > 0:
            place(s, clink(556 + i, 2900 + i * 170), tc + 0.06, 0.1, pan=0.0)
    # 21.25 — Milk
    place(s, tick(560), 21.25, 0.08)
    place(s, pour_liquid(2.6, 561, thick=True), 21.52, 0.46, pan=-0.05)
    # 25 — Hero
    place(s, pan_sweep(whoosh(1.4, 220, 3000, 562, peak=0.4), -0.4, 0.4), 24.95, 0.24)
    # 27.5 — CTA
    place(s, tick(563), 27.5, 0.07)
    place(s, pop(564), 28.1, 0.2)
    place(s, bell(1174.66), 28.12, 0.07, pan=0.15)
    place(s, bell(1760.0), 28.14, 0.035, pan=-0.15)
    place(s, sheen_ting(565), 28.75, 0.04, pan=-0.3)

    s = add_reverb(s, IR_SMALL, 0.18)
    s = np.vstack([hp(s[c], 60, 2) for c in range(2)])
    return s


def write_wav(path, x):
    from scipy.io import wavfile
    x = np.clip(x, -1, 1)
    wavfile.write(path, SR, (x.T * 32767).astype(np.int16))


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    m = build_music()
    write_wav(os.path.join(OUT, "music.raw.wav"), m)
    f = build_sfx()
    pk = np.max(np.abs(f))
    write_wav(os.path.join(OUT, "sfx.raw.wav"), f / max(pk, 1e-9) * 0.89)
    print("music peak", float(np.max(np.abs(m))), "sfx peak (pre-norm)", float(pk))
