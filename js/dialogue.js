// dialogue.js —— 对话/图片/选择框 UI 管理模块
// 打字机效果、图片覆盖层、选择弹窗
// 使用 var 暴露到全局作用域，供其他模块直接引用

// --- UI 元素引用（全局可见）---
var diagBox, diagText;
var choiceOverlay, choiceTextEl, choiceYesBtn, choiceNoBtn;
var choiceHandlers = null;
var imageOverlay, overlayImage;

// 打字计时器
var typingTimer = null;
var nextTipTimer = null;

function cacheDialogueElements() {
    diagBox = document.getElementById('dialogue-box');
    diagText = document.getElementById('dialogue-text');
    choiceOverlay = document.getElementById('choice-overlay');
    choiceTextEl = document.getElementById('choice-text');
    choiceYesBtn = document.getElementById('choice-yes');
    choiceNoBtn = document.getElementById('choice-no');
    imageOverlay = document.getElementById('image-overlay');
    overlayImage = document.getElementById('overlay-image');
}

// --- 打字机对话 ---
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

// --- 选择弹窗 ---
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

// --- 图片覆盖层 ---
function openImageOverlay(src, options = {}) {
    if (!src || !overlayImage || !imageOverlay) return;
    const { fadeIn = false } = options;
    overlayImage.src = src;
    const isGiftImg = IMAGE_SOURCES && IMAGE_SOURCES['gift'] && src === IMAGE_SOURCES['gift'];
    overlayImage.classList.toggle('gift-image', !!isGiftImg);
    imageOverlay.classList.remove('hidden');
    imageOverlay.classList.toggle('fade-in', fadeIn);
    document.body.classList.add('image-open');
}

function closeImageOverlay() {
    if (!imageOverlay) return;
    imageOverlay.classList.add('hidden');
    imageOverlay.classList.remove('fade-in');
    document.body.classList.remove('image-open');
    if (overlayImage) overlayImage.classList.remove('gift-image');
    if (overlayImage) overlayImage.src = '';
}
