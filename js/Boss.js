/**
 * Ashen Hollow — Boss: Malachar, The Ashen King (phases, move set, AI)
 * Dark fantasy action game inspired by Bloodborne and Elden Ring
 * Author: Youssef | github.com/youssef-880
 */

class Boss extends Phaser.Physics.Arcade.Sprite {

  constructor(scene, x, y) {
    super(scene, x, y, 'boss');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(95);
    this.setSize(70, 150).setOffset(35, 26);

    this.maxHp = 600;
    this.hp = this.maxHp;
    this.phase = 1;
    this.walkSpeed = 62;
    this.dead = false;
    this.busy = true;          // locked until entrance cinematic finishes
    this.enraged = false;
    this.dmgMult = 1;
    this.nextAttackAt = 0;
    this.lastMove = '';
    this.attackToken = 0;      // invalidates queued attack steps on stagger/phase
    this.recentHits = [];      // timestamps for stagger counting
    this.facing = -1;

    // pulsing heart in the chest cavity
    this.heart = scene.add.image(x, y, 'boss-heart').setDepth(96);
    scene.tweens.add({ targets: this.heart, scale: 1.5, duration: 550, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // flowing tattered cape (animated triangles)
    this.cape = scene.add.graphics().setDepth(94);
  }

  get player() { return this.scene.player; }

  activate() {
    this.busy = false;
    this.nextAttackAt = this.scene.time.now + 900;
  }

  /* ------------------------------------------------------------------ */

  update(time, delta) {
    if (!this.active) return;

    // heart tracks chest cavity
    this.heart.setPosition(this.x, this.y - 12);
    this.heart.setVisible(!this.dead);
    this.drawCape(time);

    if (this.dead || this.busy) { if (!this.dead && this.body) this.setVelocityX(0); return; }
    if (!this.player || this.player.dead) { this.setVelocityX(0); return; }

    this.facing = this.player.x > this.x ? 1 : -1;
    this.setFlipX(this.facing < 0);

    const dist = Math.abs(this.player.x - this.x);
    if (time >= this.nextAttackAt) {
      this.pickAttack(dist);
    } else if (dist > 90) {
      // slow pacing walk toward the player between attacks
      this.setVelocityX(this.facing * this.walkSpeed);
    } else {
      this.setVelocityX(0);
    }
  }

  drawCape(time) {
    const g = this.cape;
    g.clear();
    if (this.dead) return;
    const back = -this.facing;
    const bx = this.x + back * 30;
    const sway = Math.sin(time / 260) * 8;
    const sway2 = Math.sin(time / 190 + 2) * 10;
    g.fillStyle(0x0d0518, 0.9);
    g.fillTriangle(this.x + back * 8, this.y - 60, bx + sway, this.y + 45, this.x + back * 16, this.y - 55);
    g.fillTriangle(this.x + back * 12, this.y - 58, bx + back * 14 + sway2, this.y + 60, this.x + back * 24, this.y - 50);
    g.fillTriangle(this.x + back * 18, this.y - 52, bx + back * 26 + sway, this.y + 50, this.x + back * 30, this.y - 44);
  }

  /* ------------------------------------------------------------------ */
  /* Attack selection                                                    */
  /* ------------------------------------------------------------------ */

  pickAttack(dist) {
    let pool = ['cleave', 'sweep', 'stomp'];
    if (dist > 180) pool.push('lunge', 'lunge');
    if (this.phase === 2) pool.push('fury', 'shadow', 'burst');
    if (this.phase === 2 && !this.enraged && Math.random() < 0.15) pool = ['enrage'];

    pool = pool.filter(m => m !== this.lastMove);
    const move = Phaser.Utils.Array.GetRandom(pool);
    this.lastMove = move;
    this['atk_' + move]();
  }

  /** Run steps as [delayMs, fn] pairs; aborted if the token changes. */
  seq(steps) {
    this.busy = true;
    this.setVelocityX(0);
    const token = ++this.attackToken;
    let t = 0;
    steps.forEach(([delay, fn]) => {
      t += delay;
      this.scene.time.delayedCall(t, () => {
        if (!this.active || this.dead || token !== this.attackToken) return;
        fn();
      });
    });
  }

  /** Post-attack vulnerable window, then resume pacing. */
  recover(ms = 800) {
    this.scene.time.delayedCall(0, () => {
      const token = this.attackToken;
      this.scene.time.delayedCall(ms, () => {
        if (!this.active || this.dead || token !== this.attackToken) return;
        this.busy = false;
        this.nextAttackAt = this.scene.time.now + (this.phase === 2 ? 700 : 1100);
      });
    });
  }

  telegraph(color = 0xff9944, dur = 300) {
    this.setTint(color);
    this.scene.time.delayedCall(dur, () => { if (this.active && !this.dead) this.clearTint(); });
  }

  hitFront(width, height, dmg, yOffset = 0) {
    if (!this.player || this.player.dead) return;
    const rect = new Phaser.Geom.Rectangle(
      this.facing > 0 ? this.x + 20 : this.x - 20 - width,
      this.y - height / 2 + yOffset, width, height
    );
    const finalDmg = Math.round(dmg * this.dmgMult);
    if (Phaser.Geom.Rectangle.Overlaps(rect, this.player.getBounds())) {
      this.scene.combat.hitPlayer(finalDmg, this.x);
    }
    if (this.enraged) { this.enraged = false; this.dmgMult = 1; this.clearTint(); }
  }

  spd(ms) { return this.phase === 2 ? Math.round(ms / 1.3) : ms; } // phase 2: 30% faster

  /* ------------------------------------------------------------------ */
  /* Phase 1 move set                                                    */
  /* ------------------------------------------------------------------ */

  atk_cleave() {
    this.seq([
      [0, () => { this.telegraph(0xffcc66, this.spd(700)); this.scene.tweens.add({ targets: this, y: this.y - 14, duration: this.spd(600), yoyo: true }); }],
      [this.spd(750), () => {
        SFX.bossImpact();
        this.scene.cameras.main.shake(200, 0.012);
        this.scene.combat.burst(this.x + this.facing * 80, this.y + 80, 'p-ember', 16, 180);
        this.hitFront(170, 150, 25);
        this.scene.combat.spawnShockwave(this.x + this.facing * 60, this.y + 84, this.facing, 300, 12);
        this.recover(800);
      }]
    ]);
  }

  atk_sweep() {
    // full-arena-width slash at torso height — jump over it or roll through
    this.seq([
      [0, () => { this.telegraph(0xff6666, this.spd(800)); this.scene.combat.ripple(this.x, this.y - 30, 0xff6a00, 60); }],
      [this.spd(850), () => {
        SFX.bossImpact();
        this.scene.cameras.main.shake(150, 0.008);
        const g = this.scene.add.graphics().setDepth(80);
        g.lineStyle(6, 0xff8844, 0.8);
        g.lineBetween(0, this.y + 20, this.scene.arenaWidth || 1600, this.y + 20);
        this.scene.tweens.add({ targets: g, alpha: 0, duration: 250, onComplete: () => g.destroy() });
        if (this.player && !this.player.dead) {
          const pb = this.player.getBounds();
          const band = new Phaser.Geom.Rectangle(0, this.y - 10, this.scene.arenaWidth || 1600, 60);
          if (Phaser.Geom.Rectangle.Overlaps(band, pb)) this.scene.combat.hitPlayer(Math.round(18 * this.dmgMult), this.x);
          if (this.enraged) { this.enraged = false; this.dmgMult = 1; this.clearTint(); }
        }
        this.recover(850);
      }]
    ]);
  }

  atk_lunge() {
    this.seq([
      [0, () => { this.telegraph(0xffaa44, this.spd(900)); this.scene.tweens.add({ targets: this, x: this.x - this.facing * 20, duration: this.spd(850) }); }],
      [this.spd(950), () => {
        SFX.attackHeavy();
        this.setVelocityX(this.facing * 520);
        const token = this.attackToken;
        // active hitbox during the dash
        const iv = this.scene.time.addEvent({
          delay: 50, repeat: 7,
          callback: () => {
            if (!this.active || this.dead || token !== this.attackToken) { iv.remove(); return; }
            this.hitFront(90, 100, 20);
          }
        });
      }],
      [this.spd(400), () => { this.setVelocityX(0); this.recover(900); }]
    ]);
  }

  atk_stomp() {
    this.seq([
      [0, () => { this.telegraph(0xff8844, this.spd(600)); this.scene.tweens.add({ targets: this, scaleY: 1.06, duration: this.spd(550), yoyo: true }); }],
      [this.spd(650), () => {
        SFX.bossImpact();
        this.scene.cameras.main.shake(250, 0.01);
        this.scene.combat.burst(this.x, this.y + 84, 'p-ember', 20, 200);
        this.scene.combat.spawnShockwave(this.x + this.facing * 40, this.y + 84, this.facing, 340, Math.round(15 * this.dmgMult));
        if (this.enraged) { this.enraged = false; this.dmgMult = 1; this.clearTint(); }
        this.recover(800);
      }]
    ]);
  }

  /* ------------------------------------------------------------------ */
  /* Phase 2 move set                                                    */
  /* ------------------------------------------------------------------ */

  atk_fury() {
    const swing = (dmg) => () => {
      SFX.attackHeavy();
      this.scene.combat.slashArc(this.x + this.facing * 50, this.y, this.facing, true, true);
      this.hitFront(120, 120, dmg);
      this.setVelocityX(this.facing * 120);
      this.scene.time.delayedCall(120, () => { if (this.active) this.setVelocityX(0); });
    };
    this.seq([
      [0, () => this.telegraph(0xff4444, 400)],
      [450, swing(8)],
      [280, swing(8)],
      [280, swing(8)],
      [340, swing(10)],
      [200, () => this.recover(1000)]
    ]);
  }

  atk_shadow() {
    this.seq([
      [0, () => {
        this.telegraph(0x8844ff, 300);
        this.scene.combat.burst(this.x, this.y, 'p-dark', 24, 160, 500);
      }],
      [350, () => {
        // teleport behind the player
        if (this.player) {
          const behind = this.player.x - this.player.facing * 110;
          this.x = Phaser.Math.Clamp(behind, 90, (this.scene.arenaWidth || 1600) - 90);
          this.facing = this.player.x > this.x ? 1 : -1;
          this.setFlipX(this.facing < 0);
        }
        this.scene.combat.burst(this.x, this.y, 'p-dark', 24, 160, 500);
        this.telegraph(0xff6666, 400); // reaction window before the strike
      }],
      [450, () => {
        SFX.attackHeavy();
        this.scene.combat.slashArc(this.x + this.facing * 50, this.y, this.facing, true, true);
        this.hitFront(110, 130, 18);
        this.recover(750);
      }]
    ]);
  }

  atk_burst() {
    this.seq([
      [0, () => { this.telegraph(0xffaa22, this.spd(700)); this.scene.tweens.add({ targets: this, y: this.y - 10, duration: this.spd(650), yoyo: true }); }],
      [this.spd(750), () => {
        SFX.bossImpact();
        this.scene.cameras.main.shake(300, 0.012);
        // three shockwaves in a spread of speeds toward the player
        [240, 340, 460].forEach((speed, i) => {
          this.scene.time.delayedCall(i * 90, () => {
            if (!this.active || this.dead) return;
            this.scene.combat.spawnShockwave(this.x + this.facing * 40, this.y + 84, this.facing, speed, 15);
          });
        });
        this.recover(950);
      }]
    ]);
  }

  atk_enrage() {
    this.seq([
      [0, () => {
        this.enraged = true;
        this.dmgMult = 1.5;
        this.setTint(0xff5522);
        this.scene.combat.ripple(this.x, this.y, 0xff5522, 130);
        SFX.bossRoar();
      }],
      [700, () => { this.busy = false; this.nextAttackAt = this.scene.time.now + 300; }]
    ]);
  }

  /* ------------------------------------------------------------------ */
  /* Damage, stagger, phase transition, death                            */
  /* ------------------------------------------------------------------ */

  takeDamage(amount) {
    if (this.dead || this.introPlaying) return;
    this.hp -= amount;

    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(60, () => {
      if (this.active && !this.dead) this.enraged ? this.setTint(0xff5522) : this.clearTint();
    });
    this.scene.combat.bloodBurst(this.x + Phaser.Math.Between(-30, 30), this.y + Phaser.Math.Between(-40, 20));
    this.scene.combat.number(this.x, this.y - 90, amount, '#ff2222');

    if (this.scene.ui) this.scene.ui.updateBossBar(this.hp, this.maxHp);

    // 3 quick hits → stagger
    const now = this.scene.time.now;
    this.recentHits.push(now);
    this.recentHits = this.recentHits.filter(t => now - t < 1200);
    if (this.recentHits.length >= 3 && !this.staggeredNow) this.staggerNow();

    if (this.hp <= this.maxHp / 2 && this.phase === 1) { this.phaseTwo(); return; }
    if (this.hp <= 0) { this.hp = 0; this.die(); }
  }

  staggerNow() {
    this.recentHits = [];
    this.staggeredNow = true;
    this.attackToken++;      // cancel any queued attack steps
    this.busy = true;
    this.clearTint();
    this.setVelocityX(0);

    // dramatic stumble — longer vulnerable window
    this.scene.tweens.add({ targets: this, angle: -this.facing * 12, duration: 200, yoyo: true, repeat: 1 });
    this.scene.combat.ripple(this.x, this.y, 0xffffff, 80);

    this.scene.time.delayedCall(1600, () => {
      if (!this.active || this.dead) return;
      this.staggeredNow = false;
      this.setAngle(0);
      this.busy = false;
      this.nextAttackAt = this.scene.time.now + 400;
    });
  }

  phaseTwo() {
    this.phase = 2;
    this.attackToken++;
    this.busy = true;
    this.staggeredNow = false;
    this.setVelocityX(0);
    this.clearTint();

    const scene = this.scene;
    // kneel, screen shakes, orange energy erupts, roar
    scene.tweens.add({ targets: this, scaleY: 0.85, y: this.y + 12, duration: 600, ease: 'Cubic.easeOut' });
    scene.cameras.main.shake(1200, 0.008);
    SFX.bossRoar();

    scene.time.delayedCall(800, () => {
      if (!this.active) return;
      scene.combat.burst(this.x, this.y - 12, 'p-ember', 40, 320, 900);
      scene.combat.ripple(this.x, this.y, 0xff6a00, 220);
      scene.cameras.main.flash(400, 255, 120, 30);
      this.setTexture('boss-p2'); // cracks bleed orange light
      scene.tweens.add({ targets: this, scaleY: 1, y: this.y - 12, duration: 500 });
      if (scene.ui) scene.ui.announce('PHASE 2 — THE ASHEN KING AWAKENS', '#c9a84c');
    });

    scene.time.delayedCall(2400, () => {
      if (!this.active || this.dead) return;
      this.walkSpeed = Math.round(this.walkSpeed * 1.3);
      this.busy = false;
      this.nextAttackAt = scene.time.now + 600;
    });
  }

  die() {
    if (this.dead) return;
    this.dead = true;
    this.attackToken++;
    this.busy = true;
    this.clearTint();
    this.setVelocityX(0);
    this.cape.clear();

    const scene = this.scene;
    // falls to knees slowly; orange light fades from the chest
    scene.tweens.add({ targets: this, scaleY: 0.7, y: this.y + 26, angle: this.facing * 8, duration: 2200, ease: 'Cubic.easeOut' });
    scene.tweens.add({ targets: this.heart, alpha: 0, scale: 0.2, duration: 2600 });
    scene.tweens.add({ targets: this, alpha: 0.25, delay: 2200, duration: 2000 });

    if (scene.onBossDefeated) scene.onBossDefeated();
  }
}
