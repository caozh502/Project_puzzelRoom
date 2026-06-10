// UI 元素引用
let muteBtn, hideBtn, lightSwitch, giftBox, bedroomDrawer, vanityTable, tvCabinet, photoFrame;
let fridgeNote, fridgeDoor;
let inventoryDisplay, inventoryTextEl, inventoryPrevBtn, inventoryNextBtn;
let loadingOverlay, progressFill, progressText;
let interactivesHidden = false;

// --- 资源预加载 ---
function collectImageUrls() {
    const set = new Set();
    Object.values(SCENE_CONFIGS).forEach(scene => {
        const bg = scene && scene.background;
        if (bg && bg.type === 'image' && bg.value) set.add(bg.value);
    });
    Object.values(IMAGE_SOURCES).forEach(url => set.add(url));
    return Array.from(set);
}

function collectAudioUrls() {
    return Object.values(AUDIO_SOURCES).filter(Boolean);
}

function preloadAssets(onProgress) {
    const imageUrls = collectImageUrls();
    const audioUrls = collectAudioUrls();
    const total = imageUrls.length + audioUrls.length;
    let loaded = 0;

    const notify = () => {
        if (typeof onProgress === 'function') onProgress(loaded, total);
    };

    const imgPromises = imageUrls.map(url => new Promise(resolve => {
        const img = new Image();
        img.onload = () => { loaded++; notify(); resolve(true); };
        img.onerror = () => { loaded++; notify(); resolve(false); };
        img.src = url;
    }));

    const audioPromises = audioUrls.map(url => new Promise(resolve => {
        const a = new Audio();
        a.preload = 'auto';
        const done = () => { loaded++; notify(); resolve(true); cleanup(); };
        const fail = () => { loaded++; notify(); resolve(false); cleanup(); };
        const cleanup = () => {
            a.removeEventListener('canplaythrough', done);
            a.removeEventListener('loadeddata', done);
            a.removeEventListener('loadedmetadata', done);
            a.removeEventListener('error', fail);
        };
        a.addEventListener('canplaythrough', done, { once: true });
        a.addEventListener('loadeddata', done, { once: true });
        a.addEventListener('loadedmetadata', done, { once: true });
        a.addEventListener('error', fail, { once: true });
        a.src = url;
        try { a.load(); } catch (_) {}
    }));

    notify();
    return Promise.all([...imgPromises, ...audioPromises]);
}

// --- 初始化模块 ---
function cacheElements() {
    cacheDialogueElements();
    cacheAudioElements();
    muteBtn = document.getElementById('mute-btn');
    hideBtn = document.getElementById('hide-btn');
    lightSwitch = document.getElementById('light-switch');
    startDot = document.getElementById('start-dot');
    introRippleLoader = document.querySelector('#scene-intro .ripple-loader');
    giftBox = document.getElementById('gift-box');
    fridgeNote = document.getElementById('fridge-note');
    fridgeDoor = document.getElementById('fridge-door');
    bedroomDrawer = document.getElementById('bedroom-drawer');
    vanityTable = document.getElementById('vanity-table');
    tvCabinet = document.getElementById('tv-cabinet');
    photoFrame = document.getElementById('photo-frame');
    loadingOverlay = document.getElementById('loading-overlay');
    progressFill = document.getElementById('progress-fill');
    progressText = document.getElementById('progress-text');
    inventoryDisplay = document.getElementById('inventory-display');
    inventoryTextEl = document.getElementById('inventory-text');
    inventoryPrevBtn = document.getElementById('inventory-prev');
    inventoryNextBtn = document.getElementById('inventory-next');
}

// --- 启动流程 ---
function startGame() {
    document.body.classList.add('ui-controls-hidden');
    applyInitialState();
    initPositions();
    initDialogueHandlers();
    initAudio();
    initUIControls();
    initChoiceUI();
    initInteractions();
    initDoorAudioForNavButtons();
    initIntroScene();
    updateInventory();
    checkLivingroomFinalBackground();
    updateGiftBoxState();
}

function updateLoadingProgress(loaded, total) {
    if (!progressFill || !progressText) return;
    const percent = total > 0 ? Math.round((loaded / total) * 100) : 0;
    progressFill.style.width = `${percent}%`;
    progressText.textContent = `${percent}%`;
    const progressEl = progressFill.parentElement;
    if (progressEl) progressEl.setAttribute('aria-valuenow', String(percent));
}

function hideLoadingOverlay() {
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
        loadingOverlay.setAttribute('aria-busy', 'false');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    cacheElements();
    preloadAssets(updateLoadingProgress).then(() => {
        hideLoadingOverlay();
        startGame();

        // 调试快捷键：Alt+Q 通关，ESC 退出照片循环
        window.addEventListener('keydown', (event) => {
            if (event.altKey && String(event.key).toLowerCase() === 'q') {
                event.preventDefault();
                applyFinalVictory();
            }
            if (event.key === 'Escape' && typeof finalLoopCleanup === 'function') {
                event.preventDefault();
                finalLoopCleanup();
            }
        });
    });
});
