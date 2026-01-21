// --- 梦境开场封装 ---
function startDreamIntro(container, overlay, onUnblurEnd) {
    if (!container || !overlay) return;
    // 显示覆盖层并启动眨眼动画
    overlay.classList.remove('hidden');
    container.classList.add('dreaming');
    overlay.classList.add('blink');
    // 覆盖层动画结束后移除自身
    overlay.addEventListener('animationend', () => {
        overlay.remove();
    }, { once: true });
    // 去模糊动画结束后移除 dreaming 并触发回调
    container.addEventListener('animationend', (e) => {
        if (e.animationName === 'dreamUnblur') {
            container.classList.remove('dreaming');
            if (typeof onUnblurEnd === 'function') onUnblurEnd();
        }
    }, { once: true });
}
// 这是一个点击式解谜游戏，通过显示/隐藏 .scene 类来切换房间，通过 showDialogue 函数显示对话。
const gameState = {
    inventory: [],
    currentText: "",
    isTyping: false,
    dialogueQueue: [],
    justCompleted: false
};

// 记录打字计时器以便可取消
let typingTimer = null;

let imgWidth, imgHeight;
// 引导阶段标记与全局元素引用
let introPhase = true;
let imageOverlay, overlayImage, startDot;
// 调试开关：禁用梦境开场（眨眼+去模糊）
const ENABLE_DREAM_INTRO = true;

const updatePositions = () => {
    if (!imgWidth || !imgHeight) return; // 图片未加载
    
    // 删除之前的调试信息
    document.querySelectorAll('.debug-info').forEach(d => d.remove());
    
    // 获取当前激活的场景
    const currentScene = document.querySelector('.scene.active');
    
    // 定义每个物品相对于图片的百分比位置和padding（padding格式: 'top% right%'，top/bottom相对于imgHeight，left/right相对于imgWidth）
    const objectConfigs = {
        'wardrobe': { padding: '9% 8%', top: '50%', left: '80%' },
        'monitor':  { padding: '2% 4%', top: '58%', left: '13%' },
        'gift-box': { padding: '1.2% 1.2%', top: '46%', left: '52%' },
        'trash-can': { padding: '1.5%', top: '80%', left: '15%' },
        'green-cabinet': { padding: '1.5%', top: '70%', left: '20%' },
        'plant': { padding: '1.5%', top: '60%', left: '80%' },
        'washer': { padding: '1.5%', top: '50%', left: '85%' },
        'light-switch': { padding: '0.5% 0.5%', top: '52%', left: '63%' }
    };
    
    // 计算图片显示参数 
    const container = document.getElementById('game-container');
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const scale = Math.min(containerWidth / imgWidth, containerHeight / imgHeight);
    const displayWidth = imgWidth * scale;
    const displayHeight = imgHeight * scale;
    const offsetX = (containerWidth - displayWidth) / 2;
    const offsetY = (containerHeight - displayHeight) / 2;
    
    // 应用位置
    Object.keys(objectConfigs).forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const config = objectConfigs[id];
            const topPercent = parseFloat(config.top) / 100;
            const leftPercent = parseFloat(config.left) / 100;
            const newTop = topPercent * imgHeight * scale + offsetY;
            const newLeft = leftPercent * imgWidth * scale + offsetX;
            const topPct = (newTop / containerHeight) * 100;
            const leftPct = (newLeft / containerWidth) * 100;
            el.style.top = topPct + '%';
            el.style.left = leftPct + '%';
            
            // 解析padding: 'top% right%' -> top/bottom: top% of imgHeight, left/right: right% of imgWidth
            const paddingParts = config.padding.split(' ');
            const paddingTopPercent = parseFloat(paddingParts[0]) / 100;
            const paddingRightPercent = parseFloat(paddingParts[1]) / 100;
            const paddingTop = paddingTopPercent * imgHeight * scale;
            const paddingRight = paddingRightPercent * imgWidth * scale;
            el.style.padding = config.padding;
            
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
                debugInfo.style.top = newTop + 'px'; // 与物品顶部对齐
                debugInfo.style.left = (newLeft + el.offsetWidth / 2 + 5) + 'px'; // 在物品视觉右侧5px
                container.appendChild(debugInfo);
            }
        }
    });
};

// --- 对话系统 ---
const diagBox = document.getElementById('dialogue-box');
const diagText = document.getElementById('dialogue-text');

function showDialogue(text) {
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
    const speed = 50; // 打字速度（毫秒）

    function type() {
        // 若已被点击完成，则终止打字
        if (!gameState.isTyping) return;
        if (i < gameState.currentText.length) {
            diagText.innerText += gameState.currentText.charAt(i);
            i++;
            typingTimer = setTimeout(type, speed);
        } else {
            gameState.isTyping = false;
            typingTimer = null;
        }
    }
    type();
}

// 点击对话框关闭
diagBox.addEventListener('click', () => {
    // 若仍在打字，立即完成显示当前文本，再次点击才关闭
    if (gameState.isTyping) {
        gameState.isTyping = false;
        if (typingTimer) {
            clearTimeout(typingTimer);
            typingTimer = null;
        }
        diagText.innerText = gameState.currentText || diagText.innerText;
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

    // 引导阶段：当文本框消失后，进入客厅场景，并结束引导
    if (introPhase) {
        // 关闭图片覆盖层与模糊
        if (imageOverlay) {
            imageOverlay.classList.add('hidden');
        }
        document.body.classList.remove('image-open');
        if (overlayImage) overlayImage.src = '';
        // 退出仅光点模式
        document.body.classList.remove('intro');
        // 进入客厅场景，并设置为未开灯（昏暗）状态
        goToScene('livingroom');
        const container = document.getElementById('game-container');
        if (container) container.classList.add('dimmed');
        // 在切换到客厅后启动梦境开场效果（眨眼 + 去模糊）
        const overlay = document.getElementById('dream-overlay');
        if (ENABLE_DREAM_INTRO && container && overlay) {
            startDreamIntro(container, overlay);
        }
        // 移除开始光点
        if (startDot) startDot.remove();
        introPhase = false;
    }
});

// --- 场景切换 ---
function goToScene(sceneId) {
    document.querySelectorAll('.scene').forEach(s => s.classList.remove('active'));
    document.getElementById(`scene-${sceneId}`).classList.add('active');
    
    if(sceneId === 'bedroom') showDialogue("卧室里乱糟糟的...");
    
    // 更新物品位置和调试信息
    updatePositions();
}

// --- 互动逻辑 ---
document.getElementById('wardrobe').addEventListener('click', () => {
    showDialogue("衣柜里放满了衣服，看起来很整洁。");
});

document.getElementById('monitor').addEventListener('click', () => {
    showDialogue("显示器屏幕上显示着一些代码。");
});

document.getElementById('trash-can').addEventListener('click', () => {
    showDialogue("在废纸篓里翻了很久，找到了住宅平面图！");
});

document.getElementById('green-cabinet').addEventListener('click', () => {
    showDialogue("绿色柜子里有一些旧书。");
});

document.getElementById('plant').addEventListener('click', () => {
    showDialogue("阳台上的植物看起来需要浇水。");
});

document.getElementById('washer').addEventListener('click', () => {
    showDialogue("洗衣机里有一些待洗的衣服。");
});

function updateInventory() {
    document.getElementById('inventory-display').innerText = "物品栏: " + gameState.inventory.join(", ");
}

// 开场白
window.onload = () => {
    // 引导阶段：仅显示闪烁光点
    document.body.classList.add('intro');

    // 启动：根据开关选择是否执行梦境开场
    const container = document.getElementById('game-container');
    const overlay = document.getElementById('dream-overlay');
        // 仅当非引导阶段时才在启动应用梦境开场效果
        if (ENABLE_DREAM_INTRO && container && overlay && !introPhase) {
        container.classList.add('dimmed');
            startDreamIntro(container, overlay, () => {
                showDialogue("我刚刚还躺在床上，怎么现在在客厅里了？房间好昏暗……");
                showDialogue("让我找找开灯的开关吧。");
            });
    } else {
            // 启动时不应用梦境开场：保留覆盖层以备后续使用
        if (container) {
            container.classList.remove('dreaming');
            // 初始不强制昏暗，因为还未进入场景
            container.classList.remove('dimmed');
        }
    }
    
    // 获取图片尺寸并调整物品位置
    const img = new Image();
    img.src = 'assets/Picture/room.png';
    
    img.onload = () => {
        imgWidth = img.naturalWidth;
        imgHeight = img.naturalHeight;
        updatePositions();
    };
    
    // 监听窗口大小变化，动态调整位置
    window.addEventListener('resize', updatePositions);

    // 全局点击（捕获阶段）：打字时任意点击立即完成剩余文字
    document.addEventListener('click', (e) => {
        if (!diagBox.classList.contains('hidden') && gameState.isTyping) {
            gameState.isTyping = false;
            if (typingTimer) {
                clearTimeout(typingTimer);
                typingTimer = null;
            }
            diagText.innerText = gameState.currentText || diagText.innerText;
            gameState.justCompleted = true;
        }
    }, true);

    // 音频控制
    const bgm = document.getElementById('bgm');
    const clickSfx = document.getElementById('click-sfx');
    const lightSfx = document.getElementById('light-sfx');
    const startDotSfx = document.getElementById('startdot-sfx');
    const muteBtn = document.getElementById('mute-btn');
    const hideBtn = document.getElementById('hide-btn');
    const lightSwitch = document.getElementById('light-switch');
    imageOverlay = document.getElementById('image-overlay');
    overlayImage = document.getElementById('overlay-image');
    startDot = document.getElementById('start-dot');
    const giftBox = document.getElementById('gift-box');
    let isMuted = false;
    let interactivesHidden = false;

    // 设置音量
    bgm.volume = 0.2;
    clickSfx.volume = 0.1;
    lightSfx.volume = 0.6;
    startDotSfx.volume = 0.5;

    // 静音按钮事件
    muteBtn.addEventListener('click', () => {
        isMuted = !isMuted;
        bgm.muted = isMuted;
        clickSfx.muted = isMuted;
        lightSfx.muted = isMuted;
        startDotSfx.muted = isMuted;
        muteBtn.textContent = isMuted ? '🔇' : '🔊';
    });
    // 开始光点音效：引导阶段循环播放，点击后停止
    if (introPhase && !isMuted) {
        try { startDotSfx.play(); } catch (_) {}
    }

    // 隐藏互动框按钮事件（保持点击有效）
    hideBtn.addEventListener('click', () => {
        interactivesHidden = !interactivesHidden;
        document.body.classList.toggle('hide-interactives', interactivesHidden);
        // 图标：显示状态切换
        hideBtn.textContent = interactivesHidden ? '🙈' : '👁️';
        hideBtn.title = interactivesHidden ? '显示互动框' : '隐藏互动框';
    });

        // 开灯互动：移除昏暗效果
        lightSwitch.addEventListener('click', () => {
            const container = document.getElementById('game-container');
            container.classList.remove('dimmed');
            if (!isMuted) {
                lightSfx.currentTime = 0;
                lightSfx.play();
            }
            showDialogue("打开了灯，房间恢复明亮。");
        });

    // 礼物盒互动：显示图片并模糊背景
    giftBox.addEventListener('click', () => {
        if (overlayImage && imageOverlay) {
            overlayImage.src = 'assets/Picture/gift.png';
            imageOverlay.classList.remove('hidden');
            document.body.classList.add('image-open');
        }
    });

    // 点击覆盖层关闭图片并恢复背景
    imageOverlay.addEventListener('click', () => {
        imageOverlay.classList.add('hidden');
        document.body.classList.remove('image-open');
        overlayImage.src = '';
    });

    // 鼠标点击音效
    document.body.addEventListener('click', () => {
        if (!isMuted) {
            clickSfx.currentTime = 0;
            clickSfx.play();
        }
    });
    // 引导光点点击：展示礼物图片与引导文本
    startDot.addEventListener('click', () => {
        // 停止光点音效
        if (startDotSfx) { startDotSfx.pause(); startDotSfx.currentTime = 0; }
        // 保持仅光点模式，直到对话关闭后再进入场景与梦境效果
        if (overlayImage && imageOverlay) {
            overlayImage.src = 'assets/Picture/gift.png';
            imageOverlay.classList.remove('hidden');
            document.body.classList.add('image-open');
        }
        showDialogue("等了你好久了，这是开启未来的钥匙……");
    });
};