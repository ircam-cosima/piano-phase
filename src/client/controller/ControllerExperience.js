import * as soundworks from 'soundworks/client';

class ControllerExperience extends soundworks.ControllerExperience {
  constructor(options) {
    super(options);

    this.auth = this.require('auth');

    this.setGuiOptions('numPlayers', { readOnly: true });
    this.setGuiOptions('control', { type: 'buttons' });
  }
}

export default ControllerExperience;
