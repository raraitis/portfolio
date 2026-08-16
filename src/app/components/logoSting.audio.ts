// Synthesized sound design for LogoSting — whooshes, impacts, ring boom and
// shimmer, all built from oscillators + filtered noise (no samples). One-shots
// are silently skipped when the browser blocks audio (no prior user gesture).

export interface StingAudio {
  whoosh: () => void;
  impact: () => void;
  swell: () => void;
  ringBoom: () => void;
  /** Quick fade for skip/finish — future one-shots still schedule but inaudibly. */
  stop: () => void;
  dispose: () => void;
}

const MASTER_GAIN = 0.5;

export function createStingAudio(): StingAudio {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let noiseBuffer: AudioBuffer | null = null;
  let stopped = false;

  // Lazy init: the context is created on the first one-shot. With Chrome's
  // sticky-activation rule it runs when the sting was opened by a click/key;
  // on the ?sting=1 timer path (no gesture) it stays suspended → visual-only.
  const ensure = (): AudioContext | null => {
    if (stopped) return null;
    if (!ctx) {
      try {
        ctx = new AudioContext();
      } catch {
        return null; // no WebAudio — stay silent
      }
      master = ctx.createGain();
      master.gain.value = MASTER_GAIN;
      master.connect(ctx.destination);
      noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') {
      void ctx.resume().catch(() => undefined);
    }
    return ctx.state === 'running' ? ctx : null;
  };

  const noiseSource = (c: AudioContext): AudioBufferSourceNode => {
    const src = c.createBufferSource();
    src.buffer = noiseBuffer;
    src.loop = true;
    src.loopStart = 0;
    src.loopEnd = noiseBuffer ? noiseBuffer.duration : 1;
    return src;
  };

  const whoosh = (): void => {
    const c = ensure();
    if (!c || !master) return;
    const t = c.currentTime;
    const src = noiseSource(c);
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 0.9;
    bp.frequency.setValueAtTime(300, t);
    bp.frequency.exponentialRampToValueAtTime(2600, t + 0.2);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.35, t + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
    src.connect(bp).connect(g).connect(master);
    src.start(t, Math.random() * 0.4);
    src.stop(t + 0.26);
  };

  const impact = (): void => {
    const c = ensure();
    if (!c || !master) return;
    const t = c.currentTime;
    // Sub thud: falling sine
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);
    const og = c.createGain();
    og.gain.setValueAtTime(0.9, t);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
    osc.connect(og).connect(master);
    osc.start(t);
    osc.stop(t + 0.3);
    // Surface click: short lowpassed noise
    const click = noiseSource(c);
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 3000;
    const cg = c.createGain();
    cg.gain.setValueAtTime(0.4, t);
    cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    click.connect(lp).connect(cg).connect(master);
    click.start(t, Math.random() * 0.4);
    click.stop(t + 0.06);
  };

  const swell = (): void => {
    const c = ensure();
    if (!c || !master) return;
    const t = c.currentTime;
    const src = noiseSource(c);
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 1;
    bp.frequency.value = 1200;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.18);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    src.connect(bp).connect(g).connect(master);
    src.start(t, Math.random() * 0.4);
    src.stop(t + 0.55);
  };

  const ringBoom = (): void => {
    const c = ensure();
    if (!c || !master) return;
    const out = master; // non-null capture for the shimmer closure below
    const t = c.currentTime;
    // Deep drop
    const sub = c.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(85, t);
    sub.frequency.exponentialRampToValueAtTime(30, t + 0.5);
    const sg = c.createGain();
    sg.gain.setValueAtTime(1, t);
    sg.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    sub.connect(sg).connect(master);
    sub.start(t);
    sub.stop(t + 0.95);
    // Crash: highpassed noise tail
    const crash = noiseSource(c);
    const hp = c.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 2500;
    const crg = c.createGain();
    crg.gain.setValueAtTime(0.3, t);
    crg.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
    crash.connect(hp).connect(crg).connect(master);
    crash.start(t, Math.random() * 0.4);
    crash.stop(t + 0.85);
    // Shimmer: detuned high partials for the glint
    const partials = [2093, 2637, 3136, 3951, 5274];
    partials.forEach((freq, i) => {
      const osc = c.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq * (1 + (i % 2 === 0 ? 1 : -1) * 0.002);
      const g = c.createGain();
      g.gain.setValueAtTime(0.05, t + 0.05 + i * 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
      osc.connect(g).connect(out);
      osc.start(t + 0.05 + i * 0.02);
      osc.stop(t + 1.15);
    });
  };

  const stop = (): void => {
    stopped = true;
    if (ctx && master && ctx.state === 'running') {
      master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
      master.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
    }
  };

  const dispose = (): void => {
    stopped = true;
    if (ctx && ctx.state !== 'closed') {
      void ctx.close().catch(() => undefined);
    }
    ctx = null;
    master = null;
    noiseBuffer = null;
  };

  return { whoosh, impact, swell, ringBoom, stop, dispose };
}
