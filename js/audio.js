export class Audio {
  constructor() {
    this.volume = 0.4;
    this.muted = false;
  }
  start() {
    if (this.ctx) {
      this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.volume;
    this.master.connect(this.ctx.destination);
    const b = this.ctx.createBuffer(
        1,
        this.ctx.sampleRate * 2,
        this.ctx.sampleRate,
      ),
      d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() - 0.5) * 0.1;
    this.crowd = this.ctx.createBufferSource();
    this.crowd.buffer = b;
    this.crowd.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.frequency.value = 550;
    this.crowdGain = this.ctx.createGain();
    this.crowdGain.gain.value = 0.18;
    this.crowd.connect(filter).connect(this.crowdGain).connect(this.master);
    this.crowd.start();
  }
  setVolume(v) {
    this.volume = v;
    if (this.master) this.master.gain.value = this.muted ? 0 : v;
  }
  toggle() {
    this.muted = !this.muted;
    this.setVolume(this.volume);
  }
  play(kind) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime,
      o = this.ctx.createOscillator(),
      g = this.ctx.createGain();
    const tones = {
      pack: [100, 700, 0.7],
      reveal: [440, 880, 0.3],
      rare: [330, 1320, 0.6],
      kick: [140, 40, 0.12],
      post: [1100, 550, 0.3],
      net: [400, 80, 0.2],
      whistle: [1800, 2100, 0.25],
      ui: [650, 850, 0.08],
    };
    const [a, b, d] = tones[kind] || tones.kick;
    o.type = kind === "post" ? "triangle" : "sine";
    o.frequency.setValueAtTime(a, t);
    o.frequency.exponentialRampToValueAtTime(b, t + d);
    g.gain.setValueAtTime(0.25, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + d);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + d);
    if (kind === "net" && this.crowdGain) {
      this.crowdGain.gain.setValueAtTime(1, t);
      this.crowdGain.gain.linearRampToValueAtTime(0.18, t + 3);
    }
  }
}
