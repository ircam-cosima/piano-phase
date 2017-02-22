class PatternMetro {
  constructor(patternPlayers, patternOffset, nbrBeats) {
    this.patternPlayers = patternPlayers;
    this.patternOffset = patternOffset;
    this.nbrBeats = nbrBeats;
    this.counter = 0;

    this.metroFunction = this.metroFunction.bind(this);
  }

  metroFunction(measureCount, beatCount) {
    this.counter = measureCount * 12 + beatCount + 1;

    if (this.counter > this.nbrBeats)
      return false; // remove from scheduler
    else
      this.patternPlayers.forEach((pp) => pp.advanceMetric(beatCount, this.patternOffset));
  }
}

export default PatternMetro;
