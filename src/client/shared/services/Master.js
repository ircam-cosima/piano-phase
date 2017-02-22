import { Service, serviceManager, audioContext } from 'soundworks/client';

function dbToLin(val) {
  return Math.exp(0.11512925464970229 * val); // pow(10, val / 20)
}

const SERVICE_ID = 'service:master';

class Master extends Service {
  constructor() {
    super(SERVICE_ID);

    this.platform = this.require('platform', { features: ['web-audio'] });

    const defaults = {
      volume: 0, // in dB
      debug: false,
    };

    this.configure(defaults);
  }

  getDestination() {
    return this.input;
  }

  setVolume(value) {
    this.output.gain.value = dbToLin(value);
  }

  start() {
    super.start();

    this.output = audioContext.createGain();
    this.output.connect(audioContext.destination);
    this.output.gain.value = dbToLin(this.options.volume);

    this.input = this.output;

    if (this.options.debug) {
      console.warn('[service:master] Service in debug mode');

      const stereoPanner = audioContext.createStereoPanner();
      stereoPanner.connect(this.output);
      stereoPanner.pan.value = Math.random() * 2 - 1;

      // max 20 ms delay (6.4 meters)
      const delay = audioContext.createDelay();
      delay.connect(stereoPanner);
      delay.delayTime.value = Math.random() * 0.020;

      this.input = delay;
    }

    this.ready();
  }
}

serviceManager.register(SERVICE_ID, Master);

export default Master;
