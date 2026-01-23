// 数据驱动配置：场景、交互文本、物品位置
window.GAME_CONFIG = {
    startScene: 'intro',
    introEndScene: 'bedroom',
    initialState: {
        inventory: [],
        flags: {},
        visitedScenes: {}
    },
    audio: {
        bgm: { volume: 0.2, loop: true, autoplay: false },
        clickSfx: { volume: 0.1 },
        lightSfx: { volume: 0.6 },
        startDotSfx: { volume: 0.1, loop: false },
        wakeUpSfx: { volume: 0.5 },
        doorOpenSfx: { volume: 0.3 },
        footStepsSfx: { volume: 0.6, delayMs: 1000 }
    },
    audioSources: {
        bgm: 'assets/Audio/MainMenu_BGM.mp3',
        clickSfx: 'assets/Audio/mouseClick_SFX.mp3',
        lightSfx: 'assets/Audio/lightOn_SFX.mp3',
        startDotSfx: 'assets/Audio/startDot_SFX.mp3',
        wakeUpSfx: 'assets/Audio/wakeUp_SFX.mp3',
        doorOpenSfx: 'assets/Audio/doorOpen_SFX.mp3',
        footStepsSfx: 'assets/Audio/footSteps_SFX.mp3'
    },
    scenes: {
        intro: {
            id: 'intro',
            background: { type: 'color', value: '#000' }
        },
        livingroom: {
            id: 'livingroom',
            background: {
                type: 'image',
                value: 'assets/Picture/livingroom.png',
                size: '100% 100%',
                position: 'center',
                repeat: 'no-repeat'
            }
        },
        bedroom: {
            id: 'bedroom',
            onEnterDialogue: [
                '呜…好困…',
                '刚刚的梦感觉好真实……',
                '房间太暗了，先把灯打开吧…'
            ],
            background: {
                type: 'image',
                value: 'assets/Picture/bedroom.png',
                size: '100% 100%',
                position: 'center',
                repeat: 'no-repeat'
            }
        },
        hallway: {
            id: 'hallway',
            onEnterDialogue: '刚刚做了个奇怪的梦……',
            background: {
                type: 'image',
                value: 'assets/Picture/hallway.png',
                size: '100% 100%',
                position: 'center',
                repeat: 'no-repeat'
            }
        },
        study: {
            id: 'study',
            background: { type: 'color', value: '#c9ada7' }
        },
        balcony: {
            id: 'balcony',
            background: { type: 'color', value: '#c9ada7' }
        }
    },
    objectConfigs: {
        wardrobe: { padding: '25% 7%', top: '50%', left: '7%' },
        monitor: { padding: '2% 4%', top: '58%', left: '13%' },
        'gift-box': { padding: '1.2% 1.2%', top: '46%', left: '52%' },
        'landscape-photo': { padding: '10%', top: '39%', left: '40%' },
        'vanity-table': { padding: '10%', top: '68%', left: '88%' },
        'potted-plant': { padding: '1.5%', top: '60%', left: '80%' },
        'balcony-chair': { padding: '1.5%', top: '50%', left: '85%' },
        'bbq-grill': { padding: '1.5%', top: '70%', left: '60%' },
        'light-switch': { padding: '0.5% 0.5%', top: '47.5%', left: '18%' },
        doorToHallwayFromLivingroom: { padding: '8% 2%', top: '48%', left: '66%' },
        doorToHallwayFromBedroom: { padding: '8% 3%', top: '39%', left: '23%' },
        doorToLivingroomFromHallway: { padding: '47% 10%', top: '54%', left: '90%' },
        doorToBedroomFromHallway: { padding: '3%', top: '96%', left: '49%' },
        hintToBedroomFromHallway: { padding: '0', top: '95%', left: '49%' },
        doorToStudyFromHallway: { padding: '20% 3%', top: '53%', left: '26%' },
        doorToHallwayFromStudy: { padding: '8% 3%', top: '39%', left: '23%' },
        doorToBalconyFromStudy: { padding: '10% 10%', top: '30%', left: '85%' },
        doorToStudyFromBalcony: { padding: '10% 10%', top: '30%', left: '5%' }
    },
    interactions: [
        { id: 'wardrobe', text: '衣柜里放满了衣服，看起来很整洁。' },
        { id: 'monitor', text: '显示器屏幕上显示着一些代码。' },
        { id: 'landscape-photo', text: '这张风景照让人心里安静。' },
        { id: 'vanity-table', text: '梳妆台上摆着一些饰品。' },
        { id: 'potted-plant', text: '盆栽长势不错，叶子很有精神。' },
        { id: 'balcony-chair', text: '藤椅很适合在阳台上发呆。' },
        { id: 'bbq-grill', text: '烧烤炉还留着一股炭火味。' }
    ]
};
