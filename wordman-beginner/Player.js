class Player {
  constructor() {
    // last health
    this._health = 20;

    // last chosen direction
    this._direction = "backward";

    // last action
    this._action;

    this.action; // current action in string form
    this.chosenAction; // current action in clojure form
  }

  playTurn(warrior) {
    // store the warrior object for this turn
    this.warrior = warrior;

    // set a default chosen action
    this.chosenAction = undefined;

    // if our current direction is a wall, plz switch
    if (warrior.feel(this._direction).isWall()) {
      this._direction = "forward";
    }

    // Action Preference order
    this.chosenAction =
      this.chosenAction || // keep the default
      this.actionHealIfSafe() || // check for heals
      this.interaction() || // check for enemy/captive
      this.setAction("walk", this._direction); // walk in our current dir

    // Do the outcome of the above
    this.chosenAction();

    // store values for next time
    this._health = warrior.health();
    this._action = this.action;
  }

  setAction(action, direction) {
    this.action = action;
    if (action == "rest") {
      return this.warrior.rest;
    }
    return () => this.warrior[action](direction);
  }

  wasHurt() {
    return this._health > this.warrior.health();
  }

  // Actioning feels
  interaction() {
    // If there's nothing interact with then move on
    if (this.warrior.feel(this._direction).isEmpty()) {
      return;
    }

    // if there is and it's a captive then rescue
    if (this.warrior.feel(this._direction).isCaptive()) {
      return this.setAction("rescue", this._direction);
    } else {
      return this.setAction("attack", this._direction);
    }
  }

  // Keeping us alive
  actionHealIfSafe() {
    // If we're not hurt pass by
    if (this.warrior.health() >= 20) {
      return;
    }

    // if we healed last time but still lost health
    // this check could be extended to deal with low health enemies
    if (this._action == "rest" && this.wasHurt()) {
      // move away from the direction we were going
      // this.warrior.think("I should probably back up and heal");
      if (this._direction == "backward") {
        return this.setAction("walk", "forward");
      } else {
        return this.setAction("walk", "backward");
      }
    }

    // If there's nothing infront of us that could attack
    // &
    // If we've not taken damage from last time
    if (this.warrior.feel(this._direction).isEmpty() && !this.wasHurt()) {
      // rest up
      return this.setAction("rest");
    }
  }
}
