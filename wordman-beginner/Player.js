class Player {
  constructor() {
    this._health = 20;
    this._direction = "backward";
  }

  playTurn(warrior) {
    // set a default chosen action
    let chosenAction = undefined;

    if (warrior.feel(this._direction).isWall()) {
      this._direction = "forwards";
    }

    // Action Preference order
    chosenAction =
      chosenAction ||
      this.actionHealIfSafe(warrior) ||
      this.interaction(warrior) ||
      (() => warrior.walk(this._direction));

    // Do one action
    chosenAction();

    this._health = warrior.health();
  }

  // Actioning feels
  interaction(warrior) {
    // If there's nothing interact with then move on
    if (warrior.feel().isEmpty()) {
      return;
    }

    // if there is and it's a captive then rescue
    if (warrior.feel().isCaptive()) {
      return warrior.rescue;
    } else {
      return warrior.attack;
    }
  }

  // Keeping us alive
  actionHealIfSafe(warrior) {
    // If we're not hurt pass by
    if (warrior.health() >= 20) {
      return;
    }

    // If there's nothing infront of us that could attack
    // &
    // If we've not taken damage from last time
    if (warrior.feel().isEmpty() && this._health <= warrior.health()) {
      // rest up
      return warrior.rest;
    }
  }
}
