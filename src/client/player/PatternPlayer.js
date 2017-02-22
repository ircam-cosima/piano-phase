import { audio } from 'soundworks/client';

const scheduler = audio.getScheduler();

class PatternPlayer {
  constructor(pattern, metricScheduler, renderer, synth) {
    this.pattern = pattern;
    this.metricScheduler = metricScheduler;
    this.renderer = renderer;
    this.synth = synth;

    this.lastNote = null;
  }

  advanceMetric(beatCount, offset) {
    const audioTime = this.metricScheduler.audioTime;
    const deltaTime = this.metricScheduler.deltaTime;

    const note = this.pattern[(beatCount + offset) % this.pattern.length];

    if (note !== 0) {
      this.synth.trigger(audioTime);
      setTimeout(() => this.renderer.trigger(), 1000 * deltaTime);
    } else if (note === 0 && this.lastNote !== 0) {
      this.synth.release(audioTime);
    }

    this.lastNote = note;
  }
}

export default PatternPlayer;
