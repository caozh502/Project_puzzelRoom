# 项目代码结构与规范

本文档用于说明当前项目结构、核心模块职责与代码规范，便于后续 AI 或开发者维护与扩展。

## 目录结构
```
.
├── index.html                 # 页面结构与资源挂载点
├── style.css                  # 全局样式与场景样式
├── script.js                  # 游戏主逻辑（初始化、场景、交互、音效、关键物品）
├── data/
│   └── scenes.js              # 数据驱动配置（场景、交互、物品位置、音效、初始状态）
└── assets/
    ├── Audio/                 # 音效资源
    └── Picture/               # 图片资源
```

## 模块职责

### 1) index.html
- 定义场景容器与互动节点（`.scene`、`.interactive-obj`、`.nav-btn`）。
- 挂载音频元素（`<audio>`）。
- 按顺序加载配置与主逻辑：先 `data/scenes.js`，再 `script.js`。

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

### 4) script.js
- 主逻辑入口：`DOMContentLoaded` → 预加载资源 → `startGame()`。
- 核心区域（已分段标注）：
  - 配置/状态：常量、`gameState`、关键物品收集
  - 工具：`playSfx`、`markKeyItemFound`、`transitionSceneBackground`、`swapHierarchy`
  - 资源预加载：`collectImageUrls` / `collectAudioUrls` / `preloadAssets`
  - 画面布局：`maintainAspectRatio`、`updatePositions`、`startWakeEffect`
  - 对话系统：`showDialogue`、`completeTypingImmediately`、`onDialogueBoxClick`
  - 场景导航：`goToScene`（含进场对白、淋浴音效开关）
  - 物品栏与重播：`updateInventory`、`replayKeyItemById`、`replayCurrentKeyItem`
  - 遮罩/选择框：`openImageOverlay`、`closeDialogueBox`、`showChoiceOverlay`
  - 序列音效/收尾：抽屉/相框背景替换、冰箱关门、开瓶序列
  - 特殊流程：梳妆台/抽屉耳环、电视柜/相框、冰箱/开瓶器、抽屉柜逻辑
  - 交互绑定：`initInteractions`（处理 auto/stop、循环、choiceText）
  - 初始化：元素缓存、位置、对话事件、音频、UI 控件、选择框、导航音效、开场场景

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
    }
  }
}
```

### 物品位置（`objectConfigs`）
- `top` 与 `left` 为百分比字符串。
- `padding` 为百分比字符串（支持单值或双值）。

### 交互文本（`interactions`）
```js
{ id: 'photo-frame', choiceText: '是否使用“螺丝刀”？', texts: ['...', '...', '...'] }
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
- 逻辑优先放在 `script.js`，数据放在 `data/scenes.js`。
- 新增互动内容时，优先通过配置驱动，不直接写死在脚本里。

### 事件绑定
- 所有事件绑定集中在初始化函数中（如 `initInteractions()`）。
- 保持事件处理函数简洁，复杂逻辑拆成函数。

### 场景切换
- 统一使用 `goToScene(sceneId)`。
- 在 `scenes` 中定义进场对白与背景，避免在脚本里硬编码。

### 音效播放
- 统一使用 `playSfx()`，避免重复写音效控制逻辑。
- 新音效必须在 HTML 中注册 `<audio>`，并在配置中写明参数。

## 扩展建议
- 进度与剧情状态抽象为 `state.flags` 与 `state.visitedScenes`。
- 新增剧情脚本时，建议新增 `data/story.js` 以数据驱动流程。
- 如需多语言文本，可将 `interactions` 与 `onEnterDialogue` 提取为字典。
