import { Experience } from 'soundworks/server';


// score constants
const TEMPO = 72;
const cuesLengthBoudaries = [
  [16, 26], [4, 16], [16, 24], [4, 16], [16, 24], [4, 16], [16, 24], [4, 16],
  [16, 24], [4, 16], [16, 24], [4, 16], [16, 24], [4, 16], [12, 24], [4, 16],
  [12, 24], [4, 16], [12, 24], [4, 16], [12, 24], [4, 16], [12, 24], [4, 16],
];

const nbrCues = cuesLengthBoudaries.length;
const nbrBeatsPerMeasure = 12;
const metricMeasureDuration = 12 / 16;

class Score {
  constructor() {
    this._currentCue = null;
    this._nextCue = null;
  }

  _getNbrMeasures(cueIndex) {
    const boundaries = cuesLengthBoudaries[cueIndex];
    const low = boundaries[0];
    const high = boundaries[1];

    return low + Math.floor(Math.random() * (high - low + 1));
  }

  getNextCue(currentCueIndex) {
    const nextCueIndex = currentCueIndex + 1;

    if (this._nextCue && this._nextCue.index === nextCueIndex)
      return this._nextCue;

    if (this._nextCue && this._nextCue.index === nextCueIndex - 1)
      this._currentCue = this._nextCue;

    const measure = this._currentCue.measure + this._currentCue.nbrMeasures;
    const nbrMeasures = this._getNbrMeasures(nextCueIndex % 12);

    const nextCue = {
      index: nextCueIndex,
      type: nextCueIndex % 2 === 0 ? 'hold' : 'acc',
      measure: measure,
      nbrMeasures: nbrMeasures,
      nbrBeats: nbrMeasures * nbrBeatsPerMeasure,
      startMetricPosition: measure * metricMeasureDuration,
      endMetricPosition: (measure + nbrMeasures) * metricMeasureDuration,
      patternOffset: Math.floor(nextCueIndex / 2),
    };

    this._nextCue = nextCue;

    return nextCue;
  }

  getCueAtMetricPosition(metricPosition) {
    if (!this._currentCue)
      this.resetCue();

    if (metricPosition >= this._currentCue.startMetricPosition &&
        metricPosition < this._currentCue.endMetricPosition
    ) {
      return this._currentCue;
    }

    if (metricPosition < this._currentCue.startMetricPosition)
      this.resetCue();

    while (metricPosition >= this._currentCue.endMetricPosition)
      this._currentCue = this.getNextCue(this._currentCue.index);

    return this._currentCue;
  }

  resetCues() {
    const nbrMeasures = this._getNbrMeasures(0);

    this._currentCue = {
      index: 0,
      type: 'hold',
      measure: 0,
      nbrMeasures: nbrMeasures,
      nbrBeats: nbrMeasures * nbrBeatsPerMeasure,
      startMetricPosition: 0,
      endMetricPosition: nbrMeasures * metricMeasureDuration,
      patternOffset: 0,
    };

    this._nextCue = null;

    return this._currentCue;
  }
}

// server-side 'player' experience.
export default class PlayerExperience extends Experience {
  constructor() {
    super('player');

    this.checkin = this.require('checkin');
    this.sharedParams = this.require('shared-params');

    this.metricScheduler = this.require('metric-scheduler', {
      tempo: TEMPO,
      tempoUnit: 3/8,
    });

    this.audioBufferManager = this.require('audio-buffer-manager');

    this.sharedConfig = this.require('shared-config');
    this.sharedConfig.share('application', 'player');

    this.score = new Score();

    this._onStart = this._onStart.bind(this);
    this._onPause = this._onPause.bind(this);
    this._onStop = this._onStop.bind(this);
  }

  start() {
    this.sharedParams.addParamListener('control', (value) => {
      switch (value) {
        case 'start':
          this._onStart();
          break;
        case 'pause':
          this._onPause();
          break;
        case 'stop':
          this._onStop();
          break;
      }
    });
  }

  enter(client) {
    super.enter(client);
    this.sharedParams.update('numPlayers', this.clients.length);

    this.receive(client, 'current-cue-request', () => {
      const metricPosition = this.metricScheduler.metricPosition;
      const currentCue = this.score.getCueAtMetricPosition(metricPosition);
      // console.log('metricPosition', metricPosition, 'current-cue', currentCue);

      this.send(client, 'current-cue', currentCue);
    });

    this.receive(client, 'next-cue-request', (currentCueIndex) => {
      const nextCue = this.score.getNextCue(currentCueIndex);
      // console.log('next-cue', nextCue);

      this.send(client, 'next-cue', nextCue);
    });
  }

  exit(client) {
    super.exit(client);
    this.sharedParams.update('numPlayers', this.clients.length);
  }

  _onStart() {
    const syncTime = this.metricScheduler.syncTime;
    const metricPosition = this.metricScheduler.metricPosition;

    this.metricScheduler.sync(syncTime + 0.5, metricPosition, TEMPO, 3/8, 'start');
  }

  _onPause() {
    const syncTime = this.metricScheduler.syncTime;
    const metricPosition = this.metricScheduler.metricPosition;

    this.metricScheduler.sync(syncTime, metricPosition, 0, 3/8, 'stop');
  }

  _onStop() {
    const syncTime = this.metricScheduler.syncTime;
    const metricPosition = 0;
    this.metricScheduler.sync(syncTime, metricPosition, 0, 3/8, 'stop');
    this.metricScheduler.clear();

    const firstCue = this.score.resetCues();
    this.broadcast('player', null, 'current-cue', firstCue);
  }
}
