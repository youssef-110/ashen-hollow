# Ashen Hollow

A dark fantasy 2D action game built with [Phaser 3](https://phaser.io/), inspired by *Bloodborne* and *Elden Ring*.

## Running locally

This is a static site with no build step — just serve the directory and open it in a browser.

```bash
python -m http.server 8000
```

Then open http://localhost:8000

(Alternatively: `npx serve .`)

## Project structure

```
index.html
css/style.css
js/
  AssetLoader.js
  Combat.js
  Player.js
  Enemy.js
  Boss.js
  Level.js
  UI.js
  main.js
  Scenes/
    BootScene.js
    MainMenuScene.js
    GameScene.js
    BossScene.js
```
