// Excerpt from Papercraft v0.6.0 paper-motion.js by xikhar. MIT.

/**
 * The paper flap: one scalar p (0 = flat, 1 = upright, > 1 = overshoot). Rises on a soft spring (1.25 Hz, damping
 * 0.32), LATCHES at upright into a stiff 4.5 Hz quiver whose air drag eats the big swing and whose crease friction ends
 * the tail (8-15 % overshoot, 4-6 reversals, still by ~1 s); falls softly (0.5 Hz, damping 0.7, constant pull) after a
 * small outward unlatch twitch and lands with one 1-2 % slap. size 0..1: bigger = slower and whippier.
 * Values from a shipped pop-up game; p is a fraction of the fold angle, so it works for any angle.
 */
export class FlapSpring {
  constructor({ p = 0, size = 0.4, jitter = 0, quiverJitter = jitter } = {}) {
    const t = Math.min(1, Math.max(0, (size - 0.12) / 0.58));
    const fs = (1.14 + (0.88 - 1.14) * t) * (1 + jitter * 0.03), wob = 1 + t;
    Object.assign(this, {
      fs, p, v: 0, target: p, locked: p >= 1, atRest: true,
      kUp: 62 * fs * fs, cUp: 5 * fs * (1 - 0.5 * t),
      wL: 2 * Math.PI * 4.5 * (1 + quiverJitter * 0.03), zL: 0.04 / Math.sqrt(wob), dragL: 3.5 / Math.sqrt(wob), fricL: 2.2 * fs * (1 + 0.8 * t), // every size quivers at 4.5 Hz
      kDn: 10 * fs * fs, cDn: 4.5 * fs, gDn: 5 * fs * fs, antic: 1.2 * fs, rest: 0.25, minBounce: 0.5 * fs,
    });
  }
  /** Jump to p at rest: 0 = lying flat, 1 = standing (replays, captures, scrubbing). */
  reset(p = 0) { Object.assign(this, { p, v: 0, target: p, locked: p >= 1, atRest: true }); return this; }
  set(target) {
    if (target === this.target) return;
    if (target === 0 && this.atRest && this.p >= 1) this.v = this.antic; // unlatch twitch before the fall
    this.target = target; this.atRest = false; if (target === 0) this.locked = false;
  }
  step(dt) {
    const n = Math.max(1, Math.ceil(dt * 240)), h = dt / n;
    for (let i = 0; i < n && !this.atRest; i++) {
      let a;
      if (this.target === 1) {
        if (!this.locked && this.p >= 1) this.locked = true;
        a = this.locked
          ? -this.wL * this.wL * (this.p - 1) - (2 * this.zL * this.wL + this.dragL * Math.abs(this.v) + this.fricL / (Math.abs(this.v) + 0.05)) * this.v
          : this.kUp * (1 - this.p) - this.cUp * this.v;
      } else {
        a = -this.kDn * this.p - this.cDn * this.v - this.gDn;
        if (this.v > 0) a -= this.cUp * this.v * Math.min(1, this.p);
        if (this.p > 1) a -= this.wL * this.wL * (this.p - 1) + 2 * this.zL * this.wL * this.v; // the end stop still acts past upright
      }
      this.v += a * h; this.p += this.v * h;
      if (this.p <= 0 && this.target === 0) { this.p = 0; this.v = this.v < -this.minBounce ? -this.v * this.rest : 0; if (this.v === 0) this.atRest = true; }
      if (this.target === 1 && Math.abs(this.p - 1) < 0.002 && Math.abs(this.v) < 0.024) { this.p = 1; this.v = 0; this.atRest = true; }
    }
    return this.p;
  }
}

/**
 * Wind sway angle (radians) for a standing piece at (x, z) and time t: two travelling gust fronts so neighbours move
 * one after another, a flutter whose strength follows the gust. amp in degrees (0.5-2.5 for foliage, ~0.25 for fences,
 * 0 for walls). heroHeight = your hero's height in your units (gust wavelengths are ~23 / 13 / 8 hero heights).
 * Add the result to the HINGE angle (rotation about the fold line), never as an in-plane rotation that lifts a foot.
 * Pure function: no state, identical in every capture.
 */
export function windSway(t, x, z, { amp = 1.5, hz = 0.6, phase = 0, dir = 0.52, heroHeight = 0.6 } = {}) {
  const k = 0.6 / heroHeight; x *= k; z *= k;
  const dx = Math.cos(dir), dz = Math.sin(dir);
  const a = (x * dx + z * dz) * (2 * Math.PI / 14) - t * (2 * Math.PI / 9) + 1.7 * Math.sin((z * dx - x * dz) * (2 * Math.PI / 14) * 0.6);
  const b = (x * 0.31 - z * 0.95) * (2 * Math.PI / 8) - t * (2 * Math.PI / 5.3);
  const g = 0.5 + 0.32 * Math.sin(a) + 0.18 * Math.sin(b);
  const ph = hz * 2 * Math.PI * t + phase - (x * dx + z * dz) * (2 * Math.PI / 5);
  const e = 0.35 + 0.65 * g;
  return (amp * Math.PI / 180) * (0.5 * (g - 0.3) + e * (0.55 * Math.sin(ph) + 0.1 * Math.sin(2.31 * ph + 1.7)));
}
