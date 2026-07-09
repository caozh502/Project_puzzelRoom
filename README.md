<p align="center">
  <a href="README.zh.md">[CN] Chinese</a>
  |
  <a href="README.md">[EN] English</a>
</p>

# Dream Echo

A dream-themed puzzle game built with vanilla JS. Explore a dream-like apartment, solve puzzles, and uncover the story.

[GitHub](https://github.com/caozh502/Project_puzzelRoom)

## About the Game

*Every step we take leaves an echo in time.*

Dream Echo is a dream-themed puzzle game. The player wakes up in a mysterious apartment and must explore, interact with objects, and solve puzzles to uncover the secrets hidden within the dream.

This is a story where the past, present, and future converge at a single point.

## Tech Stack

- **Vanilla JavaScript** - no frameworks
- **CSS** - custom animations, transitions, aspect-ratio layout
- **HTML5 Audio** - sound effects and background music
- **Data-driven** - scene config, interactions, and items defined in `data/scenes.js`

## File Structure

```
Project_puzzelRoom/
|-- index.html              # Page structure and asset mounting points
|-- style.css               # Global styles and scene styles
|-- script.js               # Init orchestration + asset preloading
|-- js/
|   |-- gameState.js        # Game config and state management
|   |-- audioManager.js     # Audio management
|   |-- dialogue.js         # Dialogue system (typewriter effect)
|   |-- sceneManager.js     # Scene management
|   +-- interactions.js     # Interaction logic
|-- data/
|   +-- scenes.js           # Data-driven config (scenes, items, audio)
|-- assets/
|   |-- Audio/              # Sound effects
|   +-- Picture/            # Images
+-- docs/
    +-- code-structure.md   # Detailed code structure docs
```

## How to Play

1. Open `index.html` in a browser
2. Click on interactive objects in the scene
3. Find key items to progress the story
4. Solve puzzles to reveal the dream's secret

## Development

See `docs/code-structure.md` for detailed module documentation and contribution guidelines.

### Adding a new interactive object
1. Define interaction text in `data/scenes.js` -> `interactions`
2. Define position in `objectConfigs`
3. Add `<div id="..." class="interactive-obj">` in HTML
4. For special logic: add `handle*` function in `js/interactions.js` and register in `initInteractions()`

---
_Dream Echo - [GitHub](https://github.com/caozh502/Project_puzzelRoom)_
