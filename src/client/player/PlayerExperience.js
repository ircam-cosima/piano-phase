import * as soundworks from 'soundworks/client';
import SampleRenderer from './SampleRenderer';
import SampleSynth from './SampleSynth';
import PatternPlayer from './PatternPlayer';
import PatternMetro from './PatternMetro';

const audioContext = soundworks.audioContext;

const viewTemplate = `
  <canvas class="background"></canvas>
  <div class="foreground">
    <div class="section-top flex-middle"></div>
    <div class="section-center flex-center"></div>
    <div class="section-bottom flex-middle"></div>
  </div>
`;

const patternConfig = [
  {
    audio: 'sounds/STBPE4~1.mp3', // 'E4'
    pattern: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
  }, {
    audio: 'sounds/STBPFs~4.mp3', // 'F#4'
    pattern: [0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0],
  }, {
    audio: 'sounds/STBPB4~1.mp3', // 'B4'
    pattern: [0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0],
  }, {
    audio: 'sounds/STBPCs~5.mp3', // 'C#5'
    pattern: [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
  }, {
    audio: 'sounds/STBPD5~1.mp3', // 'D5'
    pattern: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
  },
];

class PlayerExperience extends soundworks.Experience {
  constructor(assetsDomain) {
    super();

    this.platform = this.require('platform', { features: ['web-audio'] });
    this.checkin = this.require('checkin', { showDialog: false });

    this.audioBufferManager = this.require('audio-buffer-manager', {
      assetsDomain: assetsDomain,
      files: patternConfig,
    });

    this.metricScheduler = this.require('metric-scheduler');
    this.sharedParams = this.require('shared-params');
    this.sharedConfig = this.require('shared-config');
    this.master = this.require('master', { debug: false });

    this.pianoIndex = null;
    this.patternIndex = null;
    this.score = null;
    this.patternPlayers = null;

    this.requestNextCue = this.requestNextCue.bind(this);
    this.onNextCueResponse = this.onNextCueResponse.bind(this);
    this.requestCurrentCue = this.requestCurrentCue.bind(this);
    this.onCurrentCueResponse = this.onCurrentCueResponse.bind(this);
  }

  init() {
    // initialize the view
    this.viewTemplate = viewTemplate;
    this.viewContent = {};
    this.viewCtor = soundworks.CanvasView;
    this.viewOptions = { preservePixelRatio: true };
    this.view = this.createView();
  }

  requestCurrentCue() {
    this.send('current-cue-request');
  }

  onCurrentCueResponse(cue) {
    this.scheduleCue(cue);
    this.requestNextCue(cue.index);
  }

  requestNextCue(cueIndex) {
    this.send('next-cue-request', cueIndex);
  }

  onNextCueResponse(cue) {
    this.scheduleCue(cue);
    // defer request for next cue
    this.metricScheduler.addEvent(() => {
      this.requestNextCue(cue.index);
    }, cue.startMetricPosition);
  }

  scheduleCue(cue) {
    let { type, patternOffset, nbrMeasures, nbrBeats, startMetricPosition } = cue;
    let tempoScale;

    if (this.pianoIndex === 0) {
      tempoScale = 1;
      patternOffset = 0;
    } else {
      if (type === 'acc')
        tempoScale = (nbrMeasures * 12 + 1) / (nbrMeasures * 12);
      else if (type === 'hold')
        tempoScale = 1;
    }

    const patternMetro = new PatternMetro(this.patternPlayers, patternOffset, nbrBeats);
    this.metricScheduler.addMetronome(patternMetro.metroFunction, 12, 16, tempoScale, startMetricPosition);
  }

  start() {
    super.start();

    if (!this.hasStarted)
      this.init();

    this.show();

    // define if pianoIndex 1 or pianoIndex 2
    const appConfig = this.sharedConfig.get('application');
    const clientIndex = soundworks.client.index;
    this.pianoIndex = clientIndex % 2;
    this.patternIndex = Math.floor((clientIndex % 10) / 2);

    // initialize rendering
    const output = this.master.getDestination();

    this.renderer = new SampleRenderer();
    this.patternPlayers = this.audioBufferManager.data.map((conf, index) => {
      const sampleSynth = new SampleSynth(conf.audio);
      sampleSynth.connect(output);

      return new PatternPlayer(conf.pattern, this.metricScheduler, this.renderer, sampleSynth);
    }).filter((patternPlayer, index) => {
      return appConfig.splitPiano ? index === this.patternIndex : true;
    });

    this.view.addRenderer(this.renderer);

    this.view.setPreRender(function(ctx, dt, canvasWidth, canvasHeight) {
      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      ctx.restore();
    });

    if (appConfig.logMetric)
      this._logMetric();

    this.receive('current-cue', this.onCurrentCueResponse);
    this.receive('next-cue', this.onNextCueResponse);
    this.requestCurrentCue();
  }

  _logMetric() {
    const metroFunction = (measure, beat) => {
      const metricPosition = this.metricScheduler.metricPosition;
      console.log('[metricPosition]', metricPosition);
    };
    // log each measure
    this.metricScheduler.addMetronome(metroFunction, 0.75, 1, 1, 0);
  }
}

export default PlayerExperience;
