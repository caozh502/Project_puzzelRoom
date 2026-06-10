// sceneManager.js —— 场景管理模块
// 场景切换、背景过渡、定位、醒来效果、intro、通关
// 使用 var 暴露到全局作用域

// --- 场景相关全局变量 ---
var finalLoopCleanup = null;
var introPhase = true;
var introRippleCycles = 0;
var introGiftShown = false;
var startDot, introRippleLoader;

// --- 礼物模糊效果 ---
function setGiftBlur(step) {
    if (!overlayImage) return;
    const idx = Math.min(Math.max(step, 0), GIFT_BLUR_LEVELS.length - 1);
    overlayImage.style.transition = overlayImage.style.transition || 'filter 0.8s ease';
    overlayImage.style.filter = `blur(${GIFT_BLUR_LEVELS[idx]}px)`;
}

function advanceGiftBlurState() {
    if (!gameState.flags.giftBlurActive) return;
    const nextStep = Math.min((gameState.flags.giftBlurStep || 0) + 1, GIFT_BLUR_LEVELS.length - 1);
    gameState.flags.giftBlurStep = nextStep;
    setGiftBlur(nextStep);
    if (nextStep === GIFT_BLUR_LEVELS.length - 1 && gameState.dialogueQueue.length === 0) {
        gameState.flags.giftBlurActive = false;
    }
}

// --- 礼物盒状态 ---
function updateGiftBoxState() {
    if (!giftBox) return;
    const isFinal = !!gameState.flags.livingroomFinalApplied;
    giftBox.style.zIndex = isFinal ? '13' : '0';
    giftBox.style.pointerEvents = isFinal ? 'auto' : 'none';
    if (isFinal) {
        giftBox.removeAttribute('aria-disabled');
    } else {
        giftBox.setAttribute('aria-disabled', 'true');
    }
}

// --- 最终照片循环 ---
function buildFinalLoopPhotoList() {
    const explicitPhotos = Array.isArray(LIVINGROOM_CONFIG.finalLoopPhotos) ? LIVINGROOM_CONFIG.finalLoopPhotos : [];
    if (explicitPhotos.length > 0) {
        return Promise.resolve(explicitPhotos);
    }

    const folder = typeof LIVINGROOM_CONFIG.finalLoopPhotoFolder === 'string'
        ? LIVINGROOM_CONFIG.finalLoopPhotoFolder.replace(/\\\\/g, '/')
        : '';
    if (!folder) {
        return Promise.resolve([]);
    }

    const extension = String(LIVINGROOM_CONFIG.finalLoopPhotoExtension || 'jpg').replace(/^\\./, '').toLowerCase();
    const maxAttempts = Number.isInteger(LIVINGROOM_CONFIG.finalLoopMaxAttempt)
        ? LIVINGROOM_CONFIG.finalLoopMaxAttempt
        : 50;
    const maxConsecutiveMisses = Number.isInteger(LIVINGROOM_CONFIG.finalLoopMaxMissing)
        ? LIVINGROOM_CONFIG.finalLoopMaxMissing
        : 3;

    const photos = [];
    let index = 1;
    let missingCount = 0;

    const tryLoad = () => {
        if (index > maxAttempts || missingCount >= maxConsecutiveMisses) {
            return Promise.resolve(photos);
        }

        const url = `${folder}/${index}.${extension}`;
        return new Promise(resolve => {
            const img = new Image();
            let finished = false;
            const cleanup = () => {
                if (finished) return;
                finished = true;
                img.onload = null;
                img.onerror = null;
            };
            img.onload = () => {
                cleanup();
                photos.push(url);
                missingCount = 0;
                index += 1;
                resolve(tryLoad());
            };
            img.onerror = () => {
                cleanup();
                missingCount += 1;
                index += 1;
                resolve(tryLoad());
            };
            img.src = url;
        });
    };

    return tryLoad();
}

async function playFinalLoopPhotos() {
    const photos = await buildFinalLoopPhotoList();
    const displayTime = LIVINGROOM_CONFIG.finalPhotoDisplayTime || 3000;
    if (!photos || photos.length === 0) return;

    const photoContainer = document.createElement('div');
    photoContainer.id = 'final-loop-container';
    document.body.appendChild(photoContainer);

    const photoInner = document.createElement('div');
    photoInner.className = 'final-loop-inner';
    photoContainer.appendChild(photoInner);

    const imgs = [document.createElement('img'), document.createElement('img')];
    imgs.forEach(img => {
        img.className = 'final-loop-photo';
        img.style.opacity = '0';
        photoInner.appendChild(img);
    });

    const gameContainer = document.getElementById('game-container');
    document.body.classList.add('final-loop-active');
    const timeoutIds = [];
    let active = true;
    let finalClickHandler = null;
    let finalEscHandler = null;

    const createTimeout = (handler, delay) => {
        const id = window.setTimeout(handler, delay);
        timeoutIds.push(id);
        return id;
    };

    const cleanupLoop = () => {
        if (!active) return;
        active = false;
        timeoutIds.forEach(clearTimeout);
        timeoutIds.length = 0;
        try {
            if (finalClickHandler) photoContainer.removeEventListener('click', finalClickHandler);
        } catch (e) {}
        try {
            if (finalEscHandler) document.removeEventListener('keydown', finalEscHandler);
        } catch (e) {}
        if (photoContainer.parentElement) {
            photoContainer.remove();
        }
        document.body.classList.remove('final-loop-active');
        if (finalLoopCleanup === cleanupLoop) {
            finalLoopCleanup = null;
        }
    };

    finalLoopCleanup = cleanupLoop;

    const crossfade = (nextImg, prevImg) => {
        if (!active) return;
        nextImg.style.opacity = '1';
        prevImg.style.opacity = '0';
    };

    const showPhoto = (index) => {
        if (!active) return;
        const slot = index % 2;
        const nextImg = imgs[slot];
        const prevImg = imgs[1 - slot];

        nextImg.style.zIndex = '2';
        prevImg.style.zIndex = '1';
        nextImg.style.opacity = '0';
        nextImg.src = photos[index];

        const startTransition = () => {
            if (!active) return;
            createTimeout(() => crossfade(nextImg, prevImg), 50);
        };

        if (nextImg.complete && nextImg.naturalWidth > 0) {
            startTransition();
        } else {
            nextImg.onload = startTransition;
            nextImg.onerror = startTransition;
        }

        if (index + 1 < photos.length) {
            createTimeout(() => showPhoto(index + 1), displayTime);
        } else {
            finalClickHandler = () => {
                if (!active) return;
                nextImg.style.opacity = '0';
                createTimeout(() => cleanupLoop(), 500);
            };
            photoContainer.addEventListener('click', finalClickHandler);

            finalEscHandler = (e) => {
                if (e.key === 'Escape') {
                    cleanupLoop();
                }
            };
            document.addEventListener('keydown', finalEscHandler);
        }
    };

    showPhoto(0);
}

// --- 通关 ---
function applyFinalVictory() {
    const livingCfg = SCENE_CONFIGS['livingroom'];
    if (livingCfg) {
        gameState.flags.livingroomFinalApplied = true;
        if (livingCfg.backgroundFinal) {
            if (livingCfg.background && typeof livingCfg.background === 'object') {
                livingCfg.background.value = livingCfg.backgroundFinal;
            } else {
                livingCfg.background = { type: 'image', value: livingCfg.backgroundFinal };
            }
        }
    }
    updateGiftBoxState();
    goToScene('livingroom');
    try {
        transitionSceneBackground('livingroom', livingCfg && livingCfg.backgroundFinal ? livingCfg.backgroundFinal : undefined, 1200);
    } catch (e) {}

    const finalLines = Array.isArray(livingCfg?.finalDialogueLines) && livingCfg.finalDialogueLines.length > 0
        ? livingCfg.finalDialogueLines
        : [livingCfg?.finalLine || '通关成功！'];
    const [firstLine, ...restLines] = finalLines;
    showDialogue(firstLine);
    if (restLines.length > 0) {
        gameState.dialogueQueue.push(...restLines);
    }

    playFinalBgm();
    playFinalLoopPhotos();
    gameState.flags.giftCodeSolved = true;
    gameState.flags.livingroomFinalDialogueShown = true;
}

// --- 礼物密码弹窗 ---
function showGiftCodePrompt() {
    if (gameState.flags.giftCodePromptOpen) return;
    gameState.flags.giftCodePromptOpen = true;

    const overlay = document.createElement('div');
    overlay.className = 'code-input-overlay';

    const box = document.createElement('div');
    box.className = 'choice-box code-input-box';

    const label = document.createElement('div');
    label.className = 'code-input-label';
    label.textContent = GIFT_CODE_PROMPT;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'code-input-field';
    input.autocomplete = 'off';
    input.maxLength = 8;

    const actions = document.createElement('div');
    actions.className = 'choice-actions';

    const okBtn = document.createElement('button');
    okBtn.textContent = '确认';
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '取消';

    actions.appendChild(okBtn);
    actions.appendChild(cancelBtn);
    box.appendChild(label);
    box.appendChild(input);
    box.appendChild(actions);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    const closePrompt = () => {
        overlay.remove();
        gameState.flags.giftCodePromptOpen = false;
    };

    const handleOk = () => {
        const val = (input.value || '').trim();
        if (val === GIFT_CODE_ANSWER) {
            gameState.flags.giftCodeSolved = true;
            closePrompt();
            const finalLines = LIVINGROOM_CONFIG.finalDialogueLines || ['通关成功'];
            if (Array.isArray(finalLines) && finalLines.length > 0) {
                const [first, ...rest] = finalLines;
                showDialogue(first);
                if (rest.length > 0) {
                    gameState.dialogueQueue.push(...rest);
                }
            } else {
                showDialogue('通关成功');
            }
            playFinalBgm();
            playFinalLoopPhotos();
        } else {
            input.value = '';
            input.focus();
        }
    };

    okBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); handleOk(); });
    cancelBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); closePrompt(); });
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            e.preventDefault();
            e.stopPropagation();
            closePrompt();
        }
    });
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleOk();
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            closePrompt();
        }
    });

    setTimeout(() => input.focus(), 0);
}

// --- 通关后客厅对话 ---
function handleLivingroomFinalDialogue() {
    const active = document.querySelector('.scene.active');
    const isLivingroomActive = active && active.id === 'scene-livingroom';
    if (gameState.flags.livingroomFinalApplied && !gameState.flags.livingroomFinalDialogueShown && isLivingroomActive) {
        setTimeout(() => {
            showDialogue(LIVINGROOM_FINAL_LINE);
        }, 0);
        gameState.flags.livingroomFinalDialogueShown = true;
    }
}

function checkLivingroomFinalBackground() {
    const livingCfg = SCENE_CONFIGS['livingroom'];
    if (!livingCfg || !livingCfg.backgroundFinal) return;
    if (gameState.flags.livingroomFinalApplied) return;

    const allItemsFound = foundKeyItems.length >= KEY_ITEMS.length;
    const sojuOpened = !!gameState.flags.sojuOpened;
    const photoFrameFixed = !!gameState.flags.photoFrameFinished;
    if (!(allItemsFound && sojuOpened && photoFrameFixed)) return;

    gameState.flags.livingroomFinalApplied = true;
    livingCfg.background.value = livingCfg.backgroundFinal;

    const active = document.querySelector('.scene.active');
    const isLivingroomActive = active && active.id === 'scene-livingroom';
    if (isLivingroomActive) {
        transitionSceneBackground('livingroom', livingCfg.backgroundFinal, 1200);
    }

    updateGiftBoxState();
}

// --- 初始状态 ---
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

// --- 场景背景 ---
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

    void transitionLayer.offsetWidth;

    transitionLayer.style.opacity = '1';

    setTimeout(() => {
        sceneCfg.background.value = newBgUrl;
        applySceneBackground(sceneId, sceneEl);
        transitionLayer.remove();
    }, duration);
}

// --- 醒来效果 ---
function startWakeEffect(container, overlay, onUnblurEnd) {
    if (!container || !overlay) return;
    const activeScene = container.querySelector('.scene.active');
    overlay.classList.remove('hidden');
    overlay.classList.add('wake-blink');
    container.classList.add('dimmed');
    container.classList.add('waking');
    overlay.addEventListener('animationend', () => {
        overlay.remove();
    }, { once: true });
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

// --- 16:9 自适应 ---
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

// --- 物品定位 ---
function updatePositions() {
    document.querySelectorAll('.debug-info').forEach(d => d.remove());

    const currentScene = document.querySelector('.scene.active');
    if (!currentScene) return;

    const container = document.getElementById('game-container');
    if (!container) return;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

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

        const rotation = config.rotation;
        const transformParts = ['translate(-50%, -50%)'];
        if (rotation !== undefined && rotation !== null && rotation !== '') {
            const rot = typeof rotation === 'number' ? `${rotation}deg` : `${rotation}`;
            transformParts.push(`rotate(${rot})`);
        }
        el.style.transform = transformParts.join(' ');

        const paddingParts = config.padding.split(' ');
        const paddingTopPercent = parseFloat(paddingParts[0]) / 100;
        const paddingRightPercent = parseFloat(paddingParts[1] || paddingParts[0]) / 100;
        const paddingTop = paddingTopPercent * containerHeight;
        const paddingRight = paddingRightPercent * containerWidth;
        el.style.padding = config.padding;

        const isHint = el.classList.contains('nav-hint');
        if (!isHint) {
            const originalLabel = el.dataset.originalText || el.textContent.split('\\n')[0];
            el.dataset.originalText = originalLabel;
            el.textContent = '';
            el.setAttribute('aria-label', originalLabel);

            if (el.closest('.scene') === currentScene) {
                const debugInfo = document.createElement('div');
                debugInfo.className = 'debug-info';
                debugInfo.innerHTML = `<small>@${originalLabel}</small>`;
                debugInfo.style.top = `${newTop}px`;
                debugInfo.style.left = `${newLeft + el.offsetWidth / 2 + 5}px`;
                container.appendChild(debugInfo);
            }
        }
    });
}

// --- Intro 场景 ---
function startIntroExitEffects() {
    if (gameState.flags.introExitStarted) return;
    gameState.flags.introExitStarted = true;
    playSfx(wakeUpSfx);
    document.body.classList.add('fade-out');
}

function handleIntroComplete() {
    if (!introPhase) return;
    if (imageOverlay) {
        imageOverlay.classList.add('hidden');
    }
    document.body.classList.remove('image-open');
    if (overlayImage) overlayImage.src = '';

    if (!ENABLE_WAKE_EFFECT) {
        const overlay = document.getElementById('wake-overlay');
        if (overlay) overlay.classList.add('hidden');
    }

    startIntroExitEffects();
    setTimeout(() => {
        document.body.classList.remove('fade-out');
        goToScene(INTRO_END_SCENE);
        const container = document.getElementById('game-container');
        if (container) container.classList.add('dimmed');
        const overlay = document.getElementById('wake-overlay');
        if (ENABLE_WAKE_EFFECT && container && overlay) {
            startWakeEffect(container, overlay);
        }
        fadeInCoreUIControls();
    }, 4000);

    introPhase = false;
}

function handleLivingroomEntryExtras() {
    updateGiftBoxState();
    if (gameState.flags.livingroomFinalApplied && !gameState.flags.livingroomFinalDialogueShown) {
        showDialogue(LIVINGROOM_FINAL_LINE);
        gameState.flags.livingroomFinalDialogueShown = true;
    }
}

// --- 场景切换 ---
function goToScene(sceneId) {
    document.querySelectorAll('.scene').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(`scene-${sceneId}`);
    if (target) target.classList.add('active');

    if (sceneId === 'hallway') {
        if (showerSfx) {
            playSfx(showerSfx)
        }
        ensureDetectiveBgm();
    } else {
        if (showerSfx) {
            showerSfx.pause();
            showerSfx.currentTime = 0;
        }
    }

    if (sceneId === 'bedroom') {
        if (birdsChirpingSfx) {
            playSfx(birdsChirpingSfx);
        }
    } else {
        if (birdsChirpingSfx) {
            birdsChirpingSfx.pause();
            birdsChirpingSfx.currentTime = 0;
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

    if (sceneId === 'livingroom') {
        handleLivingroomEntryExtras();
    }

    updatePositions();
}

function initPositions() {
    maintainAspectRatio();
    updatePositions();
    window.addEventListener('resize', () => {
        maintainAspectRatio();
        updatePositions();
    });
}

// --- Intro 涟漪与点击 ---
function setupIntroRippleStates() {
    if (!introRippleLoader) return;

    introRippleLoader.style.animation = '';
    introRippleLoader.style.opacity = '';
    if (startDot) {
        startDot.style.animation = '';
        startDot.style.opacity = '';
    }

    const applyState = (options = {}) => {
        const {
            duration = '7s',
            delayStep = '2s',
            countClass = 'count-3'
        } = options;
        introRippleLoader.style.setProperty('--ripple-duration', duration);
        introRippleLoader.style.setProperty('--ripple-delay-step', delayStep);
        introRippleLoader.classList.remove('count-1', 'count-2', 'count-3', 'count-4');
        if (countClass) introRippleLoader.classList.add(countClass);
    };

    applyState({ duration: '5s', delayStep: '1s', countClass: 'count-3' });
    introRippleCycles = 0;
    introGiftShown = false;
}

function handleStartDotClick() {
    if (!introRippleLoader) {
        revealIntroGift();
        return;
    }

    playSfx(clickDotSfx);

    introRippleLoader.style.setProperty('--ripple-duration', '1.5s');
    introRippleLoader.style.setProperty('--ripple-delay-step', '0.8s');
    introRippleLoader.classList.remove('count-1', 'count-2', 'count-3', 'count-4');

    const lastRing = introRippleLoader.querySelector('div:nth-child(5)');
    if (lastRing) {
        if (lastRing._introOnIter) {
            lastRing.removeEventListener('animationiteration', lastRing._introOnIter);
        }
        introRippleCycles = 0;
        const onIter = () => {
            introRippleCycles += 1;
            if (introRippleCycles >= 5 && !introGiftShown) {
                introGiftShown = true;
                lastRing.removeEventListener('animationiteration', onIter);
                lastRing._introOnIter = null;
                introRippleLoader.style.animation = 'overlayFadeOut 1.5s forwards';
                if (startDot) {
                    startDot.style.animation = 'overlayFadeOut 1.5s forwards';
                }
                revealIntroGift();
            }
        };
        lastRing._introOnIter = onIter;
        lastRing.addEventListener('animationiteration', onIter);
    } else {
        revealIntroGift();
    }
}

function revealIntroGift() {
    if (startDotSfx) { startDotSfx.pause(); startDotSfx.currentTime = 0; }
    const giftSrc = IMAGE_SOURCES['gift'];
    const introCfg = SCENE_CONFIGS['intro'] || {};
    const giftLines = Array.isArray(introCfg.giftLines) ? introCfg.giftLines : [];

    gameState.flags.giftSequenceActive = true;
    gameState.flags.giftFadeOutStarted = false;
    gameState.flags.giftBlurActive = true;
    gameState.flags.giftBlurStep = 0;

    if (giftSrc) {
        openImageOverlay(giftSrc, { fadeIn: true });
        setGiftBlur(0);
    } else if (overlayImage && imageOverlay) {
        overlayImage.src = '';
        imageOverlay.classList.remove('hidden');
        document.body.classList.add('image-open');
    }

    const [firstLine, ...restLines] = giftLines;
    if (firstLine) showDialogue(firstLine);
    if (restLines.length > 0) {
        gameState.dialogueQueue.push(...restLines);
    }
}

function fadeOutIntroGift() {
    if (!introPhase || gameState.flags.giftFadeOutStarted) return false;
    gameState.flags.giftFadeOutStarted = true;
    if (startDot) startDot.remove();
    const overlay = imageOverlay;
    const dialogue = diagBox;

    startIntroExitEffects();

    const finish = () => {
        if (overlay) {
            overlay.classList.add('hidden');
            overlay.classList.remove('fade-out');
        }
        if (overlayImage) {
            overlayImage.classList.remove('gift-image');
            overlayImage.src = '';
        }
        if (dialogue) {
            dialogue.classList.add('hidden');
            dialogue.classList.remove('fade-out');
            dialogue.classList.remove('show-next');
        }
        document.body.classList.remove('image-open');
        gameState.flags.giftSequenceActive = false;
        gameState.flags.giftBlurActive = false;
        gameState.flags.giftBlurStep = 0;
        handleIntroComplete();
    };

    let finished = false;
    const onOverlayEnd = () => {
        if (finished) return;
        finished = true;
        finish();
    };

    if (overlay) {
        overlay.classList.remove('fade-in');
        overlay.classList.add('fade-out');
        overlay.addEventListener('animationend', onOverlayEnd, { once: true });
    }
    if (dialogue) {
        dialogue.classList.add('fade-out');
    }

    if (!overlay) {
        setTimeout(onOverlayEnd, 700);
    }
    return true;
}

// --- UI 淡入 ---
function fadeInCoreUIControls() {
    const controls = [muteBtn, hideBtn, inventoryDisplay];
    controls.forEach(el => {
        if (el) el.classList.remove('ui-controls-fade-in');
    });
    document.body.classList.remove('ui-controls-hidden');
    controls.forEach(el => {
        if (!el) return;
        void el.offsetWidth;
        el.classList.add('ui-controls-fade-in');
    });
}

// --- z-index 交换工具 ---
function swapHierarchy(primaryEl, secondaryEl, swapped, options = {}) {
    const { primaryZ = '13', secondaryZ = '11', flagKey } = options;
    if (primaryEl) primaryEl.style.zIndex = swapped ? primaryZ : '';
    if (secondaryEl) secondaryEl.style.zIndex = swapped ? secondaryZ : '';
    if (flagKey) gameState.flags[flagKey] = swapped;
}

// --- Intro 场景初始化 ---
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
        fadeInCoreUIControls();
        return;
    }

    goToScene(START_SCENE);
    if (introPhase && !isMuted && startDotSfx) {
        try { startDotSfx.play(); } catch (_) {}
    }

    setupIntroRippleStates();
    if (startDot) {
        startDot.addEventListener('click', handleStartDotClick);
    }
}
