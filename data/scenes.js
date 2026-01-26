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
        footStepsSfx: { volume: 0.6, delayMs: 1000 },
        guitarSfx: { volume: 0.3 },
        violinSfx: { volume: 0.3 },
        pianoSfx: { volume: 0.3 },
        showerSfx: { volume: 0.5, loop: true }
    },
    audioSources: {
        bgm: 'assets/Audio/MainMenu_BGM.mp3',
        clickSfx: 'assets/Audio/mouseClick_SFX.mp3',
        lightSfx: 'assets/Audio/lightOn_SFX.mp3',
        startDotSfx: 'assets/Audio/startDot_SFX.mp3',
        wakeUpSfx: 'assets/Audio/wakeUp_SFX.mp3',
        doorOpenSfx: 'assets/Audio/doorOpen_SFX.mp3',
        footStepsSfx: 'assets/Audio/footSteps_SFX.mp3',
        showerSfx: 'assets/Audio/shower_SFX.mp3',
        guitarSfx: 'assets/Audio/guitar_pizz_SFX.m4a',
        violinSfx: 'assets/Audio/violin_pizz_SFX.m4a',
        pianoSfx: 'assets/Audio/piano_SFX.mp3'
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
            onEnterDialogue: '走廊里通向各个房间。',
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
            background: {
                type: 'image',
                value: 'assets/Picture/study.png',
                size: '100% 100%',
                position: 'center',
                repeat: 'no-repeat'
            }
        },
        
    },
    objectConfigs: {
        wardrobe: { padding: '25% 7%', top: '50%', left: '7%' },
        monitor: { padding: '3% 7%', top: '58%', left: '48%' },
        violin: { padding: '6% 2%', top: '38%', left: '22%' },
        guitar: { padding: '11% 4%', top: '38%', left: '14%' },
        'electric-piano': { padding: '9% 10%', top: '78%', left: '22%' },
        bookcase: { padding: '7% 5%', top: '45%', left: '30%' },
        'storage-box': { padding: '2% 4%', top: '23%', left: '30%' },
        'startrail-photo': { padding: '2.4% 3%', top: '35.3%', left: '47%' },
        'sakura-photo': { padding: '1.5% 1.5%', top: '34%', left: '52%' },
        'sunset-photo': { padding: '1.5% 1.5%', top: '45%', left: '48%' },
        'couple-photo': { padding: '2.5% 2.5%', top: '43.5%', left: '53.5%' },
        'gift-box': { padding: '1.2% 1.2%', top: '46%', left: '52%' },
        'landscape-venice-photo': { padding: '7% 10%', top: '39%', left: '40%' },
        'vanity-table': { padding: '10%', top: '68%', left: '88%' },
        'balcony-chair': { padding: '6%', top: '78%', left: '84%' },
        'bbq-grill': { padding: '3% 5%', top: '58%', left: '80%' },
        'light-switch': { padding: '0.8% 0.6%', top: '48.5%', left: '17.8%' },
        'bathroom-door': { padding: '17% 12%', top: '52%', left: '47%' },
        'swan-photo': { padding: '8% 8%', top: '39%', left: '12%' },
        doorToHallwayFromLivingroom: { padding: '8% 2%', top: '48%', left: '66%' },
        doorToHallwayFromBedroom: { padding: '8% 3%', top: '39%', left: '23%' },
        doorToLivingroomFromHallway: { padding: '47% 10%', top: '54%', left: '90%' },
        doorToBedroomFromHallway: { padding: '3%', top: '96%', left: '49%' },
        hintToBedroomFromHallway: { padding: '0', top: '95%', left: '49%' },
        doorToStudyFromHallway: { padding: '20% 3%', top: '53%', left: '26%' },
        doorToHallwayFromStudy: { padding: '3%', top: '96%', left: '49%' },
        hintToHallwayFromStudy: { padding: '0', top: '95%', left: '49%' }
    },
    interactions: [
        { id: 'wardrobe', text: '衣柜里放满了衣服，看起来很整洁，有一股洗衣液的香味。' },
        { id: 'monitor', text: '显示器屏幕上显示着一些代码，好像是一个游戏demo。' },
        { id: 'violin', text: '小提琴安静地靠在角落，漆面有轻微的磨损。' },
        { id: 'guitar', text: '吉他的音好像不太准，看来有一阵子没练习了。' },
        { id: 'electric-piano', text: 'Donner电钢琴，当时花了不少钱咬牙买下的，谁叫木头的纹理让人心痒痒呢。' },
        { id: 'bookcase', text: '书柜里塞了一些乐谱和书。' },
        { id: 'storage-box', text: '杂物盒里堆着一些圣诞树的装饰品。' },
        { id: 'startrail-photo', text: '那一晚的星空很美，两个人一起静静地等待着照片的出炉，有一搭没一搭地聊着天。' },
        { id: 'sakura-photo', text: '参加摄影比赛落选的樱花，不过照片的色调很柔和。' },
        { id: 'sunset-photo', text: '加尔达湖边的日落，安静而美好。' },
        { id: 'couple-photo', text: '双人合照里的笑容很自然。' },
        { id: 'landscape-venice-photo', text: '日落时分，威尼斯的水面闪烁着金光。' },
        { id: 'vanity-table', text: '梳妆台上摆着一些护肤品，下面的抽屉没关好，顺手带上吧。' },
        { id: 'balcony-chair', text: '藤椅很适合在阳台上发呆一下午。' },
        { id: 'bbq-grill', text: '烧烤炉还留着一股炭火味，比几年前买的那个小电烤炉烤的更香了。' },
        { id: 'bathroom-door', text: '浴室里传来哗啦啦的水声，透过玻璃看里面热气蒸腾，应该是家里那位正在洗澡。' },
        { id: 'swan-photo', text: '湖面像雕塑一样，波光粼粼。' }
    ]
};
