# 项目代码结构与规范

本文档用于说明当前项目结构、核心模块职责与代码规范，便于后续 AI 或开发者维护与扩展。

## 目录结构
```
.
├── index.html                 # 页面结构与资源挂载点
├── style.css                  # 全局样式与场景样式
├── js/
│   ├── gameState.js           # 游戏配置与状态管理（54行）
│   ├── audioManager.js        # 音频管理（157行）
│   ├── dialogue.js            # 对话系统（138行）
│   ├── sceneManager.js        # 场景管理（851行）
│   └── interactions.js        # 互动逻辑（822行）
├── data/
│   └── scenes.js              # 数据驱动配置（场景、交互、物品位置、音效、初始状态）
├── docs/
│   └── code-structure.md      # 本项目文档
├── assets/
│   ├── Audio/                 # 音效资源
│   └── Picture/               # 图片资源
└── script.js                  # 互动逻辑 + 初始化编排（持续拆分中）
```

## 模块职责

### 1) index.html
- 定义场景容器与互动节点（`.scene`、`.interactive-obj`、`.nav-btn`）。
- 挂载音频元素（`<audio>`），每个逻辑音效对应一个 `id`。
- 按顺序加载 JS（顺序即依赖关系）：
  1. `data/scenes.js` — 配置数据（无依赖）
  2. `js/gameState.js` — 游戏状态（依赖配置）
  3. `js/audioManager.js` — 音频（依赖配置 + 状态）
  4. `js/dialogue.js` — 对话 UI（依赖状态）
  5. `js/sceneManager.js` — 场景（依赖前四个模块）
  6. `js/interactions.js` — 互动逻辑（依赖以上全部）
  7. `script.js` — 初始化编排（依赖以上全部）

### 2) style.css
- 场景展示、互动框样式、转场效果与视觉状态（如 `.dimmed`、`.image-open`）。
- 仅包含样式，不包含逻辑。

### 3) data/scenes.js
- 数据驱动配置：
  - `startScene` / `introEndScene` / `initialState`
  - `audio` / `audioSources`
  - `imageSources` / `keyItems`
  - `scenes`：背景与进场对白（含 `backgroundAfter` 用于渐变替换）
  - `objectConfigs`：物品坐标与交互区域
  - `interactions`：交互文本，支持：
    - `texts`: 数组；`<auto>` 自动推进、`<stop>` 停止推进
    - `choiceText`: 选择框提示（如相框螺丝刀、冰箱开瓶器）

### 4) js/gameState.js
- 所有配置常量（`CONFIG`、`OBJECT_CONFIGS`、`INTERACTIONS`、`SCENE_CONFIGS` 等）。
- 核心游戏状态对象 `gameState`（flags、inventory、dialogueQueue 等）。
- 关键物品集合 `foundKeyItems` / `foundKeyItemIds` 与索引 `currentKeyItemIndex`。
- 系统参数：`DIALOGUE_SPEED`、`ENABLE_WAKE_EFFECT`、`ENABLE_INTRO_SCENE`。
- 对话标签常量：`AUTO_ADVANCE_TAG` / `STOP_ADVANCE_TAG`。
- 通关相关常量：`GIFT_BLUR_LEVELS`、`GIFT_CODE_PROMPT`、`GIFT_CODE_ANSWER`、`LIVINGROOM_FINAL_LINE`。

### 5) js/audioManager.js
- 音频元素引用（`var` 全局可见）。
- 工具函数：`playSfx()`、`ensureDetectiveBgm()`、`stopDetectiveBgm()`、`playFinalBgm()`。
- 音效序列：`playSojuOpeningSequence()`。
- 初始化：`cacheAudioElements()`（获取 DOM 引用）、`initAudio()`（配置音量/循环/静音按钮）。
- 导航音效：`initDoorAudioForNavButtons()`（开门声 + 延迟脚步声）。

### 5) js/dialogue.js
- 对话 UI 元素引用（`var` 全局可见）。
- 打字机效果：`showDialogue()`、`completeTypingImmediately()`、`closeDialogueBox()`。
- 选择弹窗：`showChoiceOverlay()` / `hideChoiceOverlay()`。
- 图片覆盖层：`openImageOverlay()` / `closeImageOverlay()`。
- 初始化：`cacheDialogueElements()`。

### 6) js/sceneManager.js
- 场景相关全局变量：`introPhase`、`finalLoopCleanup`、`startDot`、`introRippleLoader` 等。
- 场景切换：`goToScene()`（含场景音效开关、进场对白、背景应用、物品定位）。
- 背景系统：`applySceneBackground()`、`transitionSceneBackground()`。
- 布局定位：`maintainAspectRatio()`（16:9）、`updatePositions()`。
- Intro 流程：`setupIntroRippleStates()`、`handleStartDotClick()`、`revealIntroGift()`、`fadeOutIntroGift()`、`handleIntroComplete()`、`initIntroScene()`。
- 醒来效果：`startWakeEffect()`。
- 通关流程：`applyFinalVictory()`、`showGiftCodePrompt()`、`playFinalLoopPhotos()`、`buildFinalLoopPhotoList()`。
- 通关后检查：`checkLivingroomFinalBackground()`、`handleLivingroomFinalDialogue()`。
- UI 控制：`fadeInCoreUIControls()`、`swapHierarchy()`。
- 初始状态：`applyInitialState()`。

### 7) js/interactions.js
- 所有互动对象的点击处理函数（`handleVanityClick`、`handleDrawerClick`、`handleTvCabinetClick`、`handlePhotoFrameClick`、`handleDrawerCabinetClick`、`handleElectricPianoClick`、`handleFridgeDoorClick`）。
- 特殊流程：抽屉耳环（`queueDrawerEarringsReveal` / `completeDrawerEarringsFlow`）、相框螺丝刀（`queuePhotoFrameReveal` / `completePhotoFrameFlow`）。
- 物品系统：`markKeyItemFound()`、`updateInventory()`、`replayKeyItemById()`、`replayCurrentKeyItem()`。
- 收尾工具：`playDrawerCloseIfNeeded()`、`playPhotoFrameBgSwapIfNeeded()`、`playFridgeCloseIfNeeded()`。
- 对话回调与 UI 绑定：`onDialogueBoxClick()`、`closeOverlayAndDialogue()`、`initDialogueHandlers()`、`initUIControls()`、`initChoiceUI()`、`initInteractions()`。

### 8) script.js（初始化入口，196 行）
- UI 元素引用变量。
- 资源预加载：`collectImageUrls()` / `collectAudioUrls()` / `preloadAssets()`。
- 元素缓存：`cacheElements()`。
- 启动入口：`startGame()`（编排所有 `init*` 调用）。
- 加载进度：`updateLoadingProgress()` / `hideLoadingOverlay()`。
- DOMContentLoaded 入口（触发预加载 → 启动游戏 + 键盘快捷键）。

## 跨模块可见性

| 来源 | 在 script.js 中可见 | 在模块中可见 |
|------|---------------------|-------------|
| `var` / `function`（模块文件） | ✅ 全局作用域可见 | ✅ |
| `let` / `const`（script.js） | ✅ 自身可见 | ✅ 函数执行时可见（调用时已加载） |
| `gameState`（script.js 的 `const`） | ✅ | ✅（运行时已定义） |
| `CONFIG`、`SCENE_CONFIGS` 等 | ✅ `const` | ✅ |

## 配置约定

### 场景配置（`scenes`）
```js
scenes: {
  livingroom: {
    id: 'livingroom',
    background: {
      type: 'image',
      value: 'assets/Picture/room.png',
      size: 'contain',
      position: 'center',
      repeat: 'no-repeat'
    },
    backgroundAfter: 'assets/Picture/room_light.png',  // 渐变替换
    backgroundFinal: 'assets/Picture/room_giftBox.png', // 通关后背景
    onEnterDialogue: ['...', '...']
  }
}
```

### 物品位置（`objectConfigs`）
- `top` 与 `left` 为百分比字符串。
- `padding` 为百分比字符串（支持单值或双值）。

### 交互文本（`interactions`）
```js
{ id: 'photo-frame', choiceText: '是否使用"螺丝刀"？', texts: ['...', '...', '...'] }
// 支持 <auto>/<stop> 标记，choiceText 用于弹出选择框
```

### 音效配置（`audio`）
- key 与 `<audio id="...">` 对应。
- 支持字段：`volume`、`loop`、`autoplay`、`delayMs`（用于步行等延迟播放）。

### 关键物品与重播
- `keyItems` 由配置声明；发现时 `markKeyItemFound` 记录末尾台词与图片。
- 重播：
  - 物品栏点击：`replayCurrentKeyItem()` 重播当前选中物品。
  - 指定物品：`replayKeyItemById(id)`，用于相框完成后的固定重播。

## 代码规范（建议）

### 命名
- 常量使用全大写下划线：`ENABLE_DREAM_INTRO`。
- 配置对象为小驼峰：`objectConfigs`、`scenes`。
- DOM 元素变量保持语义清晰：`startDot`、`imageOverlay`。

### 模块化
- 逻辑按职责拆入 `js/` 下对应模块文件（gameState / audioManager / dialogue / sceneManager / interactions）。
- `script.js` 仅做初始化编排与资源预加载，不包含任何游戏业务逻辑。
- 新增互动内容时，优先通过 `data/scenes.js` 配置驱动；如需特殊逻辑，在 `js/interactions.js` 中添加 `handle*` 函数。

### 事件绑定
- 所有事件绑定集中在 `init*()` 函数中。
- 保持事件处理函数简洁，复杂逻辑拆成函数。

### 场景切换
- 统一使用 `goToScene(sceneId)`（定义在 sceneManager.js）。
- 在 `scenes` 中定义进场对白与背景，避免在脚本里硬编码。

### 音效播放
- 统一使用 `playSfx()`（定义在 audioManager.js）。
- 新音效必须在 HTML 中注册 `<audio>`，在配置中写明参数，并在 audioManager.js 中注册到 `cacheAudioElements()` 和 `initAudio()` 的 `audioMap` 中。

### 添加新的互动物品
1. 在 `data/scenes.js` 的 `interactions` 中定义文本。
2. 在 `objectConfigs` 中定义位置与点击区域。
3. 在 HTML 中添加 `<div id="..." class="interactive-obj">`。
4. 如需特殊逻辑，在 `script.js` 中添加 `handle*` 函数并在 `initInteractions()` 中注册。
5. 如需音效，在 HTML 注册 `<audio>` + 配置 + audioManager.js 注册。
6. 如需图片，在 `imageSources` 中添加 URL。

## 扩展建议
- 进度与剧情状态抽象为 `state.flags` 与 `state.visitedScenes`。
- 新增剧情脚本时，建议新增 `data/story.js` 以数据驱动流程。
- 如需多语言文本，可将 `interactions` 与 `onEnterDialogue` 提取为字典。
- 后续拆分建议：`gameState.js`（状态管理）、`interactions.js`（互动逻辑）。
