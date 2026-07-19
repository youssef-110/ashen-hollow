/**
 * Ashen Hollow — BossScene: Malachar's arena, entrance cinematic, victory/defeat
 * Dark fantasy action game inspired by Bloodborne and Elden Ring
 * Author: Youssef | github.com/youssef-880
 */

class BossScene extends Phaser.Scene {

  constructor() {
    super('BossScene');
  }

  create() {
    this.isPaused = false;
    this.arenaWidth = 1600;
    this.victory = false;

    this.level = new Level(this, 'arena');

    this.player = new Player(this, 180, 560);
    this.player.controlsLocked = true; // locked for the entrance cinematic

    this.combat = new Combat(this);
    this.ui = new UI(this, this.player);

    // Malachar waits beyond the far edge
    this.boss = new Boss(this, 1520, 530);
    this.boss.introPlaying = true;

    this.physics.add.collider(this.player, this.level.platforms);
    this.physics.add.collider(this.boss, this.level.platforms);

    this.cameras.main.startFollow(this.player, false, 0.08, 0.08);

    this.keyR = this.input.keyboard.addKey('R');
    this.keyEsc = this.input.keyboard.addKey('ESC');

    this.runEntrance();
  }

  /* ------------------------------------------------------------------ */
  /* Entrance cinematic: white reveal, boss walks in, roar               */
  /* ------------------------------------------------------------------ */

  runEntrance() {
    // screen was white from the fog gate — reveal the arena
    this.cameras.main.flash(700, 255, 255, 255);

    this.time.delayedCall(700, () => {
      // boss strides in slowly
      this.cameras.main.shake(2400, 0.0025);
      this.tweens.add({
        targets: this.boss, x: 1150, duration: 2600, ease: 'Sine.easeInOut'
      });
    });

    this.time.delayedCall(3400, () => {
      // roar: flash + ripple + sound
      SFX.bossRoar();
      this.cameras.main.flash(300, 255, 140, 40);
      this.cameras.main.shake(600, 0.01);
      this.combat.ripple(this.boss.x, this.boss.y - 40, 0xff6a00, 200);
      this.ui.announce('MALACHAR, THE ASHEN KING', '#f5f0e8', 30, 1800);
    });

    this.time.delayedCall(4600, () => {
      this.ui.showBossBar('MALACHAR, THE ASHEN KING', this.boss.maxHp);
      this.boss.introPlaying = false;
      this.boss.activate();
      this.player.controlsLocked = false;
    });
  }

  /* ------------------------------------------------------------------ */
  /* Outcomes                                                            */
  /* ------------------------------------------------------------------ */

  onBossDefeated() {
    if (this.victory) return;
    this.victory = true;
    this.ui.hideBossBar();
    this.player.controlsLocked = true;
    this.player.setVelocityX(0);
    this.registry.set('bossDefeated', true);

    this.time.delayedCall(2600, () => {
      const stats = this.registry.get('stats');
      this.ui.showVictory({
        time: Date.now() - (stats.start || Date.now()),
        hits: stats.hits,
        deaths: stats.deaths,
        dmg: stats.dmg
      });
      // any key: a new journey awaits — fade to black, return to menu
      this.time.delayedCall(5000, () => {
        const leave = () => {
          this.cameras.main.fadeOut(2000, 0, 0, 0);
          this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('MainMenuScene'));
        };
        this.input.keyboard.once('keydown', leave);
        this.input.once('pointerdown', leave);
      });
    });
  }

  onPlayerDeath() {
    // Malachar looms over the fallen hunter
    if (this.boss && !this.boss.dead) {
      this.boss.busy = true;
      this.boss.setVelocityX(0);
    }
  }

  /* ------------------------------------------------------------------ */

  update(time, delta) {
    if (this.isPaused) {
      if (Phaser.Input.Keyboard.JustDown(this.keyEsc)) this.ui.togglePause();
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyEsc) && !this.player.dead && !this.victory) this.ui.togglePause();

    this.player.update(time, delta);
    this.boss.update(time, delta);
    this.level.update(time);
    this.combat.updateShockwaves();
    this.ui.update(time);

    // keep the duel inside the arena
    if (!this.player.dead) {
      this.player.x = Phaser.Math.Clamp(this.player.x, 20, this.arenaWidth - 20);
    }

    // defeat → rise again at the last bonfire, restored
    if (this.player.dead && Phaser.Input.Keyboard.JustDown(this.keyR)) {
      this.registry.set('playerHp', 100);
      this.registry.set('vials', 3);
      SFX.stopAllLoops();
      this.scene.start('GameScene');
    }
  }
}
