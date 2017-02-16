import * as soundworks from 'soundworks/client';
import PlayerRenderer from './PlayerRenderer';

const audioContext = soundworks.audioContext;

const viewTemplate = `
  <canvas class="background"></canvas>
  <div class="foreground">
    <div class="section-top flex-middle"></div>
    <div class="section-center flex-center">
      <p class="big"><%= title %></p>
    </div>
    <div class="section-bottom flex-middle"></div>
  </div>
`;

const audioFiles = [
  'sounds/click.mp3',
  'sounds/clack.mp3'
];

// this experience plays a sound when it starts, and plays another sound when
// other clients join the experience
export default class PlayerExperience extends soundworks.Experience {
  constructor(assetsDomain) {
    super();

    this.platform = this.require('platform', { features: ['web-audio'] });
    this.checkin = this.require('checkin', { showDialog: false });
    this.audioBufferManager = this.require('audio-buffer-manager', {
      assetsDomain: assetsDomain,
      files: audioFiles,
    });
    this.metricScheduler = this.require('metric-scheduler');
    this.sharedParams = this.require('shared-params');
  }

  init() {
    // initialize the view
    this.viewTemplate = viewTemplate;
    this.viewContent = { title: `Let's go!` };
    this.viewCtor = soundworks.CanvasView;
    this.viewOptions = { preservePixelRatio: true };
    this.view = this.createView();
  }

  start() {
    super.start(); // don't forget this

    if (!this.hasStarted)
      this.init();

    this.show();

    const metrofunction = (measureCount, beatCount) => {
      const bufferIndex = (beatCount === 0) ? 0 : 1;
      const src = audioContext.createBufferSource();
      src.buffer = this.audioBufferManager.getAudioBuffer('default', bufferIndex);
      src.connect(audioContext.destination);
      src.start(audioContext.currentTime);
    };

    const N = 8;
    const tempoScale = (soundworks.client.index % 2) ? 1 : (N * 12 + 1) / (N * 12);
    this.metricScheduler.addMetronome(metrofunction, 12, 8, tempoScale, 0);

    this.metricScheduler.addEventListener(event, (data) => {
      console.log('coucou:', event, data);
    });

    // initialize rendering
    this.renderer = new PlayerRenderer(100, 100);
    this.view.addRenderer(this.renderer);

    // this function is called before each update (`Renderer.render`) of the canvas
    this.view.setPreRender(function(ctx, dt, canvasWidth, canvasHeight) {
      ctx.save();
      ctx.globalAlpha = 0.05;
      ctx.fillStyle = '#000000';
      ctx.rect(0, 0, canvasWidth, canvasHeight);
      ctx.fill();
      ctx.restore();
    });
  }
}
