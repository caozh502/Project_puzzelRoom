// gameState.js —— 游戏配置与状态管理
// 所有常量、全局状态对象、关键物品集合
// 使用 const / let 在全局作用域声明，其他模块可直接引用

// --- 配置常量 ---
const CONFIG = window.GAME_CONFIG || {};
const OBJECT_CONFIGS = CONFIG.objectConfigs || {};
const INTERACTIONS = CONFIG.interactions || [];
const SCENE_CONFIGS = CONFIG.scenes || {};
const START_SCENE = CONFIG.startScene || 'intro';
const AUDIO_CONFIGS = CONFIG.audio || {};
const AUDIO_SOURCES = CONFIG.audioSources || {};
const INITIAL_STATE = CONFIG.initialState || {};
const INTRO_END_SCENE = CONFIG.introEndScene || 'bedroom';
const KEY_ITEMS = CONFIG.keyItems || [];
const LIVINGROOM_CONFIG = SCENE_CONFIGS['livingroom'] || {};

// 关键物品索引（全局唯一，由 markKeyItemFound 维护）
let currentKeyItemIndex = 0;

// --- 对话标签 ---
const AUTO_ADVANCE_TAG = '<auto>';
const STOP_ADVANCE_TAG = '<stop>';

// --- 图片与文本 ---
const IMAGE_SOURCES = CONFIG.imageSources || {};
const FALLBACK_DIALOGUE = '请在scenes添加对话';

// --- 关键物品收集 ---
const foundKeyItems = [];
const foundKeyItemIds = new Set();

// --- 游戏参数 ---
const DIALOGUE_SPEED = 40;
const ENABLE_WAKE_EFFECT = true;
const ENABLE_INTRO_SCENE = true;

// --- 核心游戏状态 ---
const gameState = {
    inventory: [],
    currentText: "",
    isTyping: false,
    dialogueQueue: [],
    justCompleted: false,
    flags: {},
    visitedScenes: {},
    interactionIndex: {}
};

// --- 礼物与通关常量 ---
const GIFT_BLUR_LEVELS = [12, 9, 6, 3, 0];
const GIFT_CODE_PROMPT = LIVINGROOM_CONFIG.giftCodePrompt;
const GIFT_CODE_ANSWER = LIVINGROOM_CONFIG.giftCodeAnswer;
const LIVINGROOM_FINAL_LINE = LIVINGROOM_CONFIG.finalLine;
