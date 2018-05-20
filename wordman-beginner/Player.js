class Player {
  constructor() {
    // last health
    this._health = 20;

    // last chosen direction
    this._direction = "forward";

    // last action
    this._action;

    this.state = ""; // what we are currently attempting to do
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
      this.chosenAction = this.setAction("pivot");
      // this._direction = "forward";
    }

    // Action Preference order
    this.chosenAction =
      this.chosenAction || // keep the default
      this.actionHealIfSafe() || // check for heals
      this.actionUnitInteraction() || // check for enemy/captive
      this.setAction("walk", this._direction); // walk in our current dir

    // Do the outcome of the above
    this.chosenAction();

    // store values for next time
    this._health = warrior.health();
    this._action = this.action;
  }

  setAction(action, direction) {
    this.action = action;
    if (["rest", "pivot"].includes(action)) {
      return this.warrior[action];
    }
    return () => this.warrior[action](direction);
  }

  wasHurt() {
    return this._health > this.warrior.health();
  }

  // Actioning feels
  actionUnitInteraction() {
    // If there's nothing to interact with then move on
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

    // Need to deal with enemies if they're low health but close

    // if we healed last time but still lost health we should start retreating
    if (this._action == "rest" && this.wasHurt()) {
      // start retreating
      this.state = "retreat";
      // move away from the direction we were going
      // this.warrior.think("I should probably back up and heal");
      // if (this._direction == "backward") {
      // return this.setAction("walk", "forward");
      // } else {
      return this.setAction("walk", "backward");
      // }
    } else if (this.state == "retreat" && !this.wasHurt()) {
      // if we're no longer losing health we don't need to retreat
      this.state = "";
      return this.setAction("rest");

      // if it's not safe and we're still retreating
    } else if (this.state == "retreat") {
      return this.setAction("walk", "backward");
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
