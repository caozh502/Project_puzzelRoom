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
document.getElementById('fridge').addEventListener('click', () => {
    showDialogue("冰箱上贴着个数字：584。");
    if(!gameState.inventory.includes("碟子(584)")) {
        gameState.inventory.push("碟子(584)");
        updateInventory();
    }
});

document.getElementById('cat-litter').addEventListener('click', () => {
    showDialogue("猫砂盆清理干净了，小猫应该会很开心。");
});

document.getElementById('trash-can').addEventListener('click', () => {
    showDialogue("在废纸篓里翻了很久，找到了住宅平面图！");
});

function updateInventory() {
    document.getElementById('inventory-display').innerText = "物品栏: " + gameState.inventory.join(", ");
}

// 开场白
window.onload = () => {
    showDialogue("又是忙碌的一天，先四处看看吧。");
};