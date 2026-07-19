/**
 * Ashen Hollow — Enemy: Hollow Remnants (base class + Shambler, Wraith, Watcher)
 * AI state machine: Idle → Alert → Chase → Attack → Stagger → Death
 * Dark fantasy action game inspired by Bloodborne and Elden Ring
 * Author: Youssef | github.com/youssef-880
 */

class Enemy extends Phaser.Physics.Arcade.Sprite {

  constructor(scene, x, y, texBase, cfg) {
    super(scene, x, y, texBase + '-calm');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(90);

    this.texBase = texBase;
    this.enemyId = cfg.id;
    this.hp = cfg.hp;
    this.dmg = cfg.dmg;
    this.alertRadius = cfg.alertRadius || 280;
    this.echoes = cfg.echoes || 60;

    this.aiState = 'idle';
    this.dead = false;
    this.attackCdUntil = 0;
    this.staggerUntil = 0;
    this.facing = -1;
  }

  get player() { return this.scene.player; }

  distToPlayer() {
    if (!this.player || this.player.dead) return Infinity;
    return Phaser.Math.Distance.Between(this.x, this.y, this.player.x, this.player.y);
  }

  facePlayer() {
    if (!this.player) return;
    this.facing = this.player.x > this.x ? 1 : -1;
    this.setFlipX(this.facing > 0);
  }

  becomeAlert() {
    if (this.aiState !== 'idle') return;
    this.aiState = 'alert';
    this.setTexture(this.texBase + '-alert'); // eyes flare red
    this.scene.time.delayedCall(400, () => {
      if (this.active && !this.dead && this.aiState === 'alert') this.aiState = 'chase';
    });
  }

  update(time, delta) {
    if (this.dead || !this.active) return;
    if (this.aiState === 'stagger') {
      this.setVelocityX(0);
      if (time > this.staggerUntil) this.aiState = 'chase';
      return;
    }
    if (this.aiState === 'idle' && this.distToPlayer() < this.alertRadius) this.becomeAlert();
    this.think(time, delta);
  }

  think(time, delta) { /* overridden */ }

  /** Melee strike helper: hits player if within a rect in front. */
  meleeHit(range, height, damage) {
    if (!this.player || this.player.dead) return;
    const rect = new Phaser.Geom.Rectangle(
      this.facing > 0 ? this.x : this.x - range,
      this.y - height / 2, range, height
    );
    if (Phaser.Geom.Rectangle.Overlaps(rect, this.player.getBounds())) {
      this.scene.combat.hitPlayer(damage, this.x);
    }
  }

  takeDamage(amount, fromX, knockback = 140, forceStagger = false) {
    if (this.dead) return;
    this.hp -= amount;
    if (this.aiState === 'idle') this.becomeAlert();

    // white flash + blood + number
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(70, () => { if (this.active) this.clearTint(); });
    this.scene.combat.bloodBurst(this.x, this.y);
    this.scene.combat.number(this.x, this.y - 26, amount, '#ff2222');

    // knockback away from attacker
    if (this.body && this.body.enable) {
      const dir = this.x < fromX ? -1 : 1;
      this.setVelocityX(dir * knockback * (this.body.allowGravity ? 1 : 0.5));
    }

    if (this.hp <= 0) { this.die(); return; }

    if (forceStagger || this.staggersOnHit) {
      this.aiState = 'stagger';
      this.staggerUntil = this.scene.time.now + 420;
    }
  }

  die() {
    if (this.dead) return;
    this.dead = true;
    this.aiState = 'death';
    this.body.enable = false;
    SFX.enemyDeath();

    // blood echoes (decorative gold number)
    this.scene.combat.number(this.x, this.y - 40, '+' + this.echoes, '#c9a84c', 16);

    // mark permanently dead for this run
    const deadList = this.scene.registry.get('deadEnemies');
    if (this.enemyId !== undefined && !deadList.includes(this.enemyId)) {
      deadList.push(this.enemyId);
      this.scene.registry.set('deadEnemies', deadList);
    }

    this.deathEffect();
  }

  /** Default: collapse and dissolve into ash. Overridden per type. */
  deathEffect() {
    this.scene.combat.ashBurst(this.x, this.y);
    this.scene.tweens.add({
      targets: this, angle: this.facing * -80, alpha: 0, y: this.y + 10,
      duration: 700, ease: 'Cubic.easeIn',
      onComplete: () => this.destroy()
    });
  }
}

/* ==================================================================== */
/* Type 1 — Shambler: slow melee walker, staggers when hit              */
/* ==================================================================== */

class Shambler extends Enemy {
  constructor(scene, x, y, id) {
    super(scene, x, y, 'shambler', { id, hp: 40, dmg: 12, alertRadius: 260, echoes: 60 });
    this.setSize(26, 40).setOffset(6, 4);
    this.staggersOnHit = true; // brief pause before recovering
    this.attackWindup = false;
  }

  think(time) {
    if (this.aiState !== 'chase' || this.attackWindup) { if (!this.attackWindup) this.setVelocityX(0); return; }
    this.facePlayer();
    const dx = Math.abs(this.player.x - this.x);

    if (dx < 46 && time > this.attackCdUntil) {
      // attack: lean back, then swipe
      this.attackWindup = true;
      this.setVelocityX(0);
      this.setTint(0x886666);
      this.scene.time.delayedCall(450, () => {
        if (!this.active || this.dead) return;
        this.clearTint();
        this.attackWindup = false;
        if (this.aiState === 'chase') this.meleeHit(48, 44, this.dmg);
        this.attackCdUntil = this.scene.time.now + 1400;
      });
    } else if (dx >= 40) {
      this.setVelocityX(this.facing * 42);
    } else {
      this.setVelocityX(0);
    }
  }
}

/* ==================================================================== */
/* Type 2 — Wraith: fast, erratic; dashes in, strikes, backs away       */
/* ==================================================================== */

class Wraith extends Enemy {
  constructor(scene, x, y, id) {
    super(scene, x, y, 'wraith', { id, hp: 25, dmg: 8, alertRadius: 320, echoes: 75 });
    this.setSize(24, 38).setOffset(4, 4);
    this.body.setAllowGravity(false);
    this.homeY = y;
    this.dashing = false;
    this.dashHitDone = false;
  }

  think(time, delta) {
    // ghostly bob
    if (!this.dashing) this.y = this.homeY + Math.sin(time / 300 + this.x) * 8;

    if (this.aiState !== 'chase') { this.setVelocity(0, 0); return; }
    this.facePlayer();

    if (this.dashing) {
      // dark trail while dashing
      if (Math.random() < 0.6) {
        const t = this.scene.add.image(this.x, this.y, 'p-dark').setAlpha(0.7).setDepth(85).setScale(2);
        this.scene.tweens.add({ targets: t, alpha: 0, scale: 0.5, duration: 300, onComplete: () => t.destroy() });
      }
      // strike once if passing through the player
      if (!this.dashHitDone && this.player && !this.player.dead &&
          Phaser.Geom.Rectangle.Overlaps(this.getBounds(), this.player.getBounds())) {
        this.dashHitDone = true;
        this.scene.combat.hitPlayer(this.dmg, this.x);
      }
      return;
    }

    const dist = this.distToPlayer();
    if (dist < 420 && time > this.attackCdUntil) {
      // dash toward the player's position
      this.dashing = true;
      this.dashHitDone = false;
      const angle = Phaser.Math.Angle.Between(this.x, this.y, this.player.x, this.player.y - 10);
      this.scene.physics.velocityFromRotation(angle, 380, this.body.velocity);
      this.scene.time.delayedCall(380, () => {
        if (!this.active || this.dead) return;
        // back away
        this.setVelocity(-Math.cos(angle) * 240, -Math.sin(angle) * 240 - 40);
        this.scene.time.delayedCall(280, () => {
          if (!this.active || this.dead) return;
          this.dashing = false;
          this.homeY = Phaser.Math.Clamp(this.y, 120, 600);
          this.setVelocity(0, 0);
        });
      });
      this.attackCdUntil = time + 1900;
    } else if (!this.dashing) {
      // drift erratically around the player
      const drift = Math.sin(time / 450 + this.enemyId * 3) * 60;
      this.setVelocityX(this.facing * 40 + drift);
    }
  }

  deathEffect() {
    // screech: visual ripple, then dissipate
    this.scene.combat.ripple(this.x, this.y, 0xaaaacc, 110);
    this.scene.combat.burst(this.x, this.y, 'p-dark', 18, 120, 600);
    this.scene.tweens.add({
      targets: this, alpha: 0, scale: 1.6, duration: 450,
      onComplete: () => this.destroy()
    });
  }
}

/* ==================================================================== */
/* Type 3 — Watcher: ranged caster, lobs dark orbs in an arc            */
/* ==================================================================== */

class Watcher extends Enemy {
  constructor(scene, x, y, id) {
    super(scene, x, y, 'watcher', { id, hp: 35, dmg: 10, alertRadius: 480, echoes: 80 });
    this.setSize(20, 52).setOffset(3, 4);
  }

  think(time) {
    this.setVelocityX(0);
    if (this.aiState !== 'chase') return;
    this.facePlayer();

    const dist = this.distToPlayer();
    if (dist < 560 && time > this.attackCdUntil) {
      this.attackCdUntil = time + 2300;
      // hand flares before the cast
      this.setTint(0xff8888);
      this.scene.time.delayedCall(400, () => {
        if (!this.active || this.dead) return;
        this.clearTint();
        this.castOrb();
      });
    }
  }

  castOrb() {
    if (!this.player || this.player.dead || !this.scene.orbs) return;
    const orb = this.scene.orbs.create(this.x + this.facing * 14, this.y - 16, 'orb');
    orb.setDepth(88);
    orb.dmg = this.dmg;

    // solve arc: reach the player's position in ~1s under gravity
    const t = 1.0;
    const g = this.scene.physics.world.gravity.y;
    const dx = this.player.x - orb.x;
    const dy = this.player.y - orb.y;
    orb.setVelocity(dx / t, dy / t - 0.5 * g * t);

    // red glow pulse
    this.scene.tweens.add({ targets: orb, alpha: 0.7, duration: 200, yoyo: true, repeat: -1 });
    this.scene.time.delayedCall(4000, () => { if (orb.active) orb.destroy(); });
  }
}
