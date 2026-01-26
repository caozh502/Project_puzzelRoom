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

const DIALOGUE_SPEED = 50;
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
    visitedScenes: {}
};

// 记录打字计时器以便可取消
let typingTimer = null;
let nextTipTimer = null;

// 引导阶段标记与全局元素引用
let introPhase = true;
let imageOverlay, overlayImage, startDot;
// 音频变量
let bgm, clickSfx, lightSfx, startDotSfx, wakeUpSfx, doorOpenSfx, footStepsSfx;
// 其他UI变量
let muteBtn, hideBtn, lightSwitch, giftBox;
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
                debugInfo.innerHTML = `<small>@${originalLabel}<br>Top: ${newTop.toFixed(0)}px, Left: ${newLeft.toFixed(0)}px<br>Padding: ${Math.round(paddingTop)}px ${Math.round(paddingRight)}px</small>`;
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
    const inventoryDisplay = document.getElementById('inventory-display');
    if (inventoryDisplay) {
        inventoryDisplay.innerText = `物品栏: ${gameState.inventory.join(", ")}`;
    }
}

// --- 初始化模块 ---
function cacheElements() {
    diagBox = document.getElementById('dialogue-box');
    diagText = document.getElementById('dialogue-text');
    bgm = document.getElementById('bgm');
    clickSfx = document.getElementById('click-sfx');
    lightSfx = document.getElementById('light-sfx');
    startDotSfx = document.getElementById('startdot-sfx');
    wakeUpSfx = document.getElementById('wake-up-sfx');
    doorOpenSfx = document.getElementById('door-open-sfx');
    footStepsSfx = document.getElementById('footsteps-sfx');
    muteBtn = document.getElementById('mute-btn');
    hideBtn = document.getElementById('hide-btn');
    lightSwitch = document.getElementById('light-switch');
    imageOverlay = document.getElementById('image-overlay');
    overlayImage = document.getElementById('overlay-image');
    startDot = document.getElementById('start-dot');
    giftBox = document.getElementById('gift-box');
}

function initPositions() {
    updatePositions();
    window.addEventListener('resize', updatePositions);
}

function initDialogueHandlers() {
    if (diagBox) diagBox.addEventListener('click', onDialogueBoxClick);
    // 全局点击（捕获阶段）：打字时任意点击立即完成剩余文字
    document.addEventListener('click', completeTypingImmediately, true);
}

function initAudio() {
    const audioMap = {
        bgm,
        clickSfx,
        lightSfx,
        startDotSfx,
        wakeUpSfx,
        doorOpenSfx,
        footStepsSfx
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
            if (bgm) bgm.muted = isMuted;
            if (clickSfx) clickSfx.muted = isMuted;
            if (lightSfx) lightSfx.muted = isMuted;
            if (startDotSfx) startDotSfx.muted = isMuted;
            if (wakeUpSfx) wakeUpSfx.muted = isMuted;
            if (doorOpenSfx) doorOpenSfx.muted = isMuted;
            if (footStepsSfx) footStepsSfx.muted = isMuted;
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
            if (overlayImage && imageOverlay) {
                overlayImage.src = 'assets/Picture/gift.png';
                imageOverlay.classList.remove('hidden');
                document.body.classList.add('image-open');
            }
        });
    }

    if (imageOverlay) {
        imageOverlay.addEventListener('click', () => {
            imageOverlay.classList.add('hidden');
            document.body.classList.remove('image-open');
            if (overlayImage) overlayImage.src = '';
        });
    }

    // 鼠标点击音效
    document.body.addEventListener('click', () => {
        playSfx(clickSfx);
    });
}

function initInteractions() {
    INTERACTIONS.forEach(({ id, text }) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('click', () => showDialogue(text));
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
                overlayImage.src = 'assets/Picture/gift.png';
                imageOverlay.classList.remove('hidden');
                document.body.classList.add('image-open');
            }
            showDialogue("等了你好久了，这是开启未来的钥匙……");
        });
    }
}

// 开场白
window.onload = () => {
    cacheElements();
    applyInitialState();
    initPositions();
    initDialogueHandlers();
    initAudio();
    initUIControls();
    initInteractions();
    initDoorAudioForNavButtons();
    initIntroScene();
    updateInventory();
};