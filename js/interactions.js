// interactions.js —— 互动逻辑模块
// 所有互动对象的点击处理、物品系统、事件绑定
// 依赖 gameState.js / audioManager.js / dialogue.js / sceneManager.js
// 使用 function 声明在全局作用域

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
    checkLivingroomFinalBackground();
}


function completeElectricPianoClothFlow() {
    if (!gameState.flags.electricPianoAwaitingChoice || gameState.flags.electricPianoClothLifted) return false;
    gameState.flags.electricPianoAwaitingChoice = false;
    const prompt = gameState.flags.electricPianoChoicePrompt || '是否掀开钢琴布？';
    closeDialogueBox();
    showChoiceOverlay(prompt, {
        onYes: () => {
            playSfx(clothRemoveSfx);
            const studyCfg = SCENE_CONFIGS['study'];
            const bgAfter = studyCfg && studyCfg.backgroundAfter;
            if (bgAfter) {
                transitionSceneBackground('study', bgAfter, 1200);
            }
            gameState.flags.electricPianoClothLifted = true;
            gameState.flags.electricPianoChoicePrompt = null;
        },
        onNo: () => {
            gameState.flags.electricPianoChoicePrompt = null;
        }
    });
    return true;
}

function revealElectricPianoKey(line) {
    if (gameState.flags.electricPianoKeyRevealed) return;
    const keySrc = IMAGE_SOURCES['electric-piano'];
    if (keySrc) openImageOverlay(keySrc, { fadeIn: true });
    markKeyItemFound('electric-piano', { line: line || FALLBACK_DIALOGUE, image: keySrc });
    gameState.flags.electricPianoKeyRevealed = true;
    gameState.flags.electricPianoPendingKeyLine = null;
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
    // 抽屉耳环展示：应当在"刚刚完成打字"的早退之前触发
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
    // 电钢琴：完成首句后弹出是否掀布选择
    if (completeElectricPianoClothFlow()) return;
    // 若存在后续队列，则显示下一条对话
    if (gameState.dialogueQueue.length > 0) {
        const next = gameState.dialogueQueue.shift();
        advanceGiftBlurState();
        handleDrawerCabinetQueuedReveal(next);
        handleElectricPianoQueuedReveal(next);
        showDialogue(next);
        return;
    }
    // 否则关闭对话框；引导礼物结束时改为淡出
    if (introPhase && gameState.flags.giftSequenceActive && !gameState.flags.giftFadeOutStarted) {
        fadeOutIntroGift();
        return;
    }

    diagBox.classList.add('hidden');
    diagBox.classList.remove('show-next');

    // 引导阶段：当文本框消失后，淡出intro场景2秒，然后进入客厅场景，并结束引导
    if (introPhase) {
        handleIntroComplete();
    }
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

function initDialogueHandlers() {
    if (diagBox) diagBox.addEventListener('click', onDialogueBoxClick);
    // 图片+对话框同时显示时：任意点击关闭两者（不影响耳环流程的显示逻辑）
    document.addEventListener('click', (event) => {
        const overlayVisible = imageOverlay && !imageOverlay.classList.contains('hidden');
        const dialogueVisible = diagBox && !diagBox.classList.contains('hidden');
        // 引导礼物揭示/淡出期间保持覆盖层与对话框，不自动关闭
        if (overlayVisible && dialogueVisible) {
            if (introPhase && (gameState.flags.giftBlurActive || gameState.flags.giftSequenceActive)) return;
            closeOverlayAndDialogue();
            event.preventDefault();
            event.stopPropagation();
        }
    }, true);
    // 全局点击（捕获阶段）：打字时任意点击立即完成剩余文字
    document.addEventListener('click', (event) => {
        if (choiceOverlay && choiceOverlay.contains(event.target)) return;
        if (gameState.flags.livingroomFinalApplied) return;
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
            gameState.flags.lightSwitchUsed = true
            playSfx(lightSfx);
            showDialogue(isDimmed ? "打开了灯，房间恢复明亮。" : "关上了灯，房间又暗了下来。");
        });
    }

    if (giftBox) {
        giftBox.addEventListener('click', () => {
            if (!gameState.flags.livingroomFinalApplied) return;
            if (gameState.flags.giftCodeSolved) {
                showDialogue('已经通关成功！');
                return;
            }
            showGiftCodePrompt();
        });
    }

    if (imageOverlay) {
        imageOverlay.addEventListener('click', () => {
            // 引导礼物阶段保持淡出节奏，不提前关闭
            if (introPhase && gameState.flags.giftSequenceActive) return;
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
    if (gameState.flags.livingroomFinalApplied) {
        gameState.flags.playPhotoFrameBgSwap = false;
        return;
    }
    if (livingroomCfg && livingroomCfg.backgroundAfter) {
        transitionSceneBackground('livingroom', livingroomCfg.backgroundAfter, 2000);
    }
}

function playFridgeCloseIfNeeded() {
    if (!gameState.flags.fridgeDoorPendingCloseSfx) return;
    playSfx(fridgeCloseSfx);
    gameState.flags.fridgeDoorPendingCloseSfx = false;
}

function handleDrawerCabinetQueuedReveal(nextLine) {
    if (!gameState.flags.drawerCabinetPendingOpenerLine) return false;
    if (nextLine !== gameState.flags.drawerCabinetPendingOpenerLine) return false;

    const openerImg = IMAGE_SOURCES['beer-opener'];
    if (openerImg) openImageOverlay(openerImg, { fadeIn: true });
    markKeyItemFound('beer-opener', { line: nextLine, image: openerImg });
    playSfx(findOpenerSfx);
    gameState.flags.drawerCabinetFinished = true;
    gameState.flags.drawerCabinetPendingOpenerLine = null;
    const lastIdx = typeof gameState.flags.drawerCabinetLastIndex === 'number'
        ? gameState.flags.drawerCabinetLastIndex
        : 3;
    gameState.interactionIndex['drawer-cabinet'] = lastIdx;
    return true;
}

function handleElectricPianoQueuedReveal(nextLine) {
    if (!gameState.flags.electricPianoPendingKeyLine) return false;
    if (nextLine !== gameState.flags.electricPianoPendingKeyLine) return false;
    revealElectricPianoKey(nextLine);
    return true;
}
function handleElectricPianoClick(interaction) {
    const texts = Array.isArray(interaction && interaction.texts) ? interaction.texts : [];
    const loop = interaction && interaction.loop;
    const id = 'electric-piano';
    const sanitize = (t) => (typeof t === 'string'
        ? t.replace(AUTO_ADVANCE_TAG, '').replace(STOP_ADVANCE_TAG, '').trim()
        : t);

    // 掀布后才播放琴声
    if (gameState.flags.electricPianoClothLifted) {
        playSfx(pianoSfx);
    }

    // 已揭示后：直接重播末句与图片
    if (gameState.flags.electricPianoKeyRevealed) {
        const finalLine = sanitize(texts[texts.length - 1]) || FALLBACK_DIALOGUE;
        const keySrc = IMAGE_SOURCES[id];
        if (keySrc) openImageOverlay(keySrc);
        showDialogue(finalLine);
        if (texts.length > 0) {
            gameState.interactionIndex[id] = texts.length - 1;
        }
        return true;
    }

    if (texts.length === 0) {
        showDialogue(FALLBACK_DIALOGUE);
        return true;
    }

    const idx = gameState.interactionIndex[id] || 0;
    const effectiveIdx = Math.min(idx, texts.length - 1);
    const rawText = texts[effectiveIdx];
    const hasAuto = typeof rawText === 'string' && rawText.includes(AUTO_ADVANCE_TAG);
    const hasStop = typeof rawText === 'string' && rawText.includes(STOP_ADVANCE_TAG);
    const toShow = sanitize(rawText);
    const sanitizedLastLine = sanitize(texts[texts.length - 1] || '');

    if (hasAuto) {
        const rest = [];
        let stopIdx = null;
        for (let offset = 1; effectiveIdx + offset < texts.length; offset++) {
            const cand = texts[effectiveIdx + offset];
            const candHasStop = typeof cand === 'string' && cand.includes(STOP_ADVANCE_TAG);
            const cleaned = sanitize(cand);
            if (cleaned) rest.push(cleaned);
            if (candHasStop) {
                stopIdx = effectiveIdx + offset;
                break;
            }
        }
        if (gameState.flags.electricPianoClothLifted
            && !gameState.flags.electricPianoKeyRevealed
            && rest.length > 0) {
            gameState.flags.electricPianoPendingKeyLine = rest[rest.length - 1];
        }
        if (rest.length > 0) {
            gameState.dialogueQueue.push(...rest);
        }
        if (loop) {
            gameState.interactionIndex[id] = (effectiveIdx + 1) % texts.length;
        } else if (stopIdx !== null) {
            gameState.interactionIndex[id] = stopIdx;
        } else {
            gameState.interactionIndex[id] = texts.length - 1;
        }
    } else {
        const next = effectiveIdx + 1;
        gameState.interactionIndex[id] = loop
            ? ((next) % texts.length)
            : Math.min(next, texts.length - 1);
    }

    if (!gameState.flags.electricPianoClothLifted) {
        gameState.flags.electricPianoAwaitingChoice = true;
        gameState.flags.electricPianoChoicePrompt = interaction.choiceText || '是否掀开钢琴布？';
    }

    if (gameState.flags.electricPianoClothLifted
        && !gameState.flags.electricPianoKeyRevealed
        && toShow === sanitizedLastLine) {
        revealElectricPianoKey(toShow);
    }
    showDialogue(toShow);
    return true;
}

function handleFridgeDoorClick(texts, choicePromptOverride) {
    playSfx(fridgeOpenSfx);
    const sojuImg = IMAGE_SOURCES['soju'];
    if (sojuImg) openImageOverlay(sojuImg, { fadeIn: true });

    const arr = Array.isArray(texts) ? texts : [];
    const baseLine = arr[0] || FALLBACK_DIALOGUE;
    const finalLine = arr[1] || FALLBACK_DIALOGUE;
    const choicePrompt = choicePromptOverride || arr[2] || FALLBACK_DIALOGUE;

    const hasOpener = foundKeyItemIds.has('beer-opener');
    const hasSojuOpened = gameState.flags.sojuOpened;

    if (hasOpener && !hasSojuOpened && !gameState.flags.sojuOpenInProgress) {
        showChoiceOverlay(choicePrompt, {
            onYes: () => {
                gameState.flags.sojuOpenInProgress = true;
                playSojuOpeningSequence(() => {
                    showDialogue(finalLine);
                    markKeyItemFound('soju', { line: finalLine, image: sojuImg });
                    gameState.flags.sojuOpened = true;
                    gameState.flags.sojuOpenInProgress = false;
                    checkLivingroomFinalBackground();
                });
            },
            onNo: () => {
                showDialogue(baseLine);
            }
        });
        gameState.flags.fridgeDoorPendingCloseSfx = true;
        return true;
    }

    if (hasSojuOpened) {
        showDialogue(finalLine);
    } else {
        showDialogue(baseLine);
        if (!hasOpener && !hasSojuOpened) {
            gameState.flags.sojuSeenNeedsOpener = true;
        }
    }
    gameState.flags.fridgeDoorPendingCloseSfx = true;
    return true;
}

function closeOverlayAndDialogue() {
    // 引导礼物阶段：改为淡出退出
    if (introPhase && gameState.flags.giftSequenceActive && !gameState.flags.giftFadeOutStarted) {
        fadeOutIntroGift();
        return;
    }
    closeImageOverlay();
    closeDialogueBox();
    hideChoiceOverlay();
    playDrawerCloseIfNeeded();
    playPhotoFrameBgSwapIfNeeded();
    playFridgeCloseIfNeeded();
    handleLivingroomFinalDialogue();
    if (introPhase) {
        handleIntroComplete();
    }
}

// 在引导淡出后以淡入方式显示核心 UI 控件

function setDrawerEnabled(enabled) {
    gameState.flags.drawerEnabled = enabled;
    if (bedroomDrawer) {
        if (enabled) bedroomDrawer.removeAttribute('aria-disabled');
        else bedroomDrawer.setAttribute('aria-disabled', 'true');
    }
    swapHierarchy(bedroomDrawer, vanityTable, enabled);
}

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
        checkLivingroomFinalBackground();
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
function handleDrawerCabinetClick(texts) {
    const arr = Array.isArray(texts) ? texts : [];
    const first = arr[0] || FALLBACK_DIALOGUE;
    const second = arr[1] || first;
    const third = arr[2] || second;
    const last = arr[arr.length - 1] || third;
    const lastIdx = arr.length > 0 ? arr.length - 1 : 0;

    // 完成后保持在最后一句
    if (gameState.flags.drawerCabinetFinished) {
        showDialogue(last);
        return true;
    }

    const hasSoju = foundKeyItemIds.has('soju');
    const sawSojuNeedsOpener = !!gameState.flags.sojuSeenNeedsOpener;
    if (!hasSoju && !sawSojuNeedsOpener) {
        showDialogue(first);
        gameState.interactionIndex['drawer-cabinet'] = 0;
        return true;
    }

    // 已找到烧酒：先显示第二句，并将第三句排入队列，第三句出现时弹出开瓶器
    showDialogue(second);
    gameState.dialogueQueue.push(third);
    gameState.flags.drawerCabinetPendingOpenerLine = third;
    gameState.flags.drawerCabinetLastIndex = lastIdx;
    gameState.interactionIndex['drawer-cabinet'] = 2;
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
function handlePhotoFrameClick(texts, choicePromptOverride) {
    if (gameState.flags.photoFrameFinished) {
        // 完成后固定重播相框的末尾台词与图片
        replayKeyItemById('photo-frame');
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
    const choicePrompt = choicePromptOverride || '是否使用“螺丝刀”？';
    gameState.flags.photoFrameAwaitingChoice = true;
    showChoiceOverlay(choicePrompt, {
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
function replayKeyItemById(id) {
    if (!id) return;
    const item = foundKeyItems.find(k => k.id === id);
    const { line: storedLine, image: storedImage } = item || {};
    const fallbackInteraction = INTERACTIONS.find(i => i.id === id);
    const texts = fallbackInteraction && Array.isArray(fallbackInteraction.texts) ? fallbackInteraction.texts : [];
    const line = storedLine || (texts.length > 0 ? texts[texts.length - 1] : FALLBACK_DIALOGUE);
    const imageSrc = storedImage || IMAGE_SOURCES[id];
    if (imageSrc) openImageOverlay(imageSrc);
    if (line) showDialogue(line);
}
function replayCurrentKeyItem() {
    const item = foundKeyItems[currentKeyItemIndex];
    if (!item) return;
    replayKeyItemById(item.id);
}
function initInteractions() {
    const sfxMap = {
        guitar: () => playSfx(guitarSfx),
        violin: () => playSfx(violinSfx),
        bookcase: () => playSfx(bookOpenSfx)
    };
    INTERACTIONS.forEach((interaction) => {
        const { id, texts, loop } = interaction;
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('click', () => {
            if (!gameState.flags.lightSwitchUsed) {
                showDialogue('房间太暗了，要先开灯才看得清呢…');
                return;
            }
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

            if (id === 'drawer-cabinet') {
                const handled = handleDrawerCabinetClick(texts);
                if (handled) return;
            }

            if (id === 'photo-frame') {
                const handled = handlePhotoFrameClick(texts, interaction.choiceText);
                if (handled) return;
            }

            if (id === 'electric-piano') {
                const handled = handleElectricPianoClick(interaction);
                if (handled) return;
            }

            if (id === 'fridge-note' && !gameState.flags.fridgeDoorSwapped) {
                swapHierarchy(fridgeDoor, fridgeNote, true, { primaryZ: '13', secondaryZ: '11', flagKey: 'fridgeDoorSwapped' });
            }

            if (id === 'fridge-door') {
                const handled = handleFridgeDoorClick(texts, interaction.choiceText);
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
                const hasStop = typeof rawText === 'string' && rawText.includes(STOP_ADVANCE_TAG);
                const sanitize = (t) => (typeof t === 'string'
                    ? t.replace(AUTO_ADVANCE_TAG, '').replace(STOP_ADVANCE_TAG, '').trim()
                    : t);
                const toShow = sanitize(rawText);

                // 若标记自动推进，则把后续行排入队列，单次触发后无需再次点击物品
                if (hasAuto) {
                    const rest = [];
                    let stopIdx = null;
                    for (let offset = 1; effectiveIdx + offset < arr.length; offset++) {
                        const cand = arr[effectiveIdx + offset];
                        const candHasStop = typeof cand === 'string' && cand.includes(STOP_ADVANCE_TAG);
                        const cleaned = sanitize(cand);
                        if (cleaned) rest.push(cleaned);
                        if (candHasStop) {
                            stopIdx = effectiveIdx + offset;
                            break;
                        }
                    }
                    if (rest.length > 0) {
                        gameState.dialogueQueue.push(...rest);
                    }
                    if (loop) {
                        gameState.interactionIndex[id] = (effectiveIdx + 1) % arr.length;
                    } else if (stopIdx !== null) {
                        gameState.interactionIndex[id] = stopIdx;
                    } else {
                        gameState.interactionIndex[id] = arr.length - 1;
                    }
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

