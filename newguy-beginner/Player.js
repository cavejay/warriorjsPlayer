class Player {
  constructor() {
    // last health
    this._health = 20;

    // last chosen direction
    this._direction = "forward";
    this._facing = "East";

    // last action
    this._action;

    this.state = ""; // what we are currently attempting to do
    this.action; // current action in string form
    this.chosenAction; // current action in clojure form
    this.dirs = ["forward", "right", "backward", "left"];
    this.compass = ["North", "East", "South", "West"];
  }

  unwrapSpace(space) {
    if (space.isUnit()) {
      return space.getUnit();
    } else if (space.isEmpty()) {
      return "";
    } else {
      return {
        other: true,
        space: space
      };
    }
  }

  symboliseUnit(unit) {
    if (!unit.other) {
      if (unit === "") {
        return "_";
      } else if (unit.isBound()) {
        return "c";
      } else if (unit.isEnemy()) {
        return "e";
      }
    }

    if (unit.space.isWall()) {
      return "#";
    }
  }

  printLooks(w) {
    w.think("Internal Map:");
    w.think("     N");
    w.think(`     ${this.looks[(4 - this.compass.indexOf(this._facing)) % 4][2]}`);
    w.think(`     ${this.looks[(4 - this.compass.indexOf(this._facing)) % 4][1]}`);
    w.think(`     ${this.looks[(4 - this.compass.indexOf(this._facing)) % 4][0]}`);
    w.think(
      `W ${this.looks[(7 - this.compass.indexOf(this._facing)) % 4][2]}${
        this.looks[(7 - this.compass.indexOf(this._facing)) % 4][1]
      }${this.looks[(7 - this.compass.indexOf(this._facing)) % 4][0]}@${
        this.looks[(5 - this.compass.indexOf(this._facing)) % 4][0]
      }${this.looks[(5 - this.compass.indexOf(this._facing)) % 4][1]}${
        this.looks[(5 - this.compass.indexOf(this._facing)) % 4][2]
      } E`
    );
    w.think(`     ${this.looks[(6 - this.compass.indexOf(this._facing)) % 4][0]}`);
    w.think(`     ${this.looks[(6 - this.compass.indexOf(this._facing)) % 4][1]}`);
    w.think(`     ${this.looks[(6 - this.compass.indexOf(this._facing)) % 4][2]}`);
    w.think("     S");
  }

  playTurn(w) {
    // store the warrior object for this turn
    this.warrior = w;
    this.chosenAction = undefined;

    // data gathering
    this._looks = this.dirs.map(dir => {
      return w.look(dir);
    });

    // Data presentation
    this.looks = this._looks.map(a => a.map(b => this.symboliseUnit(this.unwrapSpace(b))));
    this.printLooks(w);

    // if our current direction is a wall, plz switch
    if (w.feel(this._direction).isWall()) {
      this.chosenAction = this.setAction("pivot");
      // this._direction = "forward";
    }

    // Action Preference order
    this.chosenAction =
      this.chosenAction || // keep the default
      this.actionHealIfSafe() || // check for heals
      this.actionUnitInteraction() || // check for enemy/captive
      this.actionDistantInteraction() || // do something ranged if no-ones nearby
      this.setAction("walk", this._direction); // walk in our current dir

    // Do the outcome of the above
    this.chosenAction();

    // store values for next time
    this._health = w.health();
    this._action = this.action;
  }

  setAction(action, direction) {
    this.action = action;

    // if the action is to 'rest' we don't need a direction
    if (["rest"].includes(action)) {
      return this.warrior[action];

      // if the action is to pivot plz work.
    } else if (action === "pivot") {
      // This probably broken
      this.warrior.think("Pivoting is hard. I might lose my sense of direction");
      this._facing = this.compass[(4 + this.dirs.indexOf(this._direction) - this.compass.indexOf(this._facing)) % 4];

      // if we haven't got a direction then we should return nothing.
    } else if (direction == "undefined") {
      return;
    }

    return () => this.warrior[action](direction);
  }

  wasHurt() {
    return this._health > this.warrior.health();
  }

  // Actioning feels
  actionUnitInteraction() {
    // If there's nothing to interact with then move on
    if (this._looks[this.dirs.indexOf(this._direction)][0].isEmpty()) {
      this.warrior.think("There's nothing in front of me.");
      return;
    }
    // if there is and it's a captive then rescue
    if (this._looks[this.dirs.indexOf(this._direction)][0].getUnit().isBound()) {
      return this.setAction("rescue", this._direction);
    } else {
      return this.setAction("attack", this._direction);
    }
  }

  actionDistantInteraction(priority = "far") {
    this.warrior.think("Checking to see if there are enemies around");
    this.warrior.think("I'm going to try to prioritise ranged enemies that are: " + priority);

    // Some arrays that we need
    let closeCandidates = [];
    let farCandidates = [];
    let protectedDir = [];
    let dict = {};

    // check closest non-adjacent space
    let onespace = this.looks.map(a => a[1]);
    onespace.forEach((s, i) => {
      if (s == "e") {
        // If there's an enemy then lets add it to candidate list
        closeCandidates.push(this.dirs[i]);
      } else if (s == "c") {
        protectedDir.push(this.dirs[i]);
      }
    });

    // check furthest non-adjacent space
    let twospace = this.looks.map(a => a[2]);
    twospace.forEach((s, i) => {
      if (s == "e") {
        // If there's an enemy then lets add it to candidate list
        farCandidates.push(this.dirs[i]);
      }
    });

    // if there's still something inside candidates
    if (closeCandidates.length > 0) {
      // pick statically. Lets choose the first one in the array
      dict.close = this.setAction("shoot", closeCandidates[0]);
    }

    // filter the far candidates based on what we've seen closer.
    farCandidates = farCandidates.filter(c => !protectedDir.includes(c));
    if (farCandidates.length > 0) {
      // pick statically. Lets choose the first one in the array
      dict.far = this.setAction("shoot", farCandidates[0]);
    }

    // If far's the priority check if it's valid and return it's result if it is
    if (priority === "far" && dict.far != undefined) {
      return dict.far;

      // catch when far is undefined (which would prioritise close)
    } else if (priority === "far") {
      return dict.close;

      // If close is the priority and valid then return it
    } else if (priority === "close" && dict.close != undefined) {
      return dict.close;

      // if not though, return far
    } else if (priority === "close") {
      return dict.far;
    }

    this.warrior.think("Can't see anyone");
    return;
  }

  // Keeping us alive
  actionHealIfSafe() {
    // If we're not hurt pass by
    if (this.warrior.health() >= 20) {
      this.warrior.think("I don't need healing.");
      return;
    }
    // Need to deal with enemies if they're low health but close

    // if we healed last time but still lost health we should start retreating
    if (this._action == "rest" && this.wasHurt()) {
      this.warrior.think("I should probably back up and heal");

      // start retreating
      this.state = "retreat";

      // move away from the direction we were going
      if (this._direction == "backward") {
        return this.setAction("walk", "forward");
      } else {
        // if (!this.warrior.feel().isEmpty()) {
        //   return undefined;
        // } else {
        return this.setAction("walk", "backward");
        // }
      }

      // if we're no longer losing health we don't need to retreat
    } else if (this.state == "retreat" && !this.wasHurt()) {
      this.warrior.think("This looks like a safe place to stop");

      this.state = "";
      return this.setAction("rest");

      // if it's not safe and we're still retreating
    } else if (this.state == "retreat") {
      this.warrior.think("Still retreating");
      return this.setAction("walk", "backward");
    }

    // If there's nothing infront of us that could attack
    // &
    // If we've not taken damage from last time
    if (this.warrior.feel(this._direction).isEmpty() && !this.wasHurt()) {
      this.warrior.think("I'm hurt and there's not much around. Lets rest up");
      // rest up
      return this.setAction("rest");
    }

    this.warrior.think("I'm hurt but am gunna boss it out. plz halp");
  }
}
