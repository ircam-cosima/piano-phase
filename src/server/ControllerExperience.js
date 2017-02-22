import { BasicSharedController } from 'soundworks/server';

class ControllerExperience extends BasicSharedController {
  constructor() {
    super('controller');

    this.auth = this.require('auth');
    this.sharedParams = this.require('shared-params');
  }
}

export default ControllerExperience;
