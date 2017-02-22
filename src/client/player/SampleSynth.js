import { audioContext } from 'soundworks/client';

class SampleSynth {
  constructor(buffer) {
    this.buffer = buffer;

    this.output = audioContext.createGain();
    this.output.gain.value = 1;

    this.fadeOut = 0.3;
    this.env = null;
    this.src = null;
  }

  connect(destination) {
    this.output.connect(destination);
  }

  trigger(time) {
    if (this.env !== null && this.src !== null)
      this.release(time);

    const env = audioContext.createGain();
    env.connect(this.output);
    env.gain.value = 1;
    env.gain.setValueAtTime(1, time);

    const src = audioContext.createBufferSource();
    src.connect(env);
    src.buffer = this.buffer;
    src.start(time);

    this.env = env;
    this.src = src;
  }

  release(time) {
    if (this.env !== null && this.src !== null) {
      const fadeOut = this.fadeOut;

      this.env.gain.linearRampToValueAtTime(0, time + fadeOut);
      this.src.stop(time + fadeOut);

      this.env = null;
      this.src = null;
    }
  }
}

export default SampleSynth;
