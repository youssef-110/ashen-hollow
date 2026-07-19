/**
 * Ashen Hollow — AssetLoader: all procedural asset generation (textures + audio)
 * Dark fantasy action game inspired by Bloodborne and Elden Ring
 * Author: Youssef | github.com/youssef-880
 */

class AssetLoader {

  /** Generate every texture the game uses. Called once from BootScene. */
  static generateAll(scene) {
    AssetLoader.makePlayer(scene);
    AssetLoader.makeEnemies(scene);
    AssetLoader.makeBoss(scene);
    AssetLoader.makeWorld(scene);
    AssetLoader.makeParticles(scene);
    AssetLoader.makeUI(scene);
    AssetLoader.makeVignettes(scene);
  }

  /* ------------------------------------------------------------------ */
  /* The Hunter                                                          */
  /* ------------------------------------------------------------------ */

  static makePlayer(scene) {
    // Standing hunter: pale silver figure with gold trim.
    let g = scene.add.graphics();
    // hood / head
    g.fillStyle(0xe8e8e8, 1);
    g.fillTriangle(18, 0, 8, 14, 28, 14);
    g.fillStyle(0x111111, 1);
    g.fillRect(13, 8, 10, 5); // shadowed face
    // torso (coat)
    g.fillStyle(0xe8e8e8, 1);
    g.fillRect(10, 14, 16, 20);
    g.fillTriangle(10, 34, 26, 34, 18, 46); // coat tail
    // gold belt + trim
    g.fillStyle(0xc9a84c, 1);
    g.fillRect(10, 26, 16, 3);
    g.fillRect(10, 14, 2, 20);
    g.fillRect(24, 14, 2, 20);
    // legs
    g.fillStyle(0xcfcfcf, 1);
    g.fillRect(12, 34, 5, 13);
    g.fillRect(20, 34, 5, 13);
    g.generateTexture('player', 36, 48);
    g.destroy();

    // Rolling hunter: tucked ball form.
    g = scene.add.graphics();
    g.fillStyle(0xe8e8e8, 1);
    g.fillCircle(18, 24, 14);
    g.fillStyle(0xc9a84c, 1);
    g.lineStyle(3, 0xc9a84c, 1);
    g.strokeCircle(18, 24, 14);
    g.fillStyle(0x111111, 1);
    g.fillCircle(18, 24, 6);
    g.generateTexture('player-roll', 36, 48);
    g.destroy();
  }

  /* ------------------------------------------------------------------ */
  /* Hollow Remnants (each has a calm + alerted variant for eye glow)    */
  /* ------------------------------------------------------------------ */

  static makeEnemies(scene) {
    const eyeColors = { calm: 0x661111, alert: 0xff2222 };

    ['calm', 'alert'].forEach(state => {
      const eye = eyeColors[state];

      // Shambler — hunched humanoid
      let g = scene.add.graphics();
      g.fillStyle(0x3a3a3a, 1);
      g.fillEllipse(20, 20, 26, 24);            // hunched back
      g.fillRect(10, 22, 20, 14);               // body
      g.fillStyle(0x2c2c2c, 1);
      g.fillCircle(11, 14, 7);                  // drooped head
      g.fillRect(10, 34, 6, 10);                // legs
      g.fillRect(22, 34, 6, 10);
      g.fillRect(4, 22, 5, 14);                 // dragging arm
      g.fillStyle(eye, 1);
      g.fillCircle(8, 13, 2);
      g.fillCircle(13, 13, 2);
      g.generateTexture('shambler-' + state, 38, 44);
      g.destroy();

      // Wraith — wispy, partially transparent form
      g = scene.add.graphics();
      g.fillStyle(0x222230, 0.75);
      g.fillTriangle(16, 0, 2, 34, 30, 34);
      g.fillStyle(0x15151f, 0.75);
      g.fillTriangle(4, 34, 12, 34, 6, 42);     // tattered hem
      g.fillTriangle(13, 34, 21, 34, 17, 44);
      g.fillTriangle(22, 34, 29, 34, 27, 41);
      g.fillStyle(eye, 1);
      g.fillCircle(12, 12, 2);
      g.fillCircle(20, 12, 2);
      g.generateTexture('wraith-' + state, 32, 44);
      g.destroy();

      // Watcher — tall thin figure with glowing red hand
      g = scene.add.graphics();
      g.fillStyle(0x26262e, 1);
      g.fillRect(8, 8, 10, 42);                 // thin body
      g.fillTriangle(13, 0, 6, 12, 20, 12);     // hooded head
      g.fillRect(4, 50, 8, 6);                  // feet
      g.fillRect(14, 50, 8, 6);
      g.fillRect(18, 18, 5, 16);                // raised arm
      g.fillStyle(0xcc0000, state === 'alert' ? 1 : 0.5);
      g.fillCircle(21, 16, 4);                  // glowing hand
      g.fillStyle(eye, 1);
      g.fillCircle(10, 8, 1.6);
      g.fillCircle(15, 8, 1.6);
      g.generateTexture('watcher-' + state, 26, 56);
      g.destroy();
    });
  }

  /* ------------------------------------------------------------------ */
  /* Malachar, The Ashen King                                            */
  /* ------------------------------------------------------------------ */

  static makeBoss(scene) {
    const draw = (key, cracked) => {
      const g = scene.add.graphics();
      // massive body
      g.fillStyle(0x1a0a2e, 1);
      g.fillRect(40, 44, 60, 96);
      g.fillTriangle(40, 140, 100, 140, 70, 176); // ragged lower body
      g.fillRect(46, 140, 16, 36);                // legs
      g.fillRect(78, 140, 16, 36);
      // shoulders
      g.fillStyle(0x12071f, 1);
      g.fillTriangle(40, 44, 14, 70, 40, 92);
      g.fillTriangle(100, 44, 126, 70, 100, 92);
      // head
      g.fillStyle(0x1a0a2e, 1);
      g.fillRect(56, 20, 28, 28);
      // crown of twisted horns
      g.fillStyle(0x0d0518, 1);
      g.fillTriangle(56, 22, 44, 0, 60, 18);
      g.fillTriangle(66, 20, 66, 0, 74, 18);
      g.fillTriangle(84, 22, 96, 0, 80, 18);
      // glowing orange eyes
      g.fillStyle(0xff6a00, 1);
      g.fillCircle(64, 34, 3);
      g.fillCircle(76, 34, 3);
      // chest cavity (heart glow drawn as separate pulsing sprite)
      g.fillStyle(0x000000, 1);
      g.fillCircle(70, 78, 13);
      // great blade at side
      g.fillStyle(0x0d0d12, 1);
      g.fillRect(106, 60, 10, 110);
      g.fillTriangle(106, 60, 116, 60, 111, 40);
      g.fillStyle(0xc9a84c, 1);
      g.fillRect(103, 108, 16, 4);
      if (cracked) {
        // Phase 2: orange power bleeding through fissures
        g.lineStyle(2, 0xff6a00, 0.9);
        g.beginPath();
        g.moveTo(58, 52); g.lineTo(66, 66); g.lineTo(60, 84); g.lineTo(68, 102);
        g.moveTo(88, 50); g.lineTo(80, 70); g.lineTo(90, 92); g.lineTo(82, 118);
        g.moveTo(50, 100); g.lineTo(60, 116); g.lineTo(52, 132);
        g.strokePath();
      }
      g.generateTexture(key, 140, 180);
      g.destroy();
    };
    draw('boss', false);
    draw('boss-p2', true);

    // pulsing heart
    let g = scene.add.graphics();
    g.fillStyle(0xff3300, 1);
    g.fillCircle(10, 10, 6);
    g.fillStyle(0xff9944, 1);
    g.fillCircle(10, 10, 3);
    g.generateTexture('boss-heart', 20, 20);
    g.destroy();

    // travelling shockwave
    g = scene.add.graphics();
    g.fillStyle(0xff6a00, 0.9);
    g.fillTriangle(0, 26, 24, 0, 48, 26);
    g.fillStyle(0xffc46a, 0.9);
    g.fillTriangle(10, 26, 24, 8, 38, 26);
    g.generateTexture('shockwave', 48, 28);
    g.destroy();

    // ruined throne backdrop
    g = scene.add.graphics();
    g.fillStyle(0x0d0716, 1);
    g.fillRect(60, 120, 200, 240);
    g.fillRect(20, 200, 50, 160);
    g.fillRect(250, 180, 50, 180);
    g.fillTriangle(60, 120, 160, 0, 260, 120);   // broken spire
    g.fillStyle(0x120a20, 1);
    g.fillRect(90, 180, 140, 180);
    g.fillTriangle(250, 180, 300, 180, 300, 120); // shattered edge
    g.generateTexture('throne', 320, 400);
    g.destroy();
  }

  /* ------------------------------------------------------------------ */
  /* World: stone, trees, cathedral                                      */
  /* ------------------------------------------------------------------ */

  static makeWorld(scene) {
    // Ground stone
    let g = scene.add.graphics();
    g.fillStyle(0x1b1b1f, 1);
    g.fillRect(0, 0, 64, 64);
    g.fillStyle(0x232329, 1);
    g.fillRect(0, 0, 64, 6);
    g.lineStyle(1, 0x2a2a30, 1);
    g.strokeRect(2, 10, 28, 16);
    g.strokeRect(34, 10, 28, 16);
    g.strokeRect(18, 30, 28, 16);
    g.strokeRect(2, 48, 28, 14);
    g.strokeRect(34, 48, 28, 14);
    g.generateTexture('ground', 64, 64);
    g.destroy();

    // Floating platform stone
    g = scene.add.graphics();
    g.fillStyle(0x1b1b1f, 1);
    g.fillRect(0, 0, 64, 24);
    g.fillStyle(0x2a2a32, 1);
    g.fillRect(0, 0, 64, 4);
    g.lineStyle(1, 0x2a2a30, 1);
    g.strokeRect(3, 8, 26, 12);
    g.strokeRect(34, 8, 26, 12);
    g.generateTexture('platform', 64, 24);
    g.destroy();

    // Crumbling platform (paler, cracked)
    g = scene.add.graphics();
    g.fillStyle(0x2a2a2e, 1);
    g.fillRect(0, 0, 64, 20);
    g.fillStyle(0x38383e, 1);
    g.fillRect(0, 0, 64, 3);
    g.lineStyle(1, 0x4a4a50, 0.9);
    g.beginPath();
    g.moveTo(10, 3); g.lineTo(18, 12); g.lineTo(12, 20);
    g.moveTo(40, 3); g.lineTo(34, 10); g.lineTo(44, 20);
    g.moveTo(54, 3); g.lineTo(58, 14);
    g.strokePath();
    g.generateTexture('crumble', 64, 20);
    g.destroy();

    // Ruined pillar
    g = scene.add.graphics();
    g.fillStyle(0x141418, 1);
    g.fillRect(6, 20, 28, 160);
    g.fillRect(0, 0, 40, 14);
    g.fillTriangle(6, 20, 34, 20, 20, 34); // broken top
    g.lineStyle(1, 0x1f1f26, 1);
    g.lineBetween(12, 20, 12, 180);
    g.lineBetween(20, 20, 20, 180);
    g.lineBetween(28, 20, 28, 180);
    g.generateTexture('pillar', 40, 180);
    g.destroy();

    // Broken arch
    g = scene.add.graphics();
    g.fillStyle(0x121216, 1);
    g.fillRect(0, 40, 24, 140);
    g.fillRect(156, 60, 24, 120);
    g.fillTriangle(0, 40, 24, 40, 70, 0);
    g.fillTriangle(156, 60, 180, 60, 120, 14);
    g.generateTexture('arch', 180, 180);
    g.destroy();

    // Dead trees (two angular variants)
    const tree = (key, seed) => {
      const gr = scene.add.graphics();
      gr.lineStyle(5, 0x0c0c10, 1);
      gr.lineBetween(60, 200, 60 + seed * 6, 90);
      gr.lineStyle(3, 0x0c0c10, 1);
      gr.lineBetween(60 + seed * 6, 90, 30, 50);
      gr.lineBetween(60 + seed * 6, 90, 95, 40 + seed * 8);
      gr.lineBetween(60 + seed * 3, 140, 20 + seed * 5, 100);
      gr.lineStyle(2, 0x0c0c10, 1);
      gr.lineBetween(30, 50, 12, 30);
      gr.lineBetween(30, 50, 44, 22);
      gr.lineBetween(95, 40 + seed * 8, 112, 18);
      gr.lineBetween(95, 40 + seed * 8, 82, 12);
      gr.generateTexture(key, 120, 200);
      gr.destroy();
    };
    tree('tree1', 1);
    tree('tree2', -1);

    // Distant ruined cathedral silhouette
    g = scene.add.graphics();
    g.fillStyle(0x0d0d16, 1);
    g.fillRect(80, 200, 640, 200);
    g.fillRect(140, 120, 90, 280);
    g.fillTriangle(140, 120, 230, 120, 185, 30);   // spire
    g.fillRect(360, 90, 80, 310);
    g.fillTriangle(360, 90, 440, 90, 400, 0);      // tallest spire
    g.fillRect(560, 150, 70, 250);
    g.fillTriangle(560, 150, 630, 150, 610, 70);   // broken spire
    g.fillRect(280, 170, 60, 230);
    g.fillStyle(0x050510, 1);
    g.fillCircle(400, 180, 26);                    // rose window (dark)
    g.generateTexture('cathedral', 800, 400);
    g.destroy();

    // Watcher's dark orb
    g = scene.add.graphics();
    g.fillStyle(0xcc0000, 0.35);
    g.fillCircle(9, 9, 9);
    g.fillStyle(0x0a0a12, 1);
    g.fillCircle(9, 9, 6);
    g.fillStyle(0xcc0000, 0.9);
    g.fillCircle(9, 9, 2.5);
    g.generateTexture('orb', 18, 18);
    g.destroy();

    // Blood vial pickup
    g = scene.add.graphics();
    g.fillStyle(0xc9a84c, 1);
    g.fillRect(5, 0, 8, 4);
    g.fillStyle(0x35060a, 1);
    g.fillRect(4, 4, 10, 16);
    g.fillStyle(0x8b0000, 1);
    g.fillRect(5, 8, 8, 11);
    g.fillStyle(0xff4444, 0.6);
    g.fillRect(6, 9, 2, 9);
    g.generateTexture('vial', 18, 22);
    g.destroy();
  }

  /* ------------------------------------------------------------------ */
  /* Particles                                                           */
  /* ------------------------------------------------------------------ */

  static makeParticles(scene) {
    const dot = (key, color, r, alpha = 1) => {
      const g = scene.add.graphics();
      g.fillStyle(color, alpha);
      g.fillCircle(r, r, r);
      g.generateTexture(key, r * 2, r * 2);
      g.destroy();
    };
    dot('p-ash', 0xd8d8d8, 2);
    dot('p-white', 0xffffff, 3);
    dot('p-gold', 0xc9a84c, 3);
    dot('p-blood', 0xa00000, 3);
    dot('p-ember', 0xff8830, 2);
    dot('p-dark', 0x15151f, 4);
    dot('p-fog', 0xe8e8f0, 8, 0.35);
  }

  /* ------------------------------------------------------------------ */
  /* UI icons                                                            */
  /* ------------------------------------------------------------------ */

  static makeUI(scene) {
    // Blade icon
    let g = scene.add.graphics();
    g.fillStyle(0xe8e8e8, 1);
    g.fillTriangle(14, 0, 10, 20, 18, 20);
    g.fillStyle(0xc9a84c, 1);
    g.fillRect(7, 20, 14, 3);
    g.fillRect(12, 23, 4, 6);
    g.generateTexture('icon-blade', 28, 30);
    g.destroy();

    // Scythe icon
    g = scene.add.graphics();
    g.lineStyle(3, 0xe8e8e8, 1);
    g.beginPath();
    g.arc(12, 10, 10, Phaser.Math.DegToRad(-80), Phaser.Math.DegToRad(90), false);
    g.strokePath();
    g.lineStyle(3, 0xc9a84c, 1);
    g.lineBetween(12, 6, 12, 29);
    g.generateTexture('icon-scythe', 28, 30);
    g.destroy();

    // Plain white pixel for tints/overlays
    g = scene.add.graphics();
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, 2, 2);
    g.generateTexture('pixel', 2, 2);
    g.destroy();
  }

  /* ------------------------------------------------------------------ */
  /* Vignettes (canvas radial gradients)                                 */
  /* ------------------------------------------------------------------ */

  static makeVignettes(scene) {
    const make = (key, rgb) => {
      if (scene.textures.exists(key)) return;
      const c = scene.textures.createCanvas(key, 1280, 720);
      const ctx = c.getContext();
      const grad = ctx.createRadialGradient(640, 360, 280, 640, 360, 760);
      grad.addColorStop(0, 'rgba(' + rgb + ',0)');
      grad.addColorStop(1, 'rgba(' + rgb + ',0.8)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1280, 720);
      c.refresh();
    };
    make('vignette', '5,5,16');
    make('vignette-red', '120,0,0');
  }
}

/* ==================================================================== */
/* Web Audio — all sound generated programmatically, no external files  */
/* ==================================================================== */

class SoundSystem {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.heartbeatId = null;
    this.bonfireId = null;
  }

  init() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.3;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  ready() { return this.ctx && this.ctx.state === 'running'; }

  /** Simple enveloped oscillator. */
  tone(freq, dur, opts = {}) {
    if (!this.ready()) return;
    const { type = 'sine', vol = 0.2, slide = 0, delay = 0, filterFreq = 0 } = opts;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slide) osc.frequency.linearRampToValueAtTime(Math.max(20, freq + slide), t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    let node = osc;
    if (filterFreq) {
      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = filterFreq;
      osc.connect(f);
      node = f;
    }
    node.connect(gain);
    gain.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  /** Filtered white noise burst. */
  noise(dur, opts = {}) {
    if (!this.ready()) return;
    const { vol = 0.15, filterFreq = 2000, filterType = 'lowpass', delay = 0 } = opts;
    const t0 = this.ctx.currentTime + delay;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = filterFreq;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter); filter.connect(gain); gain.connect(this.master);
    src.start(t0);
  }

  /* --- game events -------------------------------------------------- */

  attackLight() { this.noise(0.09, { vol: 0.12, filterFreq: 4200, filterType: 'highpass' }); }
  attackHeavy() {
    this.noise(0.16, { vol: 0.16, filterFreq: 2600, filterType: 'highpass' });
    this.tone(90, 0.18, { type: 'triangle', vol: 0.18, slide: -40 });
  }
  transform() {
    this.tone(500, 0.2, { type: 'triangle', vol: 0.1, slide: 400 });
    this.noise(0.15, { vol: 0.08, filterFreq: 5000, filterType: 'highpass', delay: 0.05 });
  }
  roll() { this.noise(0.14, { vol: 0.08, filterFreq: 900 }); }
  playerHit() {
    this.tone(140, 0.22, { type: 'square', vol: 0.14, slide: -80, filterFreq: 800 });
    this.noise(0.1, { vol: 0.1, filterFreq: 600 });
  }
  enemyHit() { this.tone(220, 0.08, { type: 'square', vol: 0.09, slide: -100, filterFreq: 1200 }); }
  enemyDeath() {
    this.noise(0.3, { vol: 0.16, filterFreq: 500 });
    this.tone(80, 0.35, { type: 'sawtooth', vol: 0.1, slide: -50, filterFreq: 400 });
  }
  heal() { this.tone(300, 0.5, { type: 'sine', vol: 0.1, slide: 120 }); }
  bossRoar() {
    this.tone(55, 1.4, { type: 'sawtooth', vol: 0.25, slide: -15, filterFreq: 320 });
    this.tone(82, 1.4, { type: 'sawtooth', vol: 0.15, slide: -20, filterFreq: 300 });
    this.tone(110, 1.1, { type: 'square', vol: 0.07, slide: -30, filterFreq: 260, delay: 0.1 });
    this.noise(1.0, { vol: 0.1, filterFreq: 240 });
  }
  bossImpact() {
    this.tone(60, 0.4, { type: 'triangle', vol: 0.28, slide: -25 });
    this.noise(0.25, { vol: 0.18, filterFreq: 700 });
  }
  death() { this.tone(110, 2.8, { type: 'sawtooth', vol: 0.14, slide: -70, filterFreq: 260 }); }
  victory() {
    [262, 330, 392, 523, 659].forEach((f, i) =>
      this.tone(f, 0.7, { type: 'triangle', vol: 0.1, delay: i * 0.22 }));
  }

  startHeartbeat() {
    if (this.heartbeatId || !this.ctx) return;
    this.heartbeatId = setInterval(() => {
      this.tone(52, 0.14, { type: 'sine', vol: 0.22 });
      this.tone(48, 0.12, { type: 'sine', vol: 0.16, delay: 0.18 });
    }, 950);
  }
  stopHeartbeat() {
    if (this.heartbeatId) { clearInterval(this.heartbeatId); this.heartbeatId = null; }
  }

  startBonfire() {
    if (this.bonfireId || !this.ctx) return;
    this.bonfireId = setInterval(() => {
      if (Math.random() < 0.7)
        this.noise(0.05 + Math.random() * 0.06, { vol: 0.03, filterFreq: 1200 + Math.random() * 2000 });
    }, 220);
  }
  stopBonfire() {
    if (this.bonfireId) { clearInterval(this.bonfireId); this.bonfireId = null; }
  }

  stopAllLoops() { this.stopHeartbeat(); this.stopBonfire(); }
}

const SFX = new SoundSystem();
