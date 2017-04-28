import * as soundworks from 'soundworks/server';

class ControllerExperience extends soundworks.ControllerExperience {
  constructor() {
    super('controller');

    this.auth = this.require('auth');
    this.sharedParams = this.require('shared-params');
  }
}

export default ControllerExperience;
