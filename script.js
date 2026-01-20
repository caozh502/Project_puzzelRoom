// 这是一个点击式解谜游戏，通过显示/隐藏 .scene 类来切换房间，通过 showDialogue 函数显示对话。
const gameState = {
    inventory: [],
    currentText: "",
    isTyping: false
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
    showDialogue("又是忙碌的一天，先四处看看吧。");
    
    // 定义每个物品的自定义尺寸数据
    const objectConfigs = {
        'wardrobe': { padding: '145px 85px', top: '300px', left: '600px' },
        'monitor':  { padding: '34px 39px', top: '350px', left: '100px' },
        'trash-can': { padding: '10px', top: '480px', left: '120px' },
        'green-cabinet': { padding: '10px', top: '420px', left: '160px' },
        'plant': { padding: '10px', top: '360px', left: '640px' },
        'washer': { padding: '10px', top: '300px', left: '680px' }
    };

    // 循环遍历并应用样式
    Object.keys(objectConfigs).forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            Object.assign(el.style, objectConfigs[id]);
        }
    });

    // 音频控制
    const bgm = document.getElementById('bgm');
    const clickSfx = document.getElementById('click-sfx');
    const muteBtn = document.getElementById('mute-btn');
    let isMuted = false;

    // 设置音量为50%
    bgm.volume = 0.2;
    clickSfx.volume = 0.3;

    // 尝试自动播放背景音乐，如果失败则在第一次点击时播放
    bgm.play().catch(() => {
        let bgmStarted = false;
        document.body.addEventListener('click', () => {
            if (!bgmStarted) {
                bgm.play();
                bgmStarted = true;
            }
        });
    });

    // 静音按钮事件
    muteBtn.addEventListener('click', () => {
        isMuted = !isMuted;
        bgm.muted = isMuted;
        clickSfx.muted = isMuted;
        muteBtn.textContent = isMuted ? '🔇' : '🔊';
    });

    // 鼠标点击音效
    document.body.addEventListener('click', () => {
        if (!isMuted) {
            clickSfx.currentTime = 0;
            clickSfx.play();
        }
    });
};