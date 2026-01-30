// 数据驱动配置：场景、交互文本、物品位置
window.GAME_CONFIG = {
    startScene: 'intro',
    introEndScene: 'study',
    initialState: {
        inventory: [],
        flags: {},
        visitedScenes: {}
    },
    audio: {
        detectiveBGM: { volume: 0.2, loop: true, autoplay: false },
        clickSfx: { volume: 0.1 },
        lightSfx: { volume: 0.6 },
        startDotSfx: { volume: 0.1, loop: false },
        wakeUpSfx: { volume: 0.5 },
        doorOpenSfx: { volume: 0.3 },
        footStepsSfx: { volume: 0.6, delayMs: 1000 },
        guitarSfx: { volume: 0.3 },
        violinSfx: { volume: 0.3 },
        pianoSfx: { volume: 0.3 },
        clothRemoveSfx: { volume: 0.6 },
        showerSfx: { volume: 0.5, loop: true },
        drawerCloseSfx: { volume: 0.5 },
        drillScrewSfx: { volume: 0.5 },
        fridgeOpenSfx: { volume: 0.6 },
        fridgeCloseSfx: { volume: 0.6 },
        openBottleSfx: { volume: 0.6 },
        drinkSojuSfx: { volume: 0.6 },
        findOpenerSfx: { volume: 0.3 }
    },
    audioSources: {
        detectiveBGM: 'assets/Audio/loveDetective_BGM.mp3',
        clickSfx: 'assets/Audio/mouseClick_SFX.mp3',
        lightSfx: 'assets/Audio/lightOn_SFX.mp3',
        startDotSfx: 'assets/Audio/startDot_SFX.mp3',
        wakeUpSfx: 'assets/Audio/wakeUp_SFX.mp3',
        doorOpenSfx: 'assets/Audio/doorOpen_SFX.mp3',
        footStepsSfx: 'assets/Audio/footSteps_SFX.mp3',
        showerSfx: 'assets/Audio/shower_SFX.mp3',
        guitarSfx: 'assets/Audio/guitar_pizz_SFX.m4a',
        violinSfx: 'assets/Audio/violin_pizz_SFX.m4a',
        pianoSfx: 'assets/Audio/piano_SFX.mp3',
        clothRemoveSfx: 'assets/Audio/clothRemove_SFX.mp3',
        drawerCloseSfx: 'assets/Audio/drawerClose_SFX.mp3',
        drillScrewSfx: 'assets/Audio/drillScrew_SFX.mp3',
        fridgeOpenSfx: 'assets/Audio/fridgeOpen_SFX.mp3',
        fridgeCloseSfx: 'assets/Audio/fridgeClose_SFX.mp3',
        openBottleSfx: 'assets/Audio/openBottle_SFX.mp3',
        drinkSojuSfx: 'assets/Audio/drinkSoju.mp3',
        findOpenerSfx: 'assets/Audio/findOpener_SFX.mp3'
    },
    // 交互展示图片与其他独立图片的统一映射
    imageSources: {
        'couple-photo': 'assets/Picture/couple.jpg',
        'landscape-venice-photo': 'assets/Picture/landscape-venice.jpg',
        'sakura-photo': 'assets/Picture/sakura.jpg',
        'startrail-photo': 'assets/Picture/startrail.jpg',
        'sunset-photo': 'assets/Picture/sunset.JPG',
        'swan-photo': 'assets/Picture/swan.JPG',
        'gift': 'assets/Picture/gift.png',
        'earrings': 'assets/Picture/earrings.png',
        'photo-frame': 'assets/Picture/instax.png',
        'electric-piano': 'assets/Picture/piano_key.png',
        'soju': 'assets/Picture/soju.png',
        'beer-opener': 'assets/Picture/bottle_opener.png'
    },
    // 关键物品列表（发现时会记录到“找到的关键物品”）
    keyItems: [
        { id: 'earrings', name: '耳环' },
        { id: 'photo-frame', name: '相框' },
        { id: 'electric-piano', name: '钢琴琴键' },
        { id: 'soju', name: '烧酒' },
        { id: 'beer-opener', name: '啤酒起子' },
        { id: 'screwdriver', name: '螺丝刀' },
        { id: 'fridge-note', name: '冰箱字条' }
    ],
    scenes: {
        intro: {
            id: 'intro',
            background: { type: 'color', value: '#000' }
        },
        livingroom: {
            id: 'livingroom',
            background: {
                type: 'image',
                value: 'assets/Picture/livingroom_frameDown.png',
                size: '100% 100%',
                position: 'center',
                repeat: 'no-repeat'
            },
            backgroundAfter: 'assets/Picture/livingroom.png'
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
                value: 'assets/Picture/bedroom_drawerOpen.png',
                size: '100% 100%',
                position: 'center',
                repeat: 'no-repeat'
            },
            backgroundAfter: 'assets/Picture/bedroom.png',
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
                value: 'assets/Picture/study_coverOn.png',
                size: '100% 100%',
                position: 'center',
                repeat: 'no-repeat'
            },
            backgroundAfter: 'assets/Picture/study.png',
        },
        
    },
    objectConfigs: {
        // livingroom
        'gift-box': { padding: '1.2% 1.2%', top: '46%', left: '52%' },
        'aroma-candle': { padding: '1%', top: '62.5%', left: '73%', rotation: '2deg' },
        'switch-console': { padding: '2% 2.5%', top: '64%', left: '77%', rotation: '10deg' },
        'snack-box': { padding: '2% 4.5%', top: '78%', left: '47.5%'},
        'shark-plush': { padding: '3% 7%', top: '52%', left: '17%'},
        'fridge-note': { padding: '2.8% 2.5%', top: '47%', left: '42%'},
        'fridge-door': { padding: '2.8% 2.5%', top: '47%', left: '42%'},
        'tv-cabinet': { padding: '3% 12%', top: '75%', left: '77%', rotation: '20deg' },
        'photo-frame': { padding: '2.5% 4%', top: '68%', left: '83%' },
        doorToHallwayFromLivingroom: { padding: '8% 1.5%', top: '48%', left: '66%' },

        // bedroom
        wardrobe: { padding: '25% 7%', top: '50%', left: '7%' },
        'landscape-venice-photo': { padding: '7% 10%', top: '39%', left: '40%' },
        'vanity-table': { padding: '5% 10%', top: '68%', left: '88%' },
        'bedroom-drawer': { padding: '3% 6%', top: '70%', left: '80%' },
        'light-switch': { padding: '0.8% 0.6%', top: '48.5%', left: '17.8%' },
        doorToHallwayFromBedroom: { padding: '8% 3%', top: '39%', left: '23%' },

        // hallway
        'bathroom-door': { padding: '17% 12%', top: '52%', left: '47%' },
        'swan-photo': { padding: '8% 8%', top: '39%', left: '12%' },
        doorToLivingroomFromHallway: { padding: '47% 10%', top: '54%', left: '90%' },
        doorToBedroomFromHallway: { padding: '3%', top: '96%', left: '49%' },
        hintToBedroomFromHallway: { padding: '0', top: '95%', left: '49%' },
        doorToStudyFromHallway: { padding: '20% 3%', top: '53%', left: '26%' },

        // study
        monitor: { padding: '3% 7%', top: '58%', left: '48%' },
        'drawer-cabinet': { padding: '5% 4%', top: '75%', left: '64%' },
        violin: { padding: '6% 2%', top: '38%', left: '22%' },
        guitar: { padding: '11% 4%', top: '38%', left: '14%' },
        'electric-piano': { padding: '9% 10%', top: '78%', left: '22%' },
        bookcase: { padding: '9% 5.5%', top: '45%', left: '31%' },
        'storage-box': { padding: '2% 4%', top: '23%', left: '30%' },
        'startrail-photo': { padding: '2.4% 3%', top: '35.3%', left: '47.5%' },
        'sakura-photo': { padding: '1.5% 1.5%', top: '33.8%', left: '52.8%' },
        'sunset-photo': { padding: '1.7% 1.5%', top: '45%', left: '48.9%' },
        'couple-photo': { padding: '2.5% 2.5%', top: '43.5%', left: '53.8%' },
        'balcony-chair': { padding: '6%', top: '78%', left: '84%' },
        'bbq-grill': { padding: '3% 5%', top: '58%', left: '80%' },
        doorToHallwayFromStudy: { padding: '3%', top: '96%', left: '49%' },
        hintToHallwayFromStudy: { padding: '0', top: '95%', left: '49%' }
    },
    interactions: [
        // livingroom
        { id: 'aroma-candle', texts: [
            '香薰蜡烛点着，淡淡的木质香让客厅更放松。',
            '我送他的第一个礼物也是这个，当时纠结了好久。',
            '不过他好像没有很喜欢，真是个难搞的家伙。'
        ] },
        { id: 'switch-console', texts: [
            'Switch正插在底座上，Joy-Con还在充电。',
            '我们第一次一起玩的游戏好像是《双人成行》，我们的合作越来越有默契。',
            '印象最深的是暴风雪的关卡，我们在大风雪里相互搀扶着前行。'
        ] },
        { id: 'snack-box', texts: [
            '零食盒里塞满了各种小零食，有薯片、海带结，还有我最喜欢的麻酱素毛肚。',
            '晚上看剧的时候，偷偷拿出一点来吃，感觉特别治愈。',
            '家里那位总是笑我吃得太多，说我会变成小胖子……'
        ] },
        { id: 'shark-plush', texts: [
            '宜家买的鲨鱼玩偶“布罗艾”，已经被抱得有点塌塌的了，但还是很阔奈。'
        ] },
        { id: 'fridge-note', texts: [
            '冰箱门上贴着一些字条，第一张：面包和Hafer不够了，记得买哦～<auto>',
            '第二张：今晚一起看新出的《罗小黑战记3》吗？',
            '第三张：周末一起去那家的新开餐厅试试吧！',
            '第四张：可爱的小sagwa，我在冰箱里放了你最爱的葡萄烧酒，记得喝掉哦～',
            '谁是小sagwa！ヽ(｀Д´)ﾉ不过……确实有点口渴了，想喝点东西呢<stop>',
            '感觉有点口渴，想喝点饮料……看到说冰箱里有葡萄味烧酒。'
        ] },
        { id: 'fridge-door', choiceText: '是否要用猫爪爪开瓶器打开烧酒？', texts: [
            '果然有一瓶……不过，我可爱的开瓶器去哪里了？',
            '唔…好好喝呀！(★ω★）咦？瓶盖上怎么写着数字：7',
            '是否要用猫爪爪开瓶器打开烧酒？'
        ] },
        { id: 'tv-cabinet', texts: [
            '电视柜的抽屉里塞满了遥控器和说明书。',
            '电视柜的抽屉里塞满了不少东西，让我找找……啊哈，一把螺丝刀！',
            '电视柜上摆了不少东西，当时为了安装它，我们两个人花了一下午加一晚上的时间。'
        ]},
        { id: 'photo-frame', choiceText: '是否使用“螺丝刀”？', texts: [
            '相框倒在那里……应该是背面支架的螺丝松了。',
            '照片里两个人披着毛毯，那天虽然柏林阳光明媚，但风特别大……好了，先修好它。',
            '呼，修好了……诶？相框背面怎么有个数字3……'
        ] },
        { id: 'screwdriver', texts: [
            '这把十字螺丝刀有些旧了，手柄还有点松动，但好在还能用。'
        ]},

        // bedroom
        { id: 'wardrobe', texts: ['衣柜里放满了衣服，看起来很整洁，有一股洗衣液的香味。'] },
        { id: 'landscape-venice-photo', texts: ['日落时分，威尼斯的水面闪烁着金光，多拉贡们在悠闲交错地游行。'] },
        { id: 'vanity-table', texts: [
            '梳妆台上摆着一些护肤品，下面的抽屉没关好，顺手带上吧。',
            '梳妆台上摆着一些护肤品，找个时间收拾一下吧。'
        ] },
        { id: 'bedroom-drawer', texts: [
            '好像抽屉里有什么东西卡住了…………………………啊！…………………………原来是这一对耳环呀',
            '这是那时圣诞节送我的，一对栀子花，当时好喜欢……'
        ] },

        // hallway
        { id: 'bathroom-door', texts: ['浴室里传来哗啦啦的水声，透过玻璃看里面热气蒸腾，应该是家里那位正在洗澡。'] },
        { id: 'swan-photo', texts: ['湖面像雕塑一样，波光粼粼。'] },

        // study
        { id: 'monitor', texts: [
            '主屏幕上显示着一些看不懂的代码，似乎是一个游戏demo。',
            '另一个屏幕上还在生成一些图片，不知道家里那位要干嘛。',
        ]}, 
        { id: 'drawer-cabinet', texts: [
            '抽屉柜是从一个二手卖家那里超低价买来的，但是质量还不错。',
            '印象里开瓶器好像是放在这里了，让我找找看',
            '没错就是这个，我的猫爪爪开瓶器！好可爱呀，感谢万能的TB~',
            '抽屉柜是从一个二手卖家那里超低价买来的，但是质量还不错。'
        ]},
        { id: 'violin', texts: ['小提琴安静地靠在角落，漆面有轻微的磨损。'] },
        { id: 'guitar', texts: ['吉他的音好像不太准，看来有一阵子没练习了。']},
        { id: 'electric-piano', choiceText: '是否掀开钢琴布？', texts: [
            '钢琴盖上盖着一块布，防尘又防划痕。好久没有练习了呢……',
            'Donner的电钢琴，当时咬咬牙买的，谁叫它三角形的大长腿那么好看呢~<auto>',
            '咦？G音的琴键上怎么贴着个布条？'
        ] },
        { id: 'bookcase', texts: ['书柜里塞了一些乐谱和书：《亚当，你是谁》，《魔戒》，《卡尔弗赖什音阶练习》……'] },
        { id: 'storage-box', texts: ['杂物盒里堆着一些圣诞树的装饰品。'] },
        { id: 'startrail-photo', texts: ['那一晚的星空很美，两个人一起静静地等待着照片的出炉，有一搭没一搭地聊着天。'] },
        { id: 'sakura-photo', texts: ['参加摄影比赛落选的樱花，不过照片的色调很柔和。'] },
        { id: 'sunset-photo', texts: ['加尔达湖边的日落，安静而美好。'] },
        { id: 'couple-photo', texts: ['好不容易找到一张他笑的自然一些的照片。'] },
        { id: 'balcony-chair', texts: ['藤椅很适合在阳台上发呆一下午。'] },
        { id: 'bbq-grill', texts: ['烧烤炉还留着一股炭火味，比几年前买的那个小电烤炉烤的更香了。'] }
    ]
};
