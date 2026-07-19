/**
 * Ashen Hollow — MainMenuScene: title screen with ash, bonfire, cathedral
 * Dark fantasy action game inspired by Bloodborne and Elden Ring
 * Author: Youssef | github.com/youssef-880
 */

class MainMenuScene extends Phaser.Scene {

  constructor() {
    super('MainMenuScene');
  }

  create() {
    SFX.stopAllLoops();
    this.cameras.main.setBackgroundColor('#050510');

    // distant cathedral
    this.add.image(640, 430, 'cathedral').setAlpha(0.75).setScale(1.15);

    // falling ash
    const ash = this.add.particles(0, 0, 'p-ash', {
      x: { min: 0, max: 1280 }, y: -10,
      lifespan: 9000,
      speedY: { min: 12, max: 50 },
      speedX: { min: -15, max: 10 },
      alpha: { start: 0.5, end: 0 },
      scale: { min: 0.4, max: 1 },
      frequency: 45
    });
    for (let i = 0; i < 80; i++) ash.emitParticleAt(Phaser.Math.Between(0, 1280), Phaser.Math.Between(0, 700));

    // title — gold gradient
    const title = this.add.text(640, 200, 'ASHEN HOLLOW', {
      fontFamily: 'Cinzel, serif', fontSize: '96px', fontStyle: 'bold',
      color: '#c9a84c', stroke: '#2a1f00', strokeThickness: 8
    }).setOrigin(0.5);
    const grad = title.context.createLinearGradient(0, 0, 0, title.height);
    grad.addColorStop(0, '#f0d98c');
    grad.addColorStop(0.5, '#c9a84c');
    grad.addColorStop(1, '#7a6020');
    title.setFill(grad);

    this.add.text(640, 285, 'A  D A R K  F A N T A S Y', {
      fontFamily: 'Cinzel, serif', fontSize: '22px', color: '#f5f0e8'
    }).setOrigin(0.5).setAlpha(0.8);

    // bonfire flickering in the center foreground
    this.bonfireY = 560;
    this.bonfireG = this.add.graphics().setDepth(10);
    const base = this.add.graphics().setDepth(9);
    base.fillStyle(0x22222a, 1);
    base.fillEllipse(640, this.bonfireY, 60, 12);
    base.fillStyle(0x555560, 1);
    base.fillRect(638, this.bonfireY - 48, 4, 44);
    base.fillTriangle(633, this.bonfireY - 48, 647, this.bonfireY - 48, 640, this.bonfireY - 60);
    this.add.particles(640, this.bonfireY - 24, 'p-ember', {
      speedY: { min: -70, max: -25 }, speedX: { min: -18, max: 18 },
      lifespan: 1500, alpha: { start: 0.9, end: 0 },
      scale: { start: 1, end: 0.2 }, frequency: 90
    }).setDepth(11);

    // pulsing prompt
    const prompt = this.add.text(640, 430, 'PRESS ENTER TO BEGIN', {
      fontFamily: 'Cinzel, serif', fontSize: '26px', color: '#f5f0e8'
    }).setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0.25, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // credit
    this.add.text(640, 690, 'Built by Youssef | github.com/youssef-880', {
      fontFamily: 'Cinzel, serif', fontSize: '15px', color: '#f5f0e8'
    }).setOrigin(0.5).setAlpha(0.45);

    // vignette
    this.add.image(640, 360, 'vignette').setDepth(20);

    const begin = () => {
      SFX.init();
      // reset the run
      this.registry.set('vials', 3);
      this.registry.set('playerHp', 100);
      this.registry.set('weaponForm', 'blade');
      this.registry.set('checkpoint', { x: 200, y: 560 });
      this.registry.set('deadEnemies', []);
      this.registry.set('stats', { hits: 0, deaths: 0, dmg: 0, start: Date.now() });
      this.registry.set('vialTaken', false);
      this.cameras.main.fadeOut(800, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('GameScene'));
    };
    this.input.keyboard.once('keydown-ENTER', begin);
    this.input.once('pointerdown', begin);
  }

  update(time) {
    // flickering menu bonfire
    const g = this.bonfireG;
    const y = this.bonfireY;
    const f = Math.sin(time / 85) * 4 + Math.sin(time / 39) * 2;
    g.clear();
    g.fillStyle(0xc9a84c, 0.08 + Math.sin(time / 140) * 0.03);
    g.fillCircle(640, y - 26, 80 + f * 2);
    g.fillStyle(0xc9541e, 0.85);
    g.fillTriangle(622, y - 4, 658, y - 4, 640 + f, y - 52 - f * 2);
    g.fillStyle(0xe8842a, 0.9);
    g.fillTriangle(628, y - 4, 652, y - 4, 640 - f, y - 38 - f);
    g.fillStyle(0xf5c542, 0.95);
    g.fillTriangle(634, y - 4, 646, y - 4, 640 + f * 0.5, y - 22 - f);
  }
}
