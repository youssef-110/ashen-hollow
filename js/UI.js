/**
 * Ashen Hollow — UI: HUD, health/stamina bars, boss bar, prompts, menus
 * Dark fantasy action game inspired by Bloodborne and Elden Ring
 * Author: Youssef | github.com/youssef-880
 */

const UI_FONT = 'Cinzel, serif';

class UI {

  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.bossVisible = false;
    this.bossHp = 0;
    this.bossMaxHp = 1;

    // bars are redrawn every frame with a single Graphics
    this.bars = scene.add.graphics().setScrollFactor(0).setDepth(1000);

    this.hpLabel = this.text(30, 6, 'HP', 13, '#f5f0e8');
    this.vialIcon = scene.add.image(40, 92, 'vial').setScrollFactor(0).setDepth(1001);
    this.vialText = this.text(54, 82, 'x 3', 16, '#f5f0e8');

    // bottom center: weapon form indicator
    this.weaponIcon = scene.add.image(620, 686, 'icon-blade').setScrollFactor(0).setDepth(1001);
    this.weaponText = this.text(640, 676, 'BLADE', 15, '#c9a84c');

    // boss bar name
    this.bossName = this.text(640, 30, '', 20, '#f5f0e8').setOrigin(0.5, 0).setVisible(false);

    // vignettes
    scene.add.image(640, 360, 'vignette').setScrollFactor(0).setDepth(990);
    this.redVignette = scene.add.image(640, 360, 'vignette-red')
      .setScrollFactor(0).setDepth(991).setAlpha(0);

    // pause state
    this.pauseGroup = null;
    scene.isPaused = false;
  }

  text(x, y, str, size, color) {
    return this.scene.add.text(x, y, str, {
      fontFamily: UI_FONT, fontSize: size + 'px', color: color,
      stroke: '#000000', strokeThickness: 3
    }).setScrollFactor(0).setDepth(1001);
  }

  /* ------------------------------------------------------------------ */
  /* Per-frame HUD redraw                                                */
  /* ------------------------------------------------------------------ */

  update(time) {
    const p = this.player;
    const g = this.bars;
    g.clear();

    // segmented health bar — bone white border, red fill
    const segs = 10, segW = 24, segH = 16, x0 = 30, y0 = 24;
    g.lineStyle(2, 0xf5f0e8, 0.9);
    g.strokeRect(x0 - 3, y0 - 3, segs * (segW + 3) + 3, segH + 6);
    for (let i = 0; i < segs; i++) {
      const sx = x0 + i * (segW + 3);
      g.fillStyle(0x1a0505, 0.9);
      g.fillRect(sx, y0, segW, segH);
      const segFill = Phaser.Math.Clamp(p.hp / p.maxHp * segs - i, 0, 1);
      if (segFill > 0) {
        g.fillStyle(0xa01010, 1);
        g.fillRect(sx, y0, segW * segFill, segH);
      }
    }

    // stamina bar — thin, gold
    g.fillStyle(0x0d0d0d, 0.9);
    g.fillRect(30, 52, 220, 9);
    g.fillStyle(0xc9a84c, 1);
    g.fillRect(30, 52, 220 * (p.stamina / p.maxStamina), 9);
    g.lineStyle(1, 0xf5f0e8, 0.5);
    g.strokeRect(30, 52, 220, 9);

    // blood vials
    this.vialText.setText('x ' + p.vials);

    // weapon form + transform cooldown dim
    const onCd = this.scene.time.now < p.transformCdUntil;
    this.weaponIcon.setTexture(p.form === 'blade' ? 'icon-blade' : 'icon-scythe').setAlpha(onCd ? 0.4 : 1);
    this.weaponText.setText(p.form.toUpperCase()).setAlpha(onCd ? 0.4 : 1);

    // boss health bar — full width, dark background, red fill
    if (this.bossVisible) {
      const bw = 800, bx = 640 - bw / 2, by = 58;
      g.fillStyle(0x0d0d0d, 0.85);
      g.fillRect(bx, by, bw, 14);
      g.fillStyle(0x8b0000, 1);
      g.fillRect(bx + 2, by + 2, (bw - 4) * Phaser.Math.Clamp(this.bossHp / this.bossMaxHp, 0, 1), 10);
      g.lineStyle(1, 0xf5f0e8, 0.7);
      g.strokeRect(bx, by, bw, 14);
    }

    // low health: pulsing red edges + heartbeat
    if (!p.dead && p.hp > 0 && p.hp / p.maxHp < 0.3) {
      const pulse = 0.25 + Math.abs(Math.sin(time / 420)) * 0.3;
      this.redVignette.setAlpha(Math.max(this.redVignette.alpha, pulse));
      SFX.startHeartbeat();
    } else if (!p.dead) {
      SFX.stopHeartbeat();
    }
  }

  /* ------------------------------------------------------------------ */
  /* Boss bar                                                            */
  /* ------------------------------------------------------------------ */

  showBossBar(name, maxHp) {
    this.bossVisible = true;
    this.bossMaxHp = maxHp;
    this.bossHp = maxHp;
    this.bossName.setText(name).setVisible(true).setAlpha(0);
    this.scene.tweens.add({ targets: this.bossName, alpha: 1, duration: 800 });
  }

  updateBossBar(hp) {
    this.bossHp = hp;
  }

  hideBossBar() {
    this.bossVisible = false;
    this.bossName.setVisible(false);
  }

  /* ------------------------------------------------------------------ */
  /* Hit feedback                                                        */
  /* ------------------------------------------------------------------ */

  damageFlash() {
    this.scene.tweens.add({
      targets: this.redVignette, alpha: 0.85, duration: 60, yoyo: true,
      onComplete: () => { if (this.player.hp / this.player.maxHp >= 0.3) this.redVignette.setAlpha(0); }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Center-screen announcements                                         */
  /* ------------------------------------------------------------------ */

  announce(str, color = '#c9a84c', size = 34, hold = 2200) {
    const t = this.scene.add.text(640, 300, str, {
      fontFamily: UI_FONT, fontSize: size + 'px', color: color,
      stroke: '#000000', strokeThickness: 5
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1100).setAlpha(0);
    this.scene.tweens.add({
      targets: t, alpha: 1, duration: 500, yoyo: true, hold: hold,
      onComplete: () => t.destroy()
    });
  }

  /* ------------------------------------------------------------------ */
  /* YOU DIED                                                            */
  /* ------------------------------------------------------------------ */

  showDeath() {
    const scene = this.scene;
    SFX.stopHeartbeat();
    this.redVignette.setAlpha(0.9);

    const black = scene.add.rectangle(640, 360, 1280, 720, 0x000000, 0)
      .setScrollFactor(0).setDepth(1050);
    scene.tweens.add({ targets: black, fillAlpha: 0.65, duration: 1500 });

    const died = scene.add.text(640, 330, 'YOU DIED', {
      fontFamily: UI_FONT, fontSize: '110px', color: '#8b0000',
      stroke: '#1a0000', strokeThickness: 6
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1060).setAlpha(0);
    scene.tweens.add({ targets: died, alpha: 1, duration: 2400, ease: 'Cubic.easeIn' });

    scene.time.delayedCall(3000, () => {
      const prompt = scene.add.text(640, 440, 'Press R to Rise', {
        fontFamily: UI_FONT, fontSize: '24px', color: '#f5f0e8'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(1060).setAlpha(0);
      scene.tweens.add({ targets: prompt, alpha: 0.9, duration: 700, yoyo: true, repeat: -1 });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Victory                                                             */
  /* ------------------------------------------------------------------ */

  showVictory(stats) {
    const scene = this.scene;
    SFX.stopHeartbeat();
    SFX.victory();

    // golden particles fill the screen
    scene.add.particles(0, 0, 'p-gold', {
      x: { min: 0, max: 1280 }, y: 740,
      lifespan: 4200,
      speedY: { min: -110, max: -35 },
      speedX: { min: -18, max: 18 },
      alpha: { start: 0.9, end: 0 },
      scale: { min: 0.4, max: 1.3 },
      frequency: 18
    }).setScrollFactor(0).setDepth(1055);

    const felled = scene.add.text(640, 250, 'GREAT ONE FELLED', {
      fontFamily: UI_FONT, fontSize: '72px', color: '#c9a84c',
      stroke: '#2a1f00', strokeThickness: 6
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1060).setAlpha(0);
    scene.tweens.add({ targets: felled, alpha: 1, duration: 2000 });

    const mins = Math.floor(stats.time / 60000);
    const secs = Math.floor((stats.time % 60000) / 1000);
    const lines = [
      'Time — ' + mins + 'm ' + String(secs).padStart(2, '0') + 's',
      'Hits Taken — ' + stats.hits,
      'Deaths — ' + stats.deaths,
      'Damage Dealt — ' + stats.dmg
    ];
    lines.forEach((line, i) => {
      const t = scene.add.text(640, 360 + i * 36, line, {
        fontFamily: UI_FONT, fontSize: '22px', color: '#f5f0e8'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(1060).setAlpha(0);
      scene.tweens.add({ targets: t, alpha: 0.9, delay: 1600 + i * 350, duration: 600 });
    });

    scene.time.delayedCall(4200, () => {
      const end = scene.add.text(640, 540, 'A new journey awaits...', {
        fontFamily: UI_FONT, fontSize: '26px', color: '#c9a84c', fontStyle: 'italic'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(1060).setAlpha(0);
      scene.tweens.add({ targets: end, alpha: 1, duration: 1200, yoyo: true, repeat: -1 });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Controls overlay (first load)                                       */
  /* ------------------------------------------------------------------ */

  showControls(onDismiss) {
    const scene = this.scene;
    const group = [];
    group.push(scene.add.rectangle(640, 360, 1280, 720, 0x000000, 0.8).setScrollFactor(0).setDepth(1200));
    group.push(scene.add.text(640, 110, 'CONTROLS', {
      fontFamily: UI_FONT, fontSize: '44px', color: '#c9a84c'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1201));

    const lines = [
      'WASD / Arrows — Move',
      'Space — Jump',
      'Shift — Roll / Dodge',
      'Left Click / Z — Light Attack',
      'Right Click / X — Heavy Attack',
      'Q — Transform Weapon',
      'E — Use Blood Vial / Rest at Bonfire',
      'Esc — Pause',
      'R — Respawn (when dead)'
    ];
    lines.forEach((line, i) => {
      group.push(scene.add.text(640, 185 + i * 40, line, {
        fontFamily: UI_FONT, fontSize: '21px', color: '#f5f0e8'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(1201));
    });
    const prompt = scene.add.text(640, 610, 'Press any key to begin the hunt', {
      fontFamily: UI_FONT, fontSize: '19px', color: '#c9a84c'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1201);
    group.push(prompt);
    scene.tweens.add({ targets: prompt, alpha: 0.4, duration: 800, yoyo: true, repeat: -1 });

    const dismiss = () => {
      group.forEach(o => o.destroy());
      scene.input.keyboard.off('keydown', dismiss);
      scene.input.off('pointerdown', dismiss);
      if (onDismiss) onDismiss();
    };
    scene.time.delayedCall(300, () => {
      scene.input.keyboard.once('keydown', dismiss);
      scene.input.once('pointerdown', dismiss);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Pause menu                                                          */
  /* ------------------------------------------------------------------ */

  togglePause() {
    const scene = this.scene;
    if (scene.isPaused) {
      scene.isPaused = false;
      scene.physics.world.resume();
      scene.time.paused = false;
      scene.tweens.resumeAll();
      if (this.pauseGroup) { this.pauseGroup.forEach(o => o.destroy()); this.pauseGroup = null; }
      return;
    }
    scene.isPaused = true;
    scene.physics.world.pause();
    scene.time.paused = true;
    scene.tweens.pauseAll();

    const overlay = scene.add.rectangle(640, 360, 1280, 720, 0x000000, 0.7).setScrollFactor(0).setDepth(1200);
    const title = scene.add.text(640, 250, 'PAUSED', {
      fontFamily: UI_FONT, fontSize: '56px', color: '#f5f0e8'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1201);

    const makeOption = (y, label, cb) => {
      const t = scene.add.text(640, y, label, {
        fontFamily: UI_FONT, fontSize: '28px', color: '#c9a84c'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(1201).setInteractive({ useHandCursor: true });
      t.on('pointerover', () => t.setColor('#f5f0e8'));
      t.on('pointerout', () => t.setColor('#c9a84c'));
      t.on('pointerdown', cb);
      return t;
    };
    const resume = makeOption(370, 'RESUME', () => this.togglePause());
    const quit = makeOption(430, 'QUIT TO MENU', () => {
      scene.isPaused = false;
      scene.physics.world.resume();
      scene.time.paused = false;
      scene.tweens.resumeAll();
      SFX.stopAllLoops();
      scene.scene.start('MainMenuScene');
    });
    this.pauseGroup = [overlay, title, resume, quit];
  }
}
