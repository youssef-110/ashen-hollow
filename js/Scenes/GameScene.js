/**
 * Ashen Hollow — GameScene: the main level, enemies, bonfire, fog gate
 * Dark fantasy action game inspired by Bloodborne and Elden Ring
 * Author: Youssef | github.com/youssef-880
 */

const ENEMY_SPAWNS = [
  { id: 0, type: 'shambler', x: 620,  y: 590 },
  { id: 1, type: 'shambler', x: 940,  y: 590 },
  { id: 2, type: 'wraith',   x: 1150, y: 420 },
  { id: 3, type: 'watcher',  x: 1310, y: 610 },
  { id: 4, type: 'shambler', x: 1850, y: 590 },
  { id: 5, type: 'wraith',   x: 2120, y: 380 },
  { id: 6, type: 'watcher',  x: 2360, y: 296 },
  { id: 7, type: 'shambler', x: 2540, y: 590 },
  { id: 8, type: 'wraith',   x: 2820, y: 420 }
];

class GameScene extends Phaser.Scene {

  constructor() {
    super('GameScene');
  }

  create() {
    this.cameras.main.fadeIn(600, 0, 0, 0);
    this.isPaused = false;
    this.transitioning = false;

    // world
    this.level = new Level(this, 'hollow');

    // player at last bonfire checkpoint
    const cp = this.registry.get('checkpoint');
    this.player = new Player(this, cp.x, cp.y);

    // enemies (the fallen do not rise again)
    this.enemies = this.add.group();
    const deadList = this.registry.get('deadEnemies');
    ENEMY_SPAWNS.forEach(s => {
      if (deadList.includes(s.id)) return;
      let e;
      if (s.type === 'shambler') e = new Shambler(this, s.x, s.y, s.id);
      else if (s.type === 'wraith') e = new Wraith(this, s.x, s.y, s.id);
      else e = new Watcher(this, s.x, s.y, s.id);
      this.enemies.add(e);
    });

    // watcher projectiles
    this.orbs = this.physics.add.group();

    this.combat = new Combat(this);
    this.ui = new UI(this, this.player);

    // colliders
    this.physics.add.collider(this.player, this.level.platforms);
    this.physics.add.collider(this.enemies, this.level.platforms);
    this.physics.add.collider(this.player, this.level.crumbles, (player, tile) => {
      if (player.body.touching.down && !tile.crumbling) this.startCrumble(tile);
    });
    this.physics.add.collider(this.orbs, this.level.platforms, orb => {
      this.combat.burst(orb.x, orb.y, 'p-dark', 8, 90, 350);
      orb.destroy();
    });
    this.physics.add.overlap(this.player, this.orbs, (player, orb) => {
      if (this.combat.hitPlayer(orb.dmg, orb.x)) orb.destroy();
    });

    // hidden blood vial pickup
    if (this.level.vialPickup) {
      this.physics.add.overlap(this.player, this.level.vialPickup, (player, vial) => {
        this.registry.set('vialTaken', true);
        player.vials++;
        this.registry.set('vials', player.vials);
        this.combat.goldBurst(vial.x, vial.y);
        this.combat.number(vial.x, vial.y - 20, 'Blood Vial', '#c9a84c', 16);
        vial.destroy();
        this.level.vialPickup = null;
      });
    }

    // fog gate → boss
    this.physics.add.overlap(this.player, this.level.fogGate, () => this.enterFogGate());

    // camera follows with slight lag
    this.cameras.main.startFollow(this.player, false, 0.08, 0.08);
    this.cameras.main.setDeadzone(60, 120);

    // interaction prompt
    this.prompt = this.add.text(640, 560, '', {
      fontFamily: 'Cinzel, serif', fontSize: '18px', color: '#c9a84c',
      stroke: '#000000', strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1002);

    this.keyR = this.input.keyboard.addKey('R');
    this.keyEsc = this.input.keyboard.addKey('ESC');

    SFX.startBonfire();

    // first-load controls overlay
    if (!this.registry.get('controlsSeen')) {
      this.registry.set('controlsSeen', true);
      this.player.controlsLocked = true;
      this.ui.showControls(() => { this.player.controlsLocked = false; });
    }
  }

  /* ------------------------------------------------------------------ */

  startCrumble(tile) {
    tile.crumbling = true;
    // tremble for 1.5s, then give way
    this.tweens.add({ targets: tile, x: tile.x + 2, duration: 60, yoyo: true, repeat: 11 });
    this.time.delayedCall(1500, () => {
      if (!tile.active) return;
      this.combat.burst(tile.x, tile.y, 'p-ash', 14, 80, 600);
      tile.body.enable = false;
      this.tweens.add({ targets: tile, alpha: 0, y: tile.y + 30, duration: 400 });
      // reform quietly after a while
      this.time.delayedCall(5000, () => {
        if (!tile.active) return;
        tile.y -= 30;
        tile.setAlpha(1);
        tile.body.enable = true;
        tile.crumbling = false;
      });
    });
  }

  nearBonfire() {
    const b = this.level.bonfire;
    return b && Phaser.Math.Distance.Between(this.player.x, this.player.y, b.x, b.y - 20) < 80;
  }

  /** E key: rest at bonfire when close, otherwise drink a vial. */
  onUseKey() {
    if (this.nearBonfire() && !this.player.dead) {
      this.player.hp = this.player.maxHp;
      this.player.vials = 3;
      this.registry.set('vials', 3);
      this.registry.set('playerHp', 100);
      this.registry.set('checkpoint', { x: this.level.bonfire.x, y: this.level.bonfire.y - 80 });
      this.combat.goldBurst(this.level.bonfire.x, this.level.bonfire.y - 30);
      this.ui.announce('Flame Rekindled', '#c9a84c', 28, 1400);
      SFX.heal();
    } else {
      this.player.tryHeal();
    }
  }

  enterFogGate() {
    if (this.transitioning || this.player.dead) return;
    this.transitioning = true;
    this.player.controlsLocked = true;
    this.player.setVelocityX(0);
    // save state through the fog
    this.registry.set('playerHp', this.player.hp);
    this.registry.set('vials', this.player.vials);
    SFX.stopBonfire();
    this.cameras.main.flash(900, 255, 255, 255);
    this.time.delayedCall(850, () => this.scene.start('BossScene'));
  }

  onPlayerDeath() {
    SFX.stopBonfire();
  }

  /* ------------------------------------------------------------------ */

  update(time, delta) {
    if (this.isPaused) {
      if (Phaser.Input.Keyboard.JustDown(this.keyEsc)) this.ui.togglePause();
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyEsc) && !this.player.dead) this.ui.togglePause();

    this.player.update(time, delta);
    this.enemies.getChildren().forEach(e => e.update(time, delta));
    this.level.update(time);
    this.combat.updateShockwaves();
    this.ui.update(time);

    // fell into the bottomless pit
    if (!this.player.dead && this.player.y > 820) {
      this.player.hp = 0;
      this.player.die();
    }

    // bonfire prompt
    if (!this.player.dead && this.nearBonfire()) {
      this.prompt.setText('E — Rest at Bonfire');
    } else {
      this.prompt.setText('');
    }

    // respawn at last bonfire with full health
    if (this.player.dead && Phaser.Input.Keyboard.JustDown(this.keyR)) {
      this.registry.set('playerHp', 100);
      this.registry.set('vials', 3);
      SFX.stopAllLoops();
      this.scene.restart();
    }
  }
}
