// 这是一个点击式解谜游戏，通过显示/隐藏 .scene 类来切换房间，通过 showDialogue 函数显示对话。
const gameState = {
    inventory: [],
    currentText: "",
    isTyping: false
};

let imgWidth, imgHeight;
// 调试开关：禁用梦境开场（眨眼+去模糊）
const ENABLE_DREAM_INTRO = false;

const updatePositions = () => {
    if (!imgWidth || !imgHeight) return; // 图片未加载
    
    // 删除之前的调试信息
    document.querySelectorAll('.debug-info').forEach(d => d.remove());
    
    // 获取当前激活的场景
    const currentScene = document.querySelector('.scene.active');
    
    // 定义每个物品相对于图片的百分比位置和padding（padding格式: 'top% right%'，top/bottom相对于imgHeight，left/right相对于imgWidth）
    const objectConfigs = {
        'wardrobe': { padding: '9% 8%', top: '50%', left: '80%' },
        'monitor':  { padding: '4% 4%', top: '58%', left: '13%' },
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
    if (gameState.isTyping) return;
    
    diagBox.classList.remove('hidden');
    gameState.isTyping = true;
    diagText.innerText = "";
    
    let i = 0;
    const speed = 50; // 打字速度（毫秒）

    function type() {
        if (i < text.length) {
            diagText.innerText += text.charAt(i);
            i++;
            setTimeout(type, speed);
        } else {
            gameState.isTyping = false;
        }
    }
    type();
}

// 点击对话框关闭
diagBox.addEventListener('click', () => {
    if (!gameState.isTyping) {
        diagBox.classList.add('hidden');
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
    // 启动：根据开关选择是否执行梦境开场
    const container = document.getElementById('game-container');
    const overlay = document.getElementById('dream-overlay');
    if (ENABLE_DREAM_INTRO && container && overlay) {
        container.classList.add('dimmed');
        container.classList.add('dreaming');
        overlay.classList.add('blink');
        overlay.addEventListener('animationend', () => {
            overlay.remove();
        });
        container.addEventListener('animationend', (e) => {
            if (e.animationName === 'dreamUnblur') {
                container.classList.remove('dreaming');
                showDialogue("我刚刚还躺在床上，怎么现在在客厅里了？房间好昏暗……");
            }
        });
    } else {
        // 调试：禁用梦境开场，但保持昏暗效果不受影响
        if (overlay) overlay.remove();
        if (container) {
            container.classList.remove('dreaming');
            container.classList.add('dimmed');
        }
        showDialogue("我刚刚还躺在床上，怎么现在在客厅里了？房间好昏暗……");
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

    // 音频控制
    const bgm = document.getElementById('bgm');
    const clickSfx = document.getElementById('click-sfx');
    const muteBtn = document.getElementById('mute-btn');
    const hideBtn = document.getElementById('hide-btn');
        const lightSwitch = document.getElementById('light-switch');
    let isMuted = false;
    let interactivesHidden = false;

    // 设置音量
    bgm.volume = 0.2;
    clickSfx.volume = 0.3;

    // 静音按钮事件
    muteBtn.addEventListener('click', () => {
        isMuted = !isMuted;
        bgm.muted = isMuted;
        clickSfx.muted = isMuted;
        muteBtn.textContent = isMuted ? '🔇' : '🔊';
    });

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
            showDialogue("打开了灯，房间恢复明亮。");
        });

    // 鼠标点击音效
    document.body.addEventListener('click', () => {
        if (!isMuted) {
            clickSfx.currentTime = 0;
            clickSfx.play();
        }
    });
};