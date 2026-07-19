/**
 * Ashen Hollow — Combat: hit detection, damage, shared effects
 * Dark fantasy action game inspired by Bloodborne and Elden Ring
 * Author: Youssef | github.com/youssef-880
 */

class Combat {
  constructor(scene) {
    this.scene = scene;
  }

  /* ------------------------------------------------------------------ */
  /* Player strikes: rect vs enemies (and boss, if present)              */
  /* ------------------------------------------------------------------ */

  playerStrike(rect, damage, opts = {}) {
    const scene = this.scene;
    const { knockback = 140, stagger = false, fromX = rect.centerX } = opts;
    let hitSomething = false;

    if (scene.enemies) {
      scene.enemies.getChildren().forEach(enemy => {
        if (!enemy.active || enemy.dead) return;
        if (Phaser.Geom.Rectangle.Overlaps(rect, enemy.getBounds())) {
          enemy.takeDamage(damage, fromX, knockback, stagger);
          hitSomething = true;
        }
      });
    }

    if (scene.boss && scene.boss.active && !scene.boss.dead) {
      if (Phaser.Geom.Rectangle.Overlaps(rect, scene.boss.getBounds())) {
        scene.boss.takeDamage(damage);
        hitSomething = true;
      }
    }

    if (hitSomething) {
      this.trackDamage(damage);
      SFX.enemyHit();
      scene.cameras.main.shake(60, 0.002);
    }
    return hitSomething;
  }

  trackDamage(amount) {
    const stats = this.scene.registry.get('stats');
    stats.dmg += amount;
    this.scene.registry.set('stats', stats);
  }

  /* ------------------------------------------------------------------ */
  /* Damage to the player                                                */
  /* ------------------------------------------------------------------ */

  hitPlayer(damage, sourceX) {
    const player = this.scene.player;
    if (!player || player.dead) return false;
    return player.takeDamage(damage, sourceX);
  }

  /* ------------------------------------------------------------------ */
  /* Floating damage numbers                                             */
  /* ------------------------------------------------------------------ */

  number(x, y, text, color = '#ff2222', size = 18) {
    const t = this.scene.add.text(x + Phaser.Math.Between(-8, 8), y, text, {
      fontFamily: 'Cinzel, serif',
      fontSize: size + 'px',
      color: color,
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(500);
    this.scene.tweens.add({
      targets: t,
      y: y - 46,
      alpha: 0,
      duration: 850,
      ease: 'Cubic.easeOut',
      onComplete: () => t.destroy()
    });
  }

  /* ------------------------------------------------------------------ */
  /* Slash trail arc (white arc drawn with Graphics, fades fast)         */
  /* ------------------------------------------------------------------ */

  slashArc(x, y, facing, wide = false, heavy = false) {
    const g = this.scene.add.graphics().setDepth(60);
    const r = wide ? 74 : 46;
    const color = heavy ? 0xfff0cc : 0xffffff;
    g.lineStyle(heavy ? 5 : 3, color, 0.85);
    const start = facing > 0 ? -70 : 250;
    const end = facing > 0 ? 70 : 110;
    g.beginPath();
    g.arc(x, y, r, Phaser.Math.DegToRad(start), Phaser.Math.DegToRad(end), facing < 0);
    g.strokePath();
    g.lineStyle(1, color, 0.4);
    g.beginPath();
    g.arc(x, y, r - 8, Phaser.Math.DegToRad(start), Phaser.Math.DegToRad(end), facing < 0);
    g.strokePath();
    this.scene.tweens.add({
      targets: g, alpha: 0, duration: 160,
      onComplete: () => g.destroy()
    });
  }

  /* ------------------------------------------------------------------ */
  /* Particle bursts                                                     */
  /* ------------------------------------------------------------------ */

  burst(x, y, texture, count = 12, speed = 160, lifespan = 500) {
    const em = this.scene.add.particles(x, y, texture, {
      speed: { min: speed * 0.4, max: speed },
      angle: { min: 0, max: 360 },
      lifespan: lifespan,
      scale: { start: 1, end: 0 },
      quantity: count,
      emitting: false
    }).setDepth(70);
    em.explode(count);
    this.scene.time.delayedCall(lifespan + 100, () => em.destroy());
  }

  bloodBurst(x, y, big = false) {
    this.burst(x, y, 'p-blood', big ? 22 : 10, big ? 220 : 150);
  }

  goldBurst(x, y) {
    this.burst(x, y, 'p-gold', 24, 200, 700);
  }

  ashBurst(x, y) {
    this.burst(x, y, 'p-ash', 26, 90, 900);
  }

  /* ------------------------------------------------------------------ */
  /* Expanding ripple ring (wraith death, boss roar)                     */
  /* ------------------------------------------------------------------ */

  ripple(x, y, color = 0xffffff, maxR = 90) {
    const g = this.scene.add.graphics().setDepth(80);
    const state = { r: 8, a: 0.9 };
    this.scene.tweens.add({
      targets: state, r: maxR, a: 0, duration: 450, ease: 'Cubic.easeOut',
      onUpdate: () => {
        g.clear();
        g.lineStyle(3, color, state.a);
        g.strokeCircle(x, y, state.r);
      },
      onComplete: () => g.destroy()
    });
  }

  /* ------------------------------------------------------------------ */
  /* Travelling ground shockwave (boss / scythe heavy)                   */
  /* ------------------------------------------------------------------ */

  spawnShockwave(x, y, dir, speed, damage, fromBoss = true) {
    const scene = this.scene;
    const wave = scene.physics.add.image(x, y - 12, 'shockwave').setDepth(65);
    wave.body.setAllowGravity(false);
    wave.setVelocityX(dir * speed);
    wave.setFlipX(dir < 0);
    wave.hitDone = false;
    wave.fromBoss = fromBoss;
    wave.dmg = damage;
    if (!scene.shockwaves) scene.shockwaves = [];
    scene.shockwaves.push(wave);
    scene.time.delayedCall(2400, () => { if (wave.active) wave.destroy(); });
    return wave;
  }

  /** Called every frame by the scene to resolve shockwave hits. */
  updateShockwaves() {
    const scene = this.scene;
    if (!scene.shockwaves) return;
    scene.shockwaves = scene.shockwaves.filter(w => w.active);
    scene.shockwaves.forEach(wave => {
      if (wave.hitDone) return;
      if (wave.fromBoss) {
        const p = scene.player;
        if (p && !p.dead && Phaser.Geom.Rectangle.Overlaps(wave.getBounds(), p.getBounds())) {
          if (this.hitPlayer(wave.dmg, wave.x)) wave.hitDone = true;
        }
      } else {
        this.playerStrike(wave.getBounds(), wave.dmg, { fromX: wave.x });
        wave.hitDone = true; // player shockwave hits once
      }
    });
  }
}
