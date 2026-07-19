/**
 * Ashen Hollow — BootScene: procedural asset generation + loading screen
 * Dark fantasy action game inspired by Bloodborne and Elden Ring
 * Author: Youssef | github.com/youssef-880
 */

class BootScene extends Phaser.Scene {

  constructor() {
    super('BootScene');
  }

  create() {
    // loading bar frame
    const barBg = this.add.rectangle(640, 380, 424, 22, 0x0d0d0d).setStrokeStyle(2, 0xc9a84c);
    const bar = this.add.rectangle(640 - 210, 380, 1, 14, 0xc9a84c).setOrigin(0, 0.5);
    const label = this.add.text(640, 330, 'KINDLING THE FLAME', {
      fontFamily: 'Cinzel, serif', fontSize: '22px', color: '#f5f0e8'
    }).setOrigin(0.5);

    // generate every texture the game uses
    AssetLoader.generateAll(this);

    // fresh-run registry state
    this.registry.set('vials', 3);
    this.registry.set('playerHp', 100);
    this.registry.set('weaponForm', 'blade');
    this.registry.set('checkpoint', { x: 200, y: 560 });
    this.registry.set('deadEnemies', []);
    this.registry.set('stats', { hits: 0, deaths: 0, dmg: 0, start: 0 });
    this.registry.set('controlsSeen', false);
    this.registry.set('vialTaken', false);

    // wait for Cinzel (with a fallback timeout), then proceed
    const fontReady = Promise.race([
      (document.fonts && document.fonts.load
        ? Promise.all([
            document.fonts.load('700 64px Cinzel'),
            document.fonts.load('400 20px Cinzel')
          ])
        : Promise.resolve()),
      new Promise(res => setTimeout(res, 2500))
    ]);

    // sweep the bar full, then start the menu once the font is in
    this.tweens.add({
      targets: bar, width: 420, duration: 900, ease: 'Cubic.easeOut',
      onComplete: () => {
        fontReady.then(() => {
          const dom = document.getElementById('loading-screen');
          if (dom) {
            dom.classList.add('hidden');
            setTimeout(() => dom.remove(), 1300);
          }
          label.destroy(); bar.destroy(); barBg.destroy();
          this.scene.start('MainMenuScene');
        });
      }
    });
  }
}
