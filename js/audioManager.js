// audioManager.js —— 音频管理模块
// 加载、播放、静音、BGM控制
// 使用 var 暴露到全局作用域，供其他模块直接引用

// --- 音频元素引用（全局可见）---
var detectiveBGM, clickSfx, clickDotSfx, lightSfx, startDotSfx, wakeUpSfx, doorOpenSfx, footStepsSfx;
var guitarSfx, violinSfx, pianoSfx, showerSfx, birdsChirpingSfx, drawerCloseSfx, drillScrewSfx;
var fridgeOpenSfx, fridgeCloseSfx, openBottleSfx, drinkSojuSfx, findOpenerSfx, clothRemoveSfx, finalBgm, bookOpenSfx;
var isMuted = false;

// --- 工具方法 ---
function playSfx(audio) {
    if (!audio || isMuted) return;
    audio.currentTime = 0;
    audio.play();
}

function ensureDetectiveBgm() {
    if (!detectiveBGM) return;
    if (!gameState.flags.detectiveBgmStarted) {
        gameState.flags.detectiveBgmStarted = true;
        detectiveBGM.loop = true;
        try { detectiveBGM.play(); } catch (_) {}
    } else if (detectiveBGM.paused && !isMuted) {
        try { detectiveBGM.play(); } catch (_) {}
    }
}

function stopDetectiveBgm() {
    if (!detectiveBGM) return;
    detectiveBGM.pause();
}

function playFinalBgm() {
    if (!finalBgm) return;
    stopDetectiveBgm();
    finalBgm.currentTime = 0;
    try { finalBgm.play(); } catch (_) {}
}

function playSojuOpeningSequence(onComplete) {
    const finalCb = typeof onComplete === 'function' ? onComplete : () => {};
    const seq = [openBottleSfx, drinkSojuSfx].filter(Boolean);
    if (isMuted || seq.length === 0) {
        finalCb();
        return;
    }

    const playAt = (idx) => {
        if (idx >= seq.length) {
            finalCb();
            return;
        }
        const audio = seq[idx];
        if (!audio) {
            playAt(idx + 1);
            return;
        }
        audio.currentTime = 0;
        const cleanup = () => {
            audio.onended = null;
            audio.onerror = null;
        };
        audio.onended = () => {
            cleanup();
            playAt(idx + 1);
        };
        audio.onerror = () => {
            cleanup();
            playAt(idx + 1);
        };
        const played = audio.play();
        if (played && typeof played.then === 'function') {
            played.catch(() => {
                cleanup();
                playAt(idx + 1);
            });
        }
    };
    playAt(0);
}

// --- 初始化 ---
function cacheAudioElements() {
    detectiveBGM = document.getElementById('detective-bgm');
    clickSfx = document.getElementById('click-sfx');
    clickDotSfx = document.getElementById('clickdot-sfx');
    lightSfx = document.getElementById('light-sfx');
    startDotSfx = document.getElementById('startdot-sfx');
    wakeUpSfx = document.getElementById('wake-up-sfx');
    doorOpenSfx = document.getElementById('door-open-sfx');
    footStepsSfx = document.getElementById('footsteps-sfx');
    guitarSfx = document.getElementById('guitar-sfx');
    violinSfx = document.getElementById('violin-sfx');
    pianoSfx = document.getElementById('piano-sfx');
    birdsChirpingSfx = document.getElementById('birds-chirping-sfx');
    bookOpenSfx = document.getElementById('book-open-sfx');
    clothRemoveSfx = document.getElementById('cloth-remove-sfx');
    showerSfx = document.getElementById('shower-sfx');
    finalBgm = document.getElementById('final-bgm');
    drawerCloseSfx = document.getElementById('drawer-close-sfx');
    drillScrewSfx = document.getElementById('drill-screw-sfx');
    fridgeOpenSfx = document.getElementById('fridge-open-sfx');
    fridgeCloseSfx = document.getElementById('fridge-close-sfx');
    openBottleSfx = document.getElementById('open-bottle-sfx');
    drinkSojuSfx = document.getElementById('drink-soju-sfx');
    findOpenerSfx = document.getElementById('find-opener-sfx');
}

function initAudio() {
    const audioMap = {
        detectiveBGM, clickSfx, clickDotSfx, lightSfx, startDotSfx,
        wakeUpSfx, doorOpenSfx, footStepsSfx, guitarSfx, violinSfx,
        pianoSfx, birdsChirpingSfx, bookOpenSfx, clothRemoveSfx, showerSfx,
        drawerCloseSfx, drillScrewSfx, fridgeOpenSfx, fridgeCloseSfx,
        openBottleSfx, drinkSojuSfx, findOpenerSfx, finalBgm
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

    const muteBtn = document.getElementById('mute-btn');
    if (muteBtn) {
        muteBtn.addEventListener('click', () => {
            isMuted = !isMuted;
            Object.values(audioMap).forEach(el => {
                if (el) el.muted = isMuted;
            });
            muteBtn.textContent = isMuted ? '🔇' : '🔊';
        });
    }
}

function initDoorAudioForNavButtons() {
    const delayMs = (AUDIO_CONFIGS.footStepsSfx && typeof AUDIO_CONFIGS.footStepsSfx.delayMs === 'number')
        ? AUDIO_CONFIGS.footStepsSfx.delayMs : 1000;

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            playSfx(doorOpenSfx);
            setTimeout(() => playSfx(footStepsSfx), delayMs);
        });
    });
}
