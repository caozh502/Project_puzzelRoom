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
    scenes: {
        intro: {
            id: 'intro',
            background: { type: 'color', value: '#000' }
        },
        livingroom: {
            id: 'livingroom',
            background: {
                type: 'image',
                value: 'assets/Picture/room.png',
                size: '100% 100%',
                position: 'center',
                repeat: 'no-repeat'
            }
        },
        bedroom: {
            id: 'bedroom',
            onEnterDialogue: '好困呀……',
            background: {
                type: 'image',
                value: 'assets/Picture/bedroom.png',
                size: '100% 100%',
                position: 'center',
                repeat: 'no-repeat'
            }
        },
        balcony: {
            id: 'balcony',
            background: { type: 'color', value: '#c9ada7' }
        }
    },
    objectConfigs: {
        wardrobe: { padding: '9% 8%', top: '50%', left: '80%' },
        monitor: { padding: '2% 4%', top: '58%', left: '13%' },
        'gift-box': { padding: '1.2% 1.2%', top: '46%', left: '52%' },
        'trash-can': { padding: '1.5%', top: '80%', left: '15%' },
        'green-cabinet': { padding: '1.5%', top: '70%', left: '20%' },
        plant: { padding: '1.5%', top: '60%', left: '80%' },
        washer: { padding: '1.5%', top: '50%', left: '85%' },
        'light-switch': { padding: '0.5% 0.5%', top: '47.5%', left: '18%' },
        doorToBedroomFromLivingroom: { padding: '10% 10%', top: '30%', left: '5%' },
        doorToLivingroom: { padding: '10% 10%', top: '30%', left: '5%' },
        doorToBalcony: { padding: '10% 10%', top: '30%', left: '85%' },
        doorToBedroomFromBalcony: { padding: '10% 10%', top: '30%', left: '5%' }
    },
    interactions: [
        { id: 'wardrobe', text: '衣柜里放满了衣服，看起来很整洁。' },
        { id: 'monitor', text: '显示器屏幕上显示着一些代码。' },
        { id: 'trash-can', text: '在废纸篓里翻了很久，找到了住宅平面图！' },
        { id: 'green-cabinet', text: '绿色柜子里有一些旧书。' },
        { id: 'plant', text: '阳台上的植物看起来需要浇水。' },
        { id: 'washer', text: '洗衣机里有一些待洗的衣服。' }
    ]
};
