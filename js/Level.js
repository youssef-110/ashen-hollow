/**
 * Ashen Hollow — Level: layout, platforms, atmosphere (hollow + boss arena)
 * Dark fantasy action game inspired by Bloodborne and Elden Ring
 * Author: Youssef | github.com/youssef-880
 */

class Level {

  constructor(scene, kind = 'hollow') {
    this.scene = scene;
    this.kind = kind;
    this.width = kind === 'hollow' ? 3200 : 1600;
    this.groundTop = 640;

    this.platforms = scene.physics.add.staticGroup();
    this.crumbles = scene.physics.add.staticGroup();
    this.bonfire = null;
    this.fogGate = null;
    this.vialPickup = null;

    scene.physics.world.setBounds(0, -200, this.width, 1100);
    scene.cameras.main.setBounds(0, 0, this.width, 720);
    scene.cameras.main.setBackgroundColor('#0a0a0a');

    this.buildAtmosphere();
    if (kind === 'hollow') this.buildHollow();
    else this.buildArena();
  }

  /* ------------------------------------------------------------------ */
  /* Shared atmosphere: sky, cathedral, drifting ash                     */
  /* ------------------------------------------------------------------ */

  buildAtmosphere() {
    const scene = this.scene;

    // layer 1: black sky
    scene.add.rectangle(640, 360, 1280, 720, 0x050510).setScrollFactor(0).setDepth(-100);

    // layer 2: distant ruined cathedral silhouette (parallax)
    scene.add.image(500, 480, 'cathedral').setScrollFactor(0.15).setDepth(-90).setAlpha(0.8);
    if (this.kind === 'hollow') {
      scene.add.image(1400, 500, 'cathedral').setScrollFactor(0.22).setDepth(-88).setAlpha(0.55).setScale(0.7);
    }

    // layer 3: drifting ash — hundreds of tiny dots falling at random speeds
    const intensity = this.kind === 'arena' ? 30 : 55;
    this.ash = scene.add.particles(0, 0, 'p-ash', {
      x: { min: 0, max: this.width },
      y: -10,
      lifespan: 9000,
      speedY: { min: 12, max: 55 },
      speedX: { min: -18, max: 12 },
      alpha: { start: 0.55, end: 0 },
      scale: { min: 0.4, max: 1 },
      quantity: 1,
      frequency: intensity
    }).setDepth(-40);
    // pre-fill the sky so it isn't empty on scene start
    for (let i = 0; i < 90; i++) {
      this.ash.emitParticleAt(Phaser.Math.Between(0, this.width), Phaser.Math.Between(0, 700));
    }
  }

  /* ------------------------------------------------------------------ */
  /* Helpers                                                             */
  /* ------------------------------------------------------------------ */

  addGround(x1, x2) {
    const w = x2 - x1;
    const seg = this.scene.add.tileSprite(x1 + w / 2, this.groundTop + 40, w, 80, 'ground').setDepth(10);
    this.scene.physics.add.existing(seg, true);
    this.platforms.add(seg);
    return seg;
  }

  addPlatform(cx, cy, tiles) {
    const w = tiles * 64;
    const p = this.scene.add.tileSprite(cx, cy, w, 24, 'platform').setDepth(10);
    this.scene.physics.add.existing(p, true);
    this.platforms.add(p);
    return p;
  }

  addCrumble(cx, cy) {
    const c = this.crumbles.create(cx, cy, 'crumble');
    c.setDepth(10);
    c.crumbling = false;
    c.refreshBody();
    return c;
  }

  /* ------------------------------------------------------------------ */
  /* The Ashen Hollow — main level                                       */
  /* ------------------------------------------------------------------ */

  buildHollow() {
    const scene = this.scene;

    // ground with a bottomless pit between 1400 and 1660
    this.addGround(0, 1400);
    this.addGround(1660, 3200);

    // elevation layers
    this.addPlatform(520, 520, 3);
    this.addPlatform(800, 430, 2);
    this.addPlatform(1080, 350, 2);
    this.addPlatform(1300, 300, 2);   // narrow walkway toward the pit's upper route
    this.addPlatform(1800, 520, 3);
    this.addPlatform(2100, 420, 2);
    this.addPlatform(2350, 330, 2);
    this.addPlatform(2600, 500, 2);

    // hidden path: a high ledge tucked above the third platform
    this.addPlatform(880, 240, 2);
    if (!scene.registry.get('vialTaken')) {
      this.vialPickup = scene.physics.add.staticImage(880, 214, 'vial').setDepth(30);
      scene.tweens.add({ targets: this.vialPickup, y: 208, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    // crumbling platforms crossing the pit (1.5s delay once stood upon)
    this.addCrumble(1450, 560);
    this.addCrumble(1560, 500);

    // one extra crumbler on the high route
    this.addCrumble(2220, 250);

    // broken stone architecture
    scene.add.image(350, this.groundTop - 90, 'pillar').setDepth(5);
    scene.add.image(960, this.groundTop - 90, 'pillar').setDepth(5).setFlipX(true).setAngle(-6);
    scene.add.image(1760, this.groundTop - 90, 'pillar').setDepth(5).setAngle(4);
    scene.add.image(2900, this.groundTop - 90, 'pillar').setDepth(5);
    scene.add.image(2450, this.groundTop - 90, 'arch').setDepth(4).setAlpha(0.9);

    // foreground dead trees (angular bare branches)
    scene.add.image(430, this.groundTop - 100, 'tree1').setDepth(140).setAlpha(0.92);
    scene.add.image(1920, this.groundTop - 100, 'tree2').setDepth(140).setAlpha(0.92);
    scene.add.image(2780, this.groundTop - 100, 'tree1').setDepth(140).setAlpha(0.92).setFlipX(true);

    // bonfire at the start (checkpoint)
    this.buildBonfire(200, this.groundTop);

    // fog gate at the far end
    this.buildFogGate(3130);
  }

  buildBonfire(x, groundY) {
    const scene = this.scene;
    this.bonfire = { x, y: groundY };
    // coiled sword base
    const base = scene.add.graphics().setDepth(20);
    base.fillStyle(0x22222a, 1);
    base.fillEllipse(x, groundY - 4, 44, 10);
    base.fillStyle(0x555560, 1);
    base.fillRect(x - 2, groundY - 42, 4, 38);
    base.fillTriangle(x - 5, groundY - 42, x + 5, groundY - 42, x, groundY - 52);
    this.bonfireG = scene.add.graphics().setDepth(21);

    // rising embers
    scene.add.particles(x, groundY - 20, 'p-ember', {
      speedY: { min: -60, max: -20 },
      speedX: { min: -15, max: 15 },
      lifespan: 1400,
      alpha: { start: 0.9, end: 0 },
      scale: { start: 1, end: 0.2 },
      frequency: 120
    }).setDepth(22);
  }

  buildFogGate(x) {
    const scene = this.scene;
    // shimmering pale wall
    const wall = scene.add.rectangle(x, this.groundTop - 130, 26, 260, 0xe8e8f0, 0.14).setDepth(30);
    scene.tweens.add({ targets: wall, alpha: 0.28, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    scene.add.particles(x, 0, 'p-fog', {
      x: { min: -10, max: 10 },
      y: { min: this.groundTop - 250, max: this.groundTop },
      lifespan: 2200,
      speedY: { min: -30, max: -8 },
      alpha: { start: 0.35, end: 0 },
      scale: { min: 0.5, max: 1.4 },
      frequency: 70
    }).setDepth(31);

    this.fogGate = scene.add.zone(x, this.groundTop - 130, 40, 260);
    scene.physics.add.existing(this.fogGate, true);
  }

  /* ------------------------------------------------------------------ */
  /* Boss arena                                                          */
  /* ------------------------------------------------------------------ */

  buildArena() {
    const scene = this.scene;
    this.addGround(0, 1600);

    // massive ruined throne
    scene.add.image(800, 460, 'throne').setDepth(-70).setAlpha(0.9);
    scene.add.image(180, this.groundTop - 90, 'pillar').setDepth(5).setAngle(-3);
    scene.add.image(1420, this.groundTop - 90, 'pillar').setDepth(5).setFlipX(true).setAngle(5);

    // dark purple ambience + orange light from below
    scene.add.rectangle(640, 360, 1280, 720, 0x1a0a2e, 0.14).setScrollFactor(0).setDepth(-60);
    scene.add.rectangle(640, 680, 1280, 140, 0xff6a00, 0.05).setScrollFactor(0).setDepth(-59);

    // embers rising from the floor
    scene.add.particles(0, 0, 'p-ember', {
      x: { min: 0, max: 1600 },
      y: this.groundTop + 10,
      lifespan: 3000,
      speedY: { min: -55, max: -15 },
      speedX: { min: -10, max: 10 },
      alpha: { start: 0.6, end: 0 },
      scale: { min: 0.3, max: 0.9 },
      frequency: 90
    }).setDepth(-30);
  }

  /* ------------------------------------------------------------------ */
  /* Per-frame: flickering bonfire flame                                 */
  /* ------------------------------------------------------------------ */

  update(time) {
    if (!this.bonfireG || !this.bonfire) return;
    const { x, y } = this.bonfire;
    const g = this.bonfireG;
    const f = Math.sin(time / 90) * 3 + Math.sin(time / 41) * 2;
    g.clear();
    // glow
    g.fillStyle(0xc9a84c, 0.07 + Math.sin(time / 150) * 0.02);
    g.fillCircle(x, y - 22, 60 + f * 2);
    // layered flame triangles
    g.fillStyle(0xc9541e, 0.85);
    g.fillTriangle(x - 14, y - 4, x + 14, y - 4, x + f, y - 40 - f * 2);
    g.fillStyle(0xe8842a, 0.9);
    g.fillTriangle(x - 9, y - 4, x + 9, y - 4, x - f, y - 30 - f);
    g.fillStyle(0xf5c542, 0.95);
    g.fillTriangle(x - 5, y - 4, x + 5, y - 4, x + f * 0.5, y - 18 - f);
  }
}
