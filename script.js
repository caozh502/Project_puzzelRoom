// 这是一个点击式解谜游戏，通过显示/隐藏 .scene 类来切换房间，通过 showDialogue 函数显示对话。
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
let currentKeyItemIndex = 0;

// 对话标签：在文本中加入此标记，可在单次触发后通过对话框点击继续播放后续行
const AUTO_ADVANCE_TAG = '<auto>';

// 统一图片资源映射（从配置中获取）
const IMAGE_SOURCES = CONFIG.imageSources || {};

// 统一兜底文本
const FALLBACK_DIALOGUE = '请在scenes添加对话';

// 关键物品收集（暴露全局变量名“找到的关键物品”）
// 存储结构：{ id, name }
const foundKeyItems = [];
const foundKeyItemIds = new Set();

const DIALOGUE_SPEED = 40;
// 调试开关：禁用醒来效果（眨眼+去模糊）
const ENABLE_WAKE_EFFECT = false;
// 调试开关：跳过 intro 场景
const ENABLE_INTRO_SCENE = false;

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

// 记录打字计时器以便可取消
let typingTimer = null;
let nextTipTimer = null;

// 引导阶段标记与全局元素引用
let introPhase = true;
let imageOverlay, overlayImage, startDot;
// 音频变量
let detectiveBGM, clickSfx, lightSfx, startDotSfx, wakeUpSfx, doorOpenSfx, footStepsSfx;
let guitarSfx, violinSfx, pianoSfx, showerSfx, drawerCloseSfx, drillScrewSfx;
// 其他UI变量
let muteBtn, hideBtn, lightSwitch, giftBox, bedroomDrawer, vanityTable, tvCabinet, photoFrame;
let choiceOverlay, choiceTextEl, choiceYesBtn, choiceNoBtn;
let choiceHandlers = null;
let inventoryTextEl, inventoryPrevBtn, inventoryNextBtn;
// 加载覆盖层元素
let loadingOverlay, progressFill, progressText;
let isMuted = false;
let interactivesHidden = false;
let diagBox, diagText;

// --- 工具方法 ---
function playSfx(audio) {
    if (!audio || isMuted) return;
    audio.currentTime = 0;
    audio.play();
}

function applyInitialState() {
    if (Array.isArray(INITIAL_STATE.inventory)) {
        gameState.inventory = [...INITIAL_STATE.inventory];
    }
    if (INITIAL_STATE.flags && typeof INITIAL_STATE.flags === 'object') {
        gameState.flags = { ...INITIAL_STATE.flags };
    }
    if (INITIAL_STATE.visitedScenes && typeof INITIAL_STATE.visitedScenes === 'object') {
        gameState.visitedScenes = { ...INITIAL_STATE.visitedScenes };
    }
}

function markKeyItemFound(id, payload = {}) {
    if (!id || foundKeyItemIds.has(id)) return;
    const item = KEY_ITEMS.find(k => k.id === id);
    if (!item) return;

    // 优先使用传入的行和图片；否则从交互配置推导
    let line = payload.line;
    let image = payload.image;
    if (!line || !image) {
        const interaction = INTERACTIONS.find(i => i.id === id);
        const texts = interaction && Array.isArray(interaction.texts) ? interaction.texts : [];
        if (!line && texts.length > 0) {
            line = texts[texts.length - 1];
        }
        if (!image) {
            image = IMAGE_SOURCES[id];
        }
    }


    foundKeyItemIds.add(id);
    foundKeyItems.push({ id, name: item.name || id, line, image });
    currentKeyItemIndex = Math.max(foundKeyItems.length - 1, 0);
    updateInventory();
}

function applySceneBackground(sceneId, target) {
    if (!target) return;
    const sceneConfig = SCENE_CONFIGS[sceneId];
    const background = sceneConfig ? sceneConfig.background : null;
    if (!background) return;

    if (background.type === 'image') {
        target.style.backgroundImage = `url('${background.value}')`;
        target.style.backgroundSize = background.size || 'contain';
        target.style.backgroundPosition = background.position || 'center';
        target.style.backgroundRepeat = background.repeat || 'no-repeat';
    } else if (background.type === 'color') {
        target.style.backgroundImage = '';
        target.style.backgroundColor = background.value || '';
    }
}

function transitionSceneBackground(sceneId, newBgUrl, duration = 1000) {
    const sceneEl = document.getElementById(`scene-${sceneId}`);
    const sceneCfg = SCENE_CONFIGS[sceneId];
    
    if (!sceneCfg || !sceneCfg.background) return;

    // 如果场景元素不存在，直接更新配置
    if (!sceneEl) {
        sceneCfg.background.value = newBgUrl;
        return;
    }

    const bgCfg = sceneCfg.background;
    const transitionLayer = document.createElement('div');
    transitionLayer.style.position = 'absolute';
    transitionLayer.style.top = '0';
    transitionLayer.style.left = '0';
    transitionLayer.style.width = '100%';
    transitionLayer.style.height = '100%';
    transitionLayer.style.backgroundImage = `url('${newBgUrl}')`;
    transitionLayer.style.backgroundSize = bgCfg.size || 'contain';
    transitionLayer.style.backgroundPosition = bgCfg.position || 'center';
    transitionLayer.style.backgroundRepeat = bgCfg.repeat || 'no-repeat';
    transitionLayer.style.opacity = '0';
    transitionLayer.style.transition = `opacity ${duration}ms ease`;
    transitionLayer.style.zIndex = '0';
    
    sceneEl.insertBefore(transitionLayer, sceneEl.firstChild);
    
    // 强制重绘以触发transition
    void transitionLayer.offsetWidth;
    
    transitionLayer.style.opacity = '1';
    
    setTimeout(() => {
        sceneCfg.background.value = newBgUrl;
        applySceneBackground(sceneId, sceneEl);
        transitionLayer.remove();
    }, duration);
}

// --- 资源预加载 ---
function collectImageUrls() {
    const set = new Set();
    // 场景背景
    Object.values(SCENE_CONFIGS).forEach(scene => {
        const bg = scene && scene.background;
        if (bg && bg.type === 'image' && bg.value) set.add(bg.value);
    });
    // 交互图片与其他图片
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
        // 某些浏览器在 file: 协议下需要显式加载
        try { a.load(); } catch (_) {}
    }));

    notify();
    return Promise.all([...imgPromises, ...audioPromises]);
}

// --- 醒来效果封装 ---
function startWakeEffect(container, overlay, onUnblurEnd) {
    if (!container || !overlay) return;
    const activeScene = container.querySelector('.scene.active');
    // 显示覆盖层并启动眨眼动画
    overlay.classList.remove('hidden');
    overlay.classList.add('wake-blink');
    container.classList.add('dimmed');
    container.classList.add('waking');
    // 覆盖层动画结束后移除自身
    overlay.addEventListener('animationend', () => {
        overlay.remove();
    }, { once: true });
    // 去模糊动画结束后移除 waking 并触发回调
    const onWakeUnblurEnd = (e) => {
        if (e.animationName === 'wakeUnblur') {
            container.classList.remove('waking');
            if (typeof onUnblurEnd === 'function') onUnblurEnd();
        }
    };

    if (activeScene) {
        activeScene.addEventListener('animationend', onWakeUnblurEnd, { once: true });
    } else {
        container.addEventListener('animationend', onWakeUnblurEnd, { once: true });
    }
}

function maintainAspectRatio() {
    const container = document.getElementById('game-container');
    if (!container) return;

    const targetRatio = 16 / 9;
    const winW = window.innerWidth;
    const winH = window.innerHeight;
    const winRatio = winW / winH;

    let w, h;
    if (winRatio > targetRatio) {
        h = winH;
        w = h * targetRatio;
    } else {
        w = winW;
        h = w / targetRatio;
    }

    container.style.width = `${w}px`;
    container.style.height = `${h}px`;
    container.style.position = 'absolute';
    container.style.top = '50%';
    container.style.left = '50%';
    container.style.transform = 'translate(-50%, -50%)';
}

function updatePositions() {
    // 删除之前的调试信息
    document.querySelectorAll('.debug-info').forEach(d => d.remove());

    // 获取当前激活的场景
    const currentScene = document.querySelector('.scene.active');
    if (!currentScene) return;

    // 以容器为基准进行定位（背景铺满）
    const container = document.getElementById('game-container');
    if (!container) return;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // 应用位置
    Object.keys(OBJECT_CONFIGS).forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;

        const config = OBJECT_CONFIGS[id];
        const topPercent = parseFloat(config.top) / 100;
        const leftPercent = parseFloat(config.left) / 100;
        const newTop = topPercent * containerHeight;
        const newLeft = leftPercent * containerWidth;
        el.style.top = `${topPercent * 100}%`;
        el.style.left = `${leftPercent * 100}%`;

        // 应用旋转（如有配置），保持居中位移
        const rotation = config.rotation;
        const transformParts = ['translate(-50%, -50%)'];
        if (rotation !== undefined && rotation !== null && rotation !== '') {
            const rot = typeof rotation === 'number' ? `${rotation}deg` : `${rotation}`;
            transformParts.push(`rotate(${rot})`);
        }
        el.style.transform = transformParts.join(' ');

        // 解析padding: 'top% right%' -> top/bottom: top% of 容器高度, left/right: right% of 容器宽度
        const paddingParts = config.padding.split(' ');
        const paddingTopPercent = parseFloat(paddingParts[0]) / 100;
        const paddingRightPercent = parseFloat(paddingParts[1] || paddingParts[0]) / 100;
        const paddingTop = paddingTopPercent * containerHeight;
        const paddingRight = paddingRightPercent * containerWidth;
        el.style.padding = config.padding;

        const isHint = el.classList.contains('nav-hint');
        if (!isHint) {
            // 将原文本转移到调试信息：保存在 data-originalText，清空元素内部文本
            const originalLabel = el.dataset.originalText || el.textContent.split('\n')[0];
            el.dataset.originalText = originalLabel;
            el.textContent = '';
            el.setAttribute('aria-label', originalLabel);

            // 仅为当前场景的物品添加调试信息
            if (el.closest('.scene') === currentScene) {
                const debugInfo = document.createElement('div');
                debugInfo.className = 'debug-info';
                debugInfo.innerHTML = `<small>@${originalLabel}</small>`;
                debugInfo.style.top = `${newTop}px`; // 与物品顶部对齐
                debugInfo.style.left = `${newLeft + el.offsetWidth / 2 + 5}px`; // 在物品视觉右侧5px
                container.appendChild(debugInfo);
            }
        }
    });
}

// --- 对话系统 ---
function showDialogue(text) {
    if (!diagBox || !diagText) return;

    if (nextTipTimer) {
        clearTimeout(nextTipTimer);
        nextTipTimer = null;
    }
    diagBox.classList.remove('show-next');

    // 若正在打字，则将新文本加入队列，等待当前对话结束或点击继续
    if (gameState.isTyping) {
        gameState.dialogueQueue.push(text);
        return;
    }

    diagBox.classList.remove('hidden');
    gameState.isTyping = true;
    gameState.currentText = text;
    diagText.innerText = "";

    let i = 0;

    function type() {
        // 若已被点击完成，则终止打字
        if (!gameState.isTyping) return;
        if (i < gameState.currentText.length) {
            diagText.innerText += gameState.currentText.charAt(i);
            i++;
            typingTimer = setTimeout(type, DIALOGUE_SPEED);
        } else {
            gameState.isTyping = false;
            typingTimer = null;
            nextTipTimer = setTimeout(() => {
                diagBox.classList.add('show-next');
            }, 250);
        }
    }
    type();
}

function completeTypingImmediately() {
    if (!diagBox || !diagText) return;
    if (!diagBox.classList.contains('hidden') && gameState.isTyping) {
        gameState.isTyping = false;
        if (typingTimer) {
            clearTimeout(typingTimer);
            typingTimer = null;
        }
        diagText.innerText = gameState.currentText || diagText.innerText;
        gameState.justCompleted = true;
        if (nextTipTimer) {
            clearTimeout(nextTipTimer);
        }
        nextTipTimer = setTimeout(() => {
            diagBox.classList.add('show-next');
        }, 250);
    }
}

function handleIntroComplete() {
    if (!introPhase) return;
    // 关闭图片覆盖层与模糊
    if (imageOverlay) {
        imageOverlay.classList.add('hidden');
    }
    document.body.classList.remove('image-open');
    if (overlayImage) overlayImage.src = '';

    if (!ENABLE_WAKE_EFFECT) {
        const overlay = document.getElementById('wake-overlay');
        if (overlay) overlay.classList.add('hidden');
    }

    // 播放唤醒音效
    playSfx(wakeUpSfx);

    // 添加淡出效果
    document.body.classList.add('fade-out');
    // 2秒后进入客厅
    setTimeout(() => {
        document.body.classList.remove('fade-out');
        goToScene(INTRO_END_SCENE);
        const container = document.getElementById('game-container');
        if (container) container.classList.add('dimmed');
        // 在切换到客厅后启动醒来效果（眨眼 + 去模糊）
        const overlay = document.getElementById('wake-overlay');
        if (ENABLE_WAKE_EFFECT && container && overlay) {
            startWakeEffect(container, overlay);
        }
    }, 2000);

    introPhase = false;
}

function onDialogueBoxClick() {
    if (!diagBox || !diagText) return;

    // 若仍在打字，立即完成显示当前文本，再次点击才关闭
    if (gameState.isTyping) {
        gameState.isTyping = false;
        if (typingTimer) {
            clearTimeout(typingTimer);
            typingTimer = null;
        }
        diagText.innerText = gameState.currentText || diagText.innerText;
        if (nextTipTimer) {
            clearTimeout(nextTipTimer);
        }
        nextTipTimer = setTimeout(() => {
            diagBox.classList.add('show-next');
        }, 500);
        return;
    }
    // 抽屉耳环展示：应当在“刚刚完成打字”的早退之前触发
    if (gameState.flags.drawerPendingEarrings && !gameState.isTyping) {
        completeDrawerEarringsFlow();
        // 继续显示队列中的下一段
    }
    // 电视柜-相框流程：等待首次点击完成打字后再触发展示
    if (gameState.flags.photoFramePendingReveal && !gameState.isTyping) {
        completePhotoFrameFlow();
    }
    // 刚刚通过全局点击完成打字：本次点击不关闭，仅复位标记
    if (gameState.justCompleted) {
        gameState.justCompleted = false;
        return;
    }
    // 若存在后续队列，则显示下一条对话
    if (gameState.dialogueQueue.length > 0) {
        const next = gameState.dialogueQueue.shift();
        showDialogue(next);
        return;
    }
    // 否则关闭对话框
    diagBox.classList.add('hidden');
    diagBox.classList.remove('show-next');

    // 引导阶段：当文本框消失后，淡出intro场景2秒，然后进入客厅场景，并结束引导
    if (introPhase) {
        handleIntroComplete();
    }
}

// --- 场景切换 ---
function goToScene(sceneId) {
    document.querySelectorAll('.scene').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(`scene-${sceneId}`);
    if (target) target.classList.add('active');

// --- 淋浴音效逻辑 ---
    if (sceneId === 'hallway') {
        if (showerSfx) {
            playSfx(showerSfx)
        }
    } else {
        if (showerSfx) {
            showerSfx.pause();
            showerSfx.currentTime = 0; 
        }
    }

    const sceneConfig = SCENE_CONFIGS[sceneId];
    if (sceneConfig && sceneConfig.onEnterDialogue && !gameState.visitedScenes[sceneId]) {
        const enterDialogue = sceneConfig.onEnterDialogue;
        if (Array.isArray(enterDialogue)) {
            const [first, ...rest] = enterDialogue.filter(Boolean);
            if (first) {
                showDialogue(first);
                rest.forEach(line => gameState.dialogueQueue.push(line));
            }
        } else {
            showDialogue(enterDialogue);
        }
    }

    if (target) {
        applySceneBackground(sceneId, target);
    }

    if (sceneId) {
        gameState.visitedScenes[sceneId] = true;
    }

    // 更新物品位置和调试信息
    updatePositions();
}

function updateInventory() {
    if (!inventoryTextEl) return;
    const total = foundKeyItems.length;
    if (total === 0) {
        inventoryTextEl.textContent = '';
    } else {
        currentKeyItemIndex = Math.min(Math.max(currentKeyItemIndex, 0), total - 1);
        const { name } = foundKeyItems[currentKeyItemIndex];
        inventoryTextEl.textContent = `${name}`;
    }
    if (inventoryPrevBtn) inventoryPrevBtn.disabled = total <= 1 || currentKeyItemIndex === 0;
    if (inventoryNextBtn) inventoryNextBtn.disabled = total <= 1 || currentKeyItemIndex === total - 1;
}

// --- 初始化模块 ---
function cacheElements() {
    diagBox = document.getElementById('dialogue-box');
    diagText = document.getElementById('dialogue-text');
    choiceOverlay = document.getElementById('choice-overlay');
    choiceTextEl = document.getElementById('choice-text');
    choiceYesBtn = document.getElementById('choice-yes');
    choiceNoBtn = document.getElementById('choice-no');
    detectiveBGM = document.getElementById('detective-bgm');
    clickSfx = document.getElementById('click-sfx');
    lightSfx = document.getElementById('light-sfx');
    startDotSfx = document.getElementById('startdot-sfx');
    wakeUpSfx = document.getElementById('wake-up-sfx');
    doorOpenSfx = document.getElementById('door-open-sfx');
    footStepsSfx = document.getElementById('footsteps-sfx');
    guitarSfx = document.getElementById('guitar-sfx');
    violinSfx = document.getElementById('violin-sfx');
    pianoSfx = document.getElementById('piano-sfx');
    showerSfx = document.getElementById('shower-sfx');
    drawerCloseSfx = document.getElementById('drawer-close-sfx');
    drillScrewSfx = document.getElementById('drill-screw-sfx');
    muteBtn = document.getElementById('mute-btn');
    hideBtn = document.getElementById('hide-btn');
    lightSwitch = document.getElementById('light-switch');
    imageOverlay = document.getElementById('image-overlay');
    overlayImage = document.getElementById('overlay-image');
    startDot = document.getElementById('start-dot');
    giftBox = document.getElementById('gift-box');
    bedroomDrawer = document.getElementById('bedroom-drawer');
    vanityTable = document.getElementById('vanity-table');
    tvCabinet = document.getElementById('tv-cabinet');
    photoFrame = document.getElementById('photo-frame');
    loadingOverlay = document.getElementById('loading-overlay');
    progressFill = document.getElementById('progress-fill');
    progressText = document.getElementById('progress-text');
    inventoryTextEl = document.getElementById('inventory-text');
    inventoryPrevBtn = document.getElementById('inventory-prev');
    inventoryNextBtn = document.getElementById('inventory-next');
}

function initPositions() {
    maintainAspectRatio();
    updatePositions();
    window.addEventListener('resize', () => {
        maintainAspectRatio();
        updatePositions();
    });
}

function initDialogueHandlers() {
    if (diagBox) diagBox.addEventListener('click', onDialogueBoxClick);
    // 图片+对话框同时显示时：任意点击关闭两者（不影响耳环流程的显示逻辑）
    document.addEventListener('click', (event) => {
        const overlayVisible = imageOverlay && !imageOverlay.classList.contains('hidden');
        const dialogueVisible = diagBox && !diagBox.classList.contains('hidden');
        if (overlayVisible && dialogueVisible) {
            closeOverlayAndDialogue();
            event.preventDefault();
            event.stopPropagation();
        }
    }, true);
    // 全局点击（捕获阶段）：打字时任意点击立即完成剩余文字
    document.addEventListener('click', (event) => {
        if (choiceOverlay && choiceOverlay.contains(event.target)) return;
        completeTypingImmediately();
    }, true);
    // 对话框显示时：任意点击继续对话，但阻止互动框点击（静音/隐藏除外）
    document.addEventListener('click', (event) => {
        if (!diagBox || diagBox.classList.contains('hidden')) return;
        const target = event.target;
        if (muteBtn && muteBtn.contains(target)) return;
        if (hideBtn && hideBtn.contains(target)) return;
        if (choiceOverlay && choiceOverlay.contains(target)) return;
        if (choiceOverlay && !choiceOverlay.classList.contains('hidden')) return;
        onDialogueBoxClick();
        event.preventDefault();
        event.stopPropagation();
    }, true);
}

function initAudio() {
    const audioMap = {
        detectiveBGM,
        clickSfx,
        lightSfx,
        startDotSfx,
        wakeUpSfx,
        doorOpenSfx,
        footStepsSfx,
        guitarSfx,
        violinSfx,
        pianoSfx,
        showerSfx,
        drawerCloseSfx,
        drillScrewSfx
    };

    Object.keys(audioMap).forEach(key => {
        const el = audioMap[key];
        const cfg = AUDIO_CONFIGS[key];
        const src = AUDIO_SOURCES[key];
        if (!el) return;
        if (typeof src === 'string' && src.length > 0) {
            el.src = src;
        }
        if (!cfg) return;
        if (typeof cfg.volume === 'number') el.volume = cfg.volume;
        if (typeof cfg.loop === 'boolean') el.loop = cfg.loop;
        if (cfg.autoplay) {
            try { el.play(); } catch (_) {}
        }
    });

    if (muteBtn) {
        muteBtn.addEventListener('click', () => {
            isMuted = !isMuted;
            if (detectiveBGM) detectiveBGM.muted = isMuted;
            if (clickSfx) clickSfx.muted = isMuted;
            if (lightSfx) lightSfx.muted = isMuted;
            if (startDotSfx) startDotSfx.muted = isMuted;
            if (wakeUpSfx) wakeUpSfx.muted = isMuted;
            if (doorOpenSfx) doorOpenSfx.muted = isMuted;
            if (footStepsSfx) footStepsSfx.muted = isMuted;
            if (guitarSfx) guitarSfx.muted = isMuted;
            if (violinSfx) violinSfx.muted = isMuted;
            if (pianoSfx) pianoSfx.muted = isMuted;
            if (showerSfx) showerSfx.muted = isMuted;
            if (drawerCloseSfx) drawerCloseSfx.muted = isMuted;
            if (drillScrewSfx) drillScrewSfx.muted = isMuted;
            muteBtn.textContent = isMuted ? '🔇' : '🔊';
        });
    }
}

function initDoorAudioForNavButtons() {
    const delayMs = (AUDIO_CONFIGS.footStepsSfx && typeof AUDIO_CONFIGS.footStepsSfx.delayMs === 'number')
        ? AUDIO_CONFIGS.footStepsSfx.delayMs
        : 1000;

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            playSfx(doorOpenSfx);
            setTimeout(() => {
                playSfx(footStepsSfx);
            }, delayMs);
        });
    });
}

function initUIControls() {
    if (hideBtn) {
        hideBtn.addEventListener('click', () => {
            interactivesHidden = !interactivesHidden;
            document.body.classList.toggle('hide-interactives', interactivesHidden);
            hideBtn.textContent = interactivesHidden ? '🙈' : '👁️';
            hideBtn.title = interactivesHidden ? '显示互动框' : '隐藏互动框';
        });
    }

    if (lightSwitch) {
        lightSwitch.addEventListener('click', () => {
            const container = document.getElementById('game-container');
            if (!container) return;
            const isDimmed = container.classList.contains('dimmed');
            container.classList.toggle('dimmed', !isDimmed);
            playSfx(lightSfx);
            showDialogue(isDimmed ? "打开了灯，房间恢复明亮。" : "关上了灯，房间又暗了下来。");
        });
    }

    if (giftBox) {
        giftBox.addEventListener('click', () => {
            const src = IMAGE_SOURCES['gift'];
            if (src) openImageOverlay(src);
        });
    }

    if (imageOverlay) {
        imageOverlay.addEventListener('click', () => {
            closeOverlayAndDialogue();
        });
    }

    // 点击当前物品名称，重播对应对话/图片
    if (inventoryTextEl) {
        inventoryTextEl.addEventListener('click', () => {
            replayCurrentKeyItem();
        });
    }

    // 物品栏左右切换
    if (inventoryPrevBtn) {
        inventoryPrevBtn.addEventListener('click', () => {
            const total = foundKeyItems.length;
            if (total === 0) return;
            currentKeyItemIndex = Math.max(currentKeyItemIndex - 1, 0);
            updateInventory();
        });
    }
    if (inventoryNextBtn) {
        inventoryNextBtn.addEventListener('click', () => {
            const total = foundKeyItems.length;
            if (total === 0) return;
            currentKeyItemIndex = Math.min(currentKeyItemIndex + 1, total - 1);
            updateInventory();
        });
    }

    // 鼠标点击音效
    document.body.addEventListener('click', () => {
        playSfx(clickSfx);
    });

}

function initChoiceUI() {
    const stopAll = (event) => {
        event.preventDefault();
        event.stopPropagation();
    };
    if (choiceYesBtn) {
        choiceYesBtn.addEventListener('click', (event) => {
            stopAll(event);
            const handler = choiceHandlers && choiceHandlers.onYes;
            hideChoiceOverlay();
            if (typeof handler === 'function') handler();
        });
    }
    if (choiceNoBtn) {
        choiceNoBtn.addEventListener('click', (event) => {
            stopAll(event);
            const handler = choiceHandlers && choiceHandlers.onNo;
            hideChoiceOverlay();
            if (typeof handler === 'function') handler();
        });
    }
    if (choiceOverlay) {
        choiceOverlay.addEventListener('click', (event) => {
            if (event.target === choiceOverlay) {
                stopAll(event);
                const handler = choiceHandlers && choiceHandlers.onNo;
                hideChoiceOverlay();
                if (typeof handler === 'function') handler();
            }
        });
    }
}

function openImageOverlay(src, options = {}) {
    if (!src || !overlayImage || !imageOverlay) return;
    const { fadeIn = false } = options;
    overlayImage.src = src;
    imageOverlay.classList.remove('hidden');
    imageOverlay.classList.toggle('fade-in', fadeIn);
    document.body.classList.add('image-open');
}

function closeImageOverlay() {
    if (!imageOverlay) return;
    imageOverlay.classList.add('hidden');
    imageOverlay.classList.remove('fade-in');
    document.body.classList.remove('image-open');
    if (overlayImage) overlayImage.src = '';
}

function closeDialogueBox() {
    if (!diagBox) return;
    diagBox.classList.add('hidden');
    diagBox.classList.remove('show-next');
    gameState.dialogueQueue = [];
    gameState.justCompleted = false;
    if (typingTimer) {
        clearTimeout(typingTimer);
        typingTimer = null;
    }
    if (nextTipTimer) {
        clearTimeout(nextTipTimer);
        nextTipTimer = null;
    }
    gameState.isTyping = false;
}

function showChoiceOverlay(text, handlers = {}) {
    if (!choiceOverlay || !choiceTextEl || !choiceYesBtn || !choiceNoBtn) return;
    choiceTextEl.textContent = text || '';
    choiceHandlers = handlers;
    choiceOverlay.classList.remove('hidden');
}

function hideChoiceOverlay() {
    if (choiceOverlay) choiceOverlay.classList.add('hidden');
    choiceHandlers = null;
    if (gameState && gameState.flags) {
        gameState.flags.photoFrameAwaitingChoice = false;
    }
}

// 关闭图片与对话框的统一入口，必要时播放抽屉关闭音效
function playDrawerCloseIfNeeded() {
    if (gameState.flags.playDrawerCloseSfx) {
        playSfx(drawerCloseSfx);
        gameState.flags.playDrawerCloseSfx = false;
        const bedroomCfg = SCENE_CONFIGS['bedroom'];
        if (bedroomCfg && bedroomCfg.backgroundAfter) {
            transitionSceneBackground('bedroom', bedroomCfg.backgroundAfter, 2000);
        }
    }
}

function playPhotoFrameBgSwapIfNeeded() {
    if (!gameState.flags.playPhotoFrameBgSwap) return;
    const livingroomCfg = SCENE_CONFIGS['livingroom'];
    if (livingroomCfg && livingroomCfg.backgroundAfter) {
        transitionSceneBackground('livingroom', livingroomCfg.backgroundAfter, 2000);
    }
}

function closeOverlayAndDialogue() {
    closeImageOverlay();
    closeDialogueBox();
    hideChoiceOverlay();
    playDrawerCloseIfNeeded();
    playPhotoFrameBgSwapIfNeeded();
}

function swapHierarchy(primaryEl, secondaryEl, swapped, options = {}) {
    const { primaryZ = '13', secondaryZ = '11', flagKey } = options;
    if (primaryEl) primaryEl.style.zIndex = swapped ? primaryZ : '';
    if (secondaryEl) secondaryEl.style.zIndex = swapped ? secondaryZ : '';
    if (flagKey) gameState.flags[flagKey] = swapped;
}

function setDrawerEnabled(enabled) {
    gameState.flags.drawerEnabled = enabled;
    if (bedroomDrawer) {
        if (enabled) bedroomDrawer.removeAttribute('aria-disabled');
        else bedroomDrawer.setAttribute('aria-disabled', 'true');
    }
    swapHierarchy(bedroomDrawer, vanityTable, enabled);
}

// 梳妆台/抽屉耳环流程：拆分启动与完成，便于复用
function queueDrawerEarringsReveal() {
    gameState.flags.drawerPendingEarrings = true;
}

function completeDrawerEarringsFlow() {
    const earringsSrc = IMAGE_SOURCES['earrings'];
    if (earringsSrc) openImageOverlay(earringsSrc, { fadeIn: true });

    const drawerCfg = INTERACTIONS.find(i => i.id === 'bedroom-drawer');
    const texts = drawerCfg && Array.isArray(drawerCfg.texts) ? drawerCfg.texts : [];
    const secondLine = texts[1] || FALLBACK_DIALOGUE;
    if (secondLine) gameState.dialogueQueue.push(secondLine);

    // 记录耳环关键物品（使用第二句作为重播文本，耳环图作为重播图片）
    markKeyItemFound('earrings', { line: secondLine, image: earringsSrc });

    // 抽屉关闭后禁用再次点击，需先激活梳妆台重新打开，层级恢复默认
    setDrawerEnabled(false);
    gameState.flags.playDrawerCloseSfx = true;
    gameState.flags.drawerPendingEarrings = false;
    gameState.flags.drawerFinished = true;
    gameState.interactionIndex['vanity-table'] = Math.max(gameState.interactionIndex['vanity-table'] || 0, 1);
}

function queuePhotoFrameReveal() {
    gameState.flags.photoFramePendingReveal = true;
}

function completePhotoFrameFlow() {
    const frameSrc = IMAGE_SOURCES['photo-frame'];
    const frameCfg = INTERACTIONS.find(i => i.id === 'photo-frame');
    const texts = frameCfg && Array.isArray(frameCfg.texts) ? frameCfg.texts : [];
    const thirdLine = texts[2] || FALLBACK_DIALOGUE;

    const revealAfterAudio = () => {
        if (frameSrc) openImageOverlay(frameSrc, { fadeIn: true });
        if (thirdLine) showDialogue(thirdLine);
        markKeyItemFound('photo-frame', { line: thirdLine, image: frameSrc });

        gameState.flags.playPhotoFrameBgSwap = true;
        gameState.flags.photoFramePendingReveal = false;
        gameState.flags.photoFrameFinished = true;
        gameState.flags.photoFrameReplayReady = true;
        gameState.interactionIndex['tv-cabinet'] = Math.max(gameState.interactionIndex['tv-cabinet'] || 0, 1);
        if (Array.isArray(texts) && texts.length > 0) {
            gameState.interactionIndex['photo-frame'] = texts.length - 1;
        }
    };

    const audio = drillScrewSfx;
    if (audio) {
        audio.currentTime = 0;
        const cleanup = () => {
            audio.onended = null;
            audio.onerror = null;
        };
        audio.onended = () => {
            cleanup();
            revealAfterAudio();
        };
        audio.onerror = () => {
            cleanup();
            revealAfterAudio();
        };
        const played = audio.play();
        if (played && typeof played.then === 'function') {
            played.catch(() => {
                cleanup();
                revealAfterAudio();
            });
        } else {
            // play() not available or failed silently
            revealAfterAudio();
        }
    } else {
        revealAfterAudio();
    }
}

function handleVanityClick(texts) {
    // 抽屉完成后不再重新激活
    if (!gameState.flags.drawerFinished) {
        setDrawerEnabled(true);
    }
    if (!gameState.flags.drawerOpened) {
        const arr = Array.isArray(texts) ? texts : [];
        const first = arr[0] || FALLBACK_DIALOGUE;
        showDialogue(first);
        return true; // handled, do not advance dialogue cycling yet
    }
    return false; // allow normal interaction flow
}

function handleDrawerClick(texts) {
    if (gameState.flags.drawerFinished) return true;
    if (!gameState.flags.drawerEnabled) return true;
    gameState.flags.drawerOpened = true;
    const arr = Array.isArray(texts) ? texts : [];
    const firstLine = arr[0] || FALLBACK_DIALOGUE;
    showDialogue(firstLine);
    queueDrawerEarringsReveal();
    return true;
}

function handleTvCabinetClick(texts) {
    const arr = Array.isArray(texts) ? texts : [];
    const first = arr[0] || FALLBACK_DIALOGUE;
    const second = arr[1] || first;
    const third = arr[2] || second;

    // 1. 相框已修好：停留在第三句
    if (gameState.flags.photoFrameFinished) {
        showDialogue(third);
        return true;
    }

    gameState.flags.tvCabinetInteracted = true;

    // 2. 若未检查过相框，只显示第一句
    if (!gameState.flags.photoFrameInspected) {
        showDialogue(first);
        return true;
    }

    // 3. 检查过相框后，显示第二句（找到螺丝刀）
    showDialogue(second);
    gameState.flags.tvCabinetFoundScrewdriver = true;
    markKeyItemFound('screwdriver');
    return true;
}

function handlePhotoFrameClick(texts) {
    if (gameState.flags.photoFrameFinished) {
        // 完成后停留在最后一句，复用重播逻辑
        replayCurrentKeyItem();
        return true;
    }
    const arr = Array.isArray(texts) ? texts : [];
    const firstLine = arr[0] || FALLBACK_DIALOGUE;
    const secondLine = arr[1] || firstLine;

    // 第一次点击相框：显示第一句并标记
    if (!gameState.flags.photoFrameInspected) {
        showDialogue(firstLine);
        gameState.flags.photoFrameInspected = true;
        gameState.interactionIndex['photo-frame'] = 0;
        return true;
    }

    // 电视柜已点击：从第二句开始，等待对话框点击时进入第三句并弹出图片
    // 若未在电视柜找到螺丝刀，保持第一句
    if (!gameState.flags.tvCabinetFoundScrewdriver) {
        showDialogue(firstLine);
        return true;
    }

    // 正在等待玩家选择时，避免重复弹窗
    if (gameState.flags.photoFrameAwaitingChoice) {
        return true;
    }

    // 找到螺丝刀后：先弹出内建选择框，选择后再显示对应对话
    gameState.flags.photoFrameAwaitingChoice = true;
    showChoiceOverlay('是否使用“螺丝刀”？', {
        onYes: () => {
            gameState.flags.photoFrameAwaitingChoice = false;
            showDialogue(secondLine || FALLBACK_DIALOGUE);
            queuePhotoFrameReveal();
        },
        onNo: () => {
            gameState.flags.photoFrameAwaitingChoice = false;
            showDialogue('还是先不动它吧。');
            gameState.flags.photoFramePendingReveal = false;
        }
    });
    return true;
}

function replayCurrentKeyItem() {
    const item = foundKeyItems[currentKeyItemIndex];
    if (!item) return;
    const { id, line: storedLine, image: storedImage } = item;
    const fallbackInteraction = INTERACTIONS.find(i => i.id === id);
    const texts = fallbackInteraction && Array.isArray(fallbackInteraction.texts) ? fallbackInteraction.texts : [];
    const line = storedLine || (texts.length > 0 ? texts[texts.length - 1] : FALLBACK_DIALOGUE);
    const imageSrc = storedImage || IMAGE_SOURCES[id];
    if (imageSrc) openImageOverlay(imageSrc);
    if (line) showDialogue(line);
}

function initInteractions() {
    const sfxMap = {
        guitar: () => playSfx(guitarSfx),
        violin: () => playSfx(violinSfx),
        'electric-piano': () => playSfx(pianoSfx)
    };
    INTERACTIONS.forEach((interaction) => {
        const { id, texts, loop } = interaction;
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('click', () => {
            // 梳妆台特殊处理
            if (id === 'vanity-table') {
                const handled = handleVanityClick(texts);
                if (handled) return;
            }

            // 抽屉特殊逻辑
            if (id === 'bedroom-drawer') {
                const handled = handleDrawerClick(texts);
                if (handled) return;
            }

            if (id === 'tv-cabinet') {
                const handled = handleTvCabinetClick(texts);
                if (handled) return;
            }

            if (id === 'photo-frame') {
                const handled = handlePhotoFrameClick(texts);
                if (handled) return;
            }
            const play = sfxMap[id];
            if (play) play();
            const imageSrc = IMAGE_SOURCES[id];
            if (imageSrc) openImageOverlay(imageSrc);
            const arr = Array.isArray(texts) ? texts : [];
            if (arr.length > 0) {
                const idx = gameState.interactionIndex[id] || 0;
                const effectiveIdx = Math.min(idx, arr.length - 1);
                const rawText = arr[effectiveIdx];
                const hasAuto = typeof rawText === 'string' && rawText.includes(AUTO_ADVANCE_TAG);
                const toShow = typeof rawText === 'string'
                    ? rawText.replace(AUTO_ADVANCE_TAG, '').trim()
                    : rawText;

                // 若标记自动推进，则把后续行排入队列，单次触发后无需再次点击物品
                if (hasAuto) {
                    const rest = arr.slice(effectiveIdx + 1)
                        .map(t => (typeof t === 'string' ? t.replace(AUTO_ADVANCE_TAG, '').trim() : t))
                        .filter(Boolean);
                    if (rest.length > 0) {
                        gameState.dialogueQueue.push(...rest);
                    }
                    gameState.interactionIndex[id] = loop ? (effectiveIdx + 1) % arr.length : arr.length - 1;
                } else {
                    const next = effectiveIdx + 1;
                    gameState.interactionIndex[id] = loop
                        ? (next % arr.length)
                        : Math.min(next, arr.length - 1);
                }
                showDialogue(toShow);
            }
            // 记录关键物品
            const discoveredLine = Array.isArray(texts) && texts.length > 0
                ? texts[texts.length - 1]
                : undefined;
            markKeyItemFound(id, { line: discoveredLine, image: imageSrc });
        });
    });
}

function initIntroScene() {
    if (!ENABLE_INTRO_SCENE) {
        introPhase = false;
        goToScene(INTRO_END_SCENE);
        const container = document.getElementById('game-container');
        if (container) container.classList.add('dimmed');
        const overlay = document.getElementById('wake-overlay');
        if (ENABLE_WAKE_EFFECT && container && overlay) {
            startWakeEffect(container, overlay);
        } else if (overlay) {
            overlay.classList.add('hidden');
        }
        return;
    }

    goToScene(START_SCENE);
    if (introPhase && !isMuted && startDotSfx) {
        try { startDotSfx.play(); } catch (_) {}
    }

    if (startDot) {
        startDot.addEventListener('click', () => {
            if (startDotSfx) { startDotSfx.pause(); startDotSfx.currentTime = 0; }
            if (overlayImage && imageOverlay) {
                overlayImage.src = IMAGE_SOURCES['gift'];
                imageOverlay.classList.remove('hidden');
                document.body.classList.add('image-open');
            }
            showDialogue("等了你好久了，这是开启未来的钥匙……");
        });
    }
}

// --- 启动流程：预加载 -> 启动游戏 ---
function startGame() {
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
    });
});