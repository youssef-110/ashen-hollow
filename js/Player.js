/**
 * Ashen Hollow — Player: The Hunter (movement, trick weapon, stamina, vials)
 * Dark fantasy action game inspired by Bloodborne and Elden Ring
 * Author: Youssef | github.com/youssef-880
 */

const PLAYER_ATTACKS = {
  blade: {
    light: [
      { dmg: 12, stamina: 15, windup: 90,  recover: 190, range: 52, h: 40, knock: 120 },
      { dmg: 12, stamina: 15, windup: 80,  recover: 180, range: 52, h: 40, knock: 120 },
      { dmg: 18, stamina: 15, windup: 110, recover: 240, range: 62, h: 32, knock: 220 }  // thrust
    ],
    heavy: { dmg: 30, stamina: 35, windup: 340, recover: 320, range: 58, h: 54, knock: 260, stagger: true }
  },
  scythe: {
    light: [
      { dmg: 16, stamina: 20, windup: 180, recover: 260, range: 96, h: 52, knock: 170, wide: true },
      { dmg: 16, stamina: 20, windup: 170, recover: 260, range: 96, h: 52, knock: 170, wide: true }
    ],
    heavy: { dmg: 34, stamina: 40, windup: 420, recover: 380, range: 82, h: 62, knock: 300, stagger: true, wide: true, shockwave: true }
  }
};

class Player extends Phaser.Physics.Arcade.Sprite {

  constructor(scene, x, y) {
    super(scene, x, y, 'player');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(100);
    this.setSize(22, 44).setOffset(7, 4);
    this.setCollideWorldBounds(false);

    // stats
    this.maxHp = 100;
    this.hp = scene.registry.get('playerHp');
    this.maxStamina = 100;
    this.stamina = 100;
    this.vials = scene.registry.get('vials');

    // state
    this.form = scene.registry.get('weaponForm') || 'blade';
    this.facing = 1;
    this.dead = false;
    this.attacking = false;
    this.rolling = false;
    this.healing = false;
    this.iframesUntil = 0;
    this.rollCdUntil = 0;
    this.transformCdUntil = 0;
    this.lastActionAt = 0;
    this.comboIndex = 0;
    this.comboWindowUntil = 0;
    this.transformQueued = false;
    this.controlsLocked = false; // cinematics

    // input
    this.keys = scene.input.keyboard.addKeys('A,D,W,LEFT,RIGHT,UP,SPACE,SHIFT,Q,E,Z,X');
    scene.input.mouse.disableContextMenu();
    scene.input.on('pointerdown', pointer => {
      if (pointer.rightButtonDown()) this.tryHeavy();
      else this.tryLight();
    });
  }

  /* ------------------------------------------------------------------ */

  update(time, delta) {
    if (this.dead || this.controlsLocked) return;
    const k = this.keys;
    const dt = delta / 1000;
    const onFloor = this.body.blocked.down || this.body.touching.down;

    // stamina regen, paused 0.5s after any action
    if (time > this.lastActionAt + 500 && !this.attacking && !this.rolling) {
      this.stamina = Math.min(this.maxStamina, this.stamina + 28 * dt);
    }

    // keyboard combat inputs
    if (Phaser.Input.Keyboard.JustDown(k.Z)) this.tryLight();
    if (Phaser.Input.Keyboard.JustDown(k.X)) this.tryHeavy();
    if (Phaser.Input.Keyboard.JustDown(k.Q)) this.tryTransform();
    if (Phaser.Input.Keyboard.JustDown(k.E)) this.scene.onUseKey ? this.scene.onUseKey() : this.tryHeal();
    if (Phaser.Input.Keyboard.JustDown(k.SHIFT)) this.tryRoll(time);

    if (this.rolling) return; // roll velocity persists

    // movement
    const left = k.A.isDown || k.LEFT.isDown;
    const right = k.D.isDown || k.RIGHT.isDown;

    if (!this.attacking && !this.healing) {
      if (left) { this.setVelocityX(-220); this.facing = -1; }
      else if (right) { this.setVelocityX(220); this.facing = 1; }
      else this.setVelocityX(this.body.velocity.x * 0.8); // weighty stop

      const jumpPressed = Phaser.Input.Keyboard.JustDown(k.SPACE) ||
                          Phaser.Input.Keyboard.JustDown(k.W) ||
                          Phaser.Input.Keyboard.JustDown(k.UP);
      if (jumpPressed && onFloor) {
        this.setVelocityY(-430);
        this.lastActionAt = time;
      }
    } else {
      this.setVelocityX(this.body.velocity.x * 0.85); // slide during swings
    }

    this.setFlipX(this.facing < 0);
  }

  spend(amount) {
    if (this.stamina < amount) return false;
    this.stamina -= amount;
    this.lastActionAt = this.scene.time.now;
    return true;
  }

  /* ------------------------------------------------------------------ */
  /* Roll / dodge — i-frames on the first 6 frames (~100ms)              */
  /* ------------------------------------------------------------------ */

  tryRoll(time) {
    if (this.rolling || this.attacking || this.healing || this.dead) return;
    if (time < this.rollCdUntil) return;
    if (!this.spend(30)) return;

    const k = this.keys;
    let dir = 0;
    if (k.A.isDown || k.LEFT.isDown) dir = -1;
    else if (k.D.isDown || k.RIGHT.isDown) dir = 1;
    // dir 0 = neutral roll in place

    this.rolling = true;
    this.iframesUntil = time + 100;
    this.rollCdUntil = time + 650;
    this.setTexture('player-roll');
    this.setVelocityX(dir * 380);
    SFX.roll();

    // motion blur trail
    const trail = this.scene.time.addEvent({
      delay: 40, repeat: 6,
      callback: () => {
        if (!this.active) return;
        const ghost = this.scene.add.image(this.x, this.y, 'player-roll')
          .setAlpha(0.3).setDepth(99).setFlipX(this.flipX);
        this.scene.tweens.add({ targets: ghost, alpha: 0, duration: 200, onComplete: () => ghost.destroy() });
      }
    });

    this.scene.time.delayedCall(340, () => {
      if (!this.active) return;
      this.rolling = false;
      trail.remove();
      if (!this.dead) this.setTexture('player');
    });

    // spin the tuck
    this.scene.tweens.add({
      targets: this, angle: dir >= 0 ? 360 : -360, duration: 340,
      onComplete: () => { if (this.active) this.setAngle(0); }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Attacks                                                             */
  /* ------------------------------------------------------------------ */

  tryLight() {
    if (this.busyForAttack()) return;
    const now = this.scene.time.now;
    const chain = PLAYER_ATTACKS[this.form].light;
    if (now > this.comboWindowUntil) this.comboIndex = 0;
    const data = chain[this.comboIndex % chain.length];
    if (!this.spend(data.stamina)) return;
    this.comboIndex = (this.comboIndex + 1) % chain.length;
    this.comboWindowUntil = now + 900;
    this.executeAttack(data, false);
  }

  tryHeavy() {
    if (this.busyForAttack()) return;
    const data = PLAYER_ATTACKS[this.form].heavy;
    if (!this.spend(data.stamina)) return;
    this.comboIndex = 0;
    this.executeAttack(data, true);
  }

  busyForAttack() {
    return this.dead || this.attacking || this.rolling || this.healing ||
           this.controlsLocked || this.scene.isPaused;
  }

  executeAttack(data, heavy) {
    this.attacking = true;
    const scene = this.scene;
    const facing = this.facing;

    // windup lean
    scene.tweens.add({ targets: this, scaleX: 1.06, scaleY: 0.96, duration: data.windup, yoyo: true });

    scene.time.delayedCall(data.windup, () => {
      if (!this.active || this.dead) { this.attacking = false; return; }
      heavy ? SFX.attackHeavy() : SFX.attackLight();
      scene.combat.slashArc(this.x + facing * 18, this.y, facing, !!data.wide, heavy);

      const rect = new Phaser.Geom.Rectangle(
        facing > 0 ? this.x : this.x - data.range,
        this.y - data.h / 2,
        data.range, data.h
      );
      scene.combat.playerStrike(rect, data.dmg, {
        knockback: data.knock, stagger: !!data.stagger, fromX: this.x
      });

      if (data.shockwave && (this.body.blocked.down || this.body.touching.down)) {
        scene.combat.spawnShockwave(this.x + facing * 30, this.y + 20, facing, 320, 14, false);
        scene.cameras.main.shake(120, 0.004);
      }

      scene.time.delayedCall(data.recover, () => {
        if (!this.active) return;
        this.attacking = false;
        if (this.transformQueued) { this.transformQueued = false; this.doTransform(true); }
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Trick weapon transform                                              */
  /* ------------------------------------------------------------------ */

  tryTransform() {
    const now = this.scene.time.now;
    if (this.dead || this.rolling || this.healing || now < this.transformCdUntil) return;
    if (this.attacking) { this.transformQueued = true; return; } // transform attack mid-combo
    this.doTransform(false);
  }

  doTransform(asAttack) {
    const scene = this.scene;
    this.transformCdUntil = scene.time.now + 800;
    this.form = this.form === 'blade' ? 'scythe' : 'blade';
    scene.registry.set('weaponForm', this.form);
    SFX.transform();
    scene.combat.goldBurst(this.x, this.y);

    // dramatic 360° spin
    this.attacking = true;
    scene.tweens.add({
      targets: this, angle: this.facing * 360, duration: 320, ease: 'Cubic.easeOut',
      onComplete: () => { if (this.active) this.setAngle(0); }
    });

    if (asAttack) {
      // blade→scythe: spinning slash | scythe→blade: lunge
      if (this.form === 'blade') this.setVelocityX(this.facing * 340);
      scene.time.delayedCall(120, () => {
        if (!this.active || this.dead) return;
        scene.combat.slashArc(this.x, this.y, this.facing, true, true);
        const rect = new Phaser.Geom.Rectangle(this.x - 80, this.y - 34, 160, 68);
        scene.combat.playerStrike(rect, 22, { knockback: 240, stagger: true, fromX: this.x });
      });
    }
    scene.time.delayedCall(340, () => { if (this.active) this.attacking = false; });
  }

  /* ------------------------------------------------------------------ */
  /* Blood vials                                                         */
  /* ------------------------------------------------------------------ */

  tryHeal() {
    if (this.dead || this.healing || this.attacking || this.rolling) return;
    if (this.vials <= 0 || this.hp >= this.maxHp) return;
    this.healing = true;
    this.vials--;
    this.scene.registry.set('vials', this.vials);
    SFX.heal();
    this.setTint(0xffbbbb);
    this.scene.tweens.add({ targets: this, scaleY: 0.9, duration: 400, yoyo: true });

    this.scene.time.delayedCall(800, () => {
      if (!this.active || this.dead) return;
      this.hp = Math.min(this.maxHp, this.hp + 40);
      this.clearTint();
      this.healing = false;
      this.scene.combat.burst(this.x, this.y - 10, 'p-blood', 8, 80, 400);
      this.scene.combat.number(this.x, this.y - 30, '+40', '#cc4444');
    });
  }

  /* ------------------------------------------------------------------ */
  /* Damage & death                                                      */
  /* ------------------------------------------------------------------ */

  takeDamage(amount, sourceX) {
    const now = this.scene.time.now;
    if (this.dead || now < this.iframesUntil) return false;

    this.hp -= amount;
    this.iframesUntil = now + 500; // brief mercy window after any hit
    this.healing = false;
    this.clearTint();

    const stats = this.scene.registry.get('stats');
    stats.hits++;
    this.scene.registry.set('stats', stats);

    // white flash + red damage number + knockback away from source
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(90, () => { if (this.active) this.clearTint(); });
    this.scene.combat.number(this.x, this.y - 30, '-' + amount, '#ff2222');
    this.scene.combat.bloodBurst(this.x, this.y);
    const dir = sourceX !== undefined ? (this.x < sourceX ? -1 : 1) : -this.facing;
    this.setVelocity(dir * 160, -120);

    SFX.playerHit();
    if (this.scene.ui) this.scene.ui.damageFlash();
    this.scene.cameras.main.shake(90, 0.004);

    if (this.hp <= 0) {
      this.hp = 0;
      this.die();
    }
    return true;
  }

  die() {
    if (this.dead) return;
    this.dead = true;
    this.attacking = false;
    this.rolling = false;
    this.setVelocityX(0);

    const stats = this.scene.registry.get('stats');
    stats.deaths++;
    this.scene.registry.set('stats', stats);

    SFX.stopHeartbeat();
    SFX.death();

    // fall to knees, collapse
    this.scene.tweens.add({ targets: this, scaleY: 0.7, duration: 500, ease: 'Cubic.easeOut' });
    this.scene.tweens.add({
      targets: this, angle: this.facing * 90, y: this.y + 14, alpha: 0.85,
      delay: 500, duration: 700, ease: 'Cubic.easeIn'
    });

    if (this.scene.ui) this.scene.ui.showDeath();
    if (this.scene.onPlayerDeath) this.scene.onPlayerDeath();
  }
}
