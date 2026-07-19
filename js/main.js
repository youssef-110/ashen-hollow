/**
 * Ashen Hollow — main: Phaser game config + boot
 * Dark fantasy action game inspired by Bloodborne and Elden Ring
 * Author: Youssef | github.com/youssef-880
 */

const config = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: 'game-container',
  backgroundColor: '#0a0a0a',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 800 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, MainMenuScene, GameScene, BossScene]
};

const game = new Phaser.Game(config);

// Web Audio must be unlocked by a user gesture
const unlockAudio = () => SFX.init();
window.addEventListener('pointerdown', unlockAudio);
window.addEventListener('keydown', unlockAudio);
