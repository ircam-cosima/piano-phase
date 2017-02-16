import { BasicSharedController } from 'soundworks/server';

class ControllerExperience extends BasicSharedController {
  constructor(sharedParams) {
    super('controller');

    this.auth = this.require('auth');
    this.metricScheduler = this.require('metric-scheduler', { tempo: 0 });
    this.sharedParams = sharedParams;
  }

  start() {
    this.sharedParams.addParamListener('control', (value) => {
      const syncTime = this.metricScheduler.currentSyncTime;

      if (value === 'start')
        this.metricScheduler.sync(syncTime + 0.5, 0, 60, 1/4, 'start');
      else
        this.metricScheduler.sync(syncTime, 0, 0, 1/4, 'stop');
    });
  }
}

export default ControllerExperience;
