import { Experience } from 'soundworks/server';

// server-side 'player' experience.
export default class PlayerExperience extends Experience {
  constructor() {
    super('player');

    this.checkin = this.require('checkin');
    this.sharedConfig = this.require('shared-config');
    this.metricScheduler = this.require('metric-scheduler');
    this.sharedParams = this.require('shared-params');
  }

  start() {}

  enter(client) {
    super.enter(client);
    this.sharedParams.update('numPlayers', this.clients.length);
  }

  exit(client) {
    super.exit(client);
    this.sharedParams.update('numPlayers', this.clients.length);
  }
}
