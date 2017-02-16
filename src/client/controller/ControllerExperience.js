import { BasicSharedController } from 'soundworks/client';

class ControllerExperience extends BasicSharedController {
  constructor(options) {
    super(options);

    this.auth = this.require('auth');
    this.metricScheduler = this.require('metric-scheduler');
  }
}

export default ControllerExperience;
