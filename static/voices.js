// Preset voice catalog + model options. Sourced from 参考音色.md.
// Tag meaning:
//   instruct     → qwen3-tts-instruct-flash-realtime family
//   flash        → qwen3-tts-flash-realtime (latest + 2025-11-27)
//   flash-0918   → qwen3-tts-flash-realtime-2025-09-18 only
//   classic      → qwen-tts-realtime family

const TTS_MODEL_OPTIONS = [
  {
    value: "qwen3-tts-instruct-flash-realtime",
    label: "Qwen3-TTS-Instruct-Flash-Realtime（支持风格指令）",
    tag: "instruct",
    supportsInstructions: true,
  },
  {
    value: "qwen3-tts-instruct-flash-realtime-2026-01-22",
    label: "Qwen3-TTS-Instruct-Flash-Realtime（2026-01-22）",
    tag: "instruct",
    supportsInstructions: true,
  },
  {
    value: "qwen3-tts-flash-realtime",
    label: "Qwen3-TTS-Flash-Realtime（最新）",
    tag: "flash",
    supportsInstructions: false,
  },
  {
    value: "qwen3-tts-flash-realtime-2025-11-27",
    label: "Qwen3-TTS-Flash-Realtime（2025-11-27）",
    tag: "flash",
    supportsInstructions: false,
  },
  {
    value: "qwen3-tts-flash-realtime-2025-09-18",
    label: "Qwen3-TTS-Flash-Realtime（2025-09-18）",
    tag: "flash-0918",
    supportsInstructions: false,
  },
  {
    value: "qwen-tts-realtime",
    label: "Qwen-TTS-Realtime（经典）",
    tag: "classic",
    supportsInstructions: false,
  },
  {
    value: "qwen-tts-realtime-latest",
    label: "Qwen-TTS-Realtime（latest）",
    tag: "classic",
    supportsInstructions: false,
  },
  {
    value: "qwen-tts-realtime-2025-07-15",
    label: "Qwen-TTS-Realtime（2025-07-15）",
    tag: "classic",
    supportsInstructions: false,
  },
];

const MODEL_TAG_LABEL = {
  instruct: "Instruct",
  flash: "Flash",
  "flash-0918": "Flash-0918",
  classic: "Classic",
};

const PRESET_VOICES = [
  { voice: "Cherry", nameCn: "芊悦", description: "阳光积极、亲切自然小姐姐", gender: "女", dialect: "普通话", tags: ["instruct", "flash", "flash-0918", "classic"] },
  { voice: "Serena", nameCn: "苏瑶", description: "温柔小姐姐", gender: "女", dialect: "普通话", tags: ["instruct", "flash", "classic"] },
  { voice: "Ethan", nameCn: "晨煦", description: "标准普通话，带部分北方口音。阳光、温暖、活力、朝气", gender: "男", dialect: "普通话", tags: ["instruct", "flash", "flash-0918", "classic"] },
  { voice: "Chelsie", nameCn: "千雪", description: "二次元虚拟女友", gender: "女", dialect: "普通话", tags: ["instruct", "flash", "classic"] },
  { voice: "Momo", nameCn: "茉兔", description: "撒娇搞怪，逗你开心", gender: "女", dialect: "普通话", tags: ["instruct", "flash"] },
  { voice: "Vivian", nameCn: "十三", description: "拽拽的、可爱的小暴躁", gender: "女", dialect: "普通话", tags: ["instruct", "flash"] },
  { voice: "Moon", nameCn: "月白", description: "率性帅气的月白", gender: "男", dialect: "普通话", tags: ["instruct", "flash"] },
  { voice: "Maia", nameCn: "四月", description: "知性与温柔的碰撞", gender: "女", dialect: "普通话", tags: ["instruct", "flash"] },
  { voice: "Kai", nameCn: "凯", description: "耳朵的一场 SPA", gender: "男", dialect: "普通话", tags: ["instruct", "flash"] },
  { voice: "Nofish", nameCn: "不吃鱼", description: "不会翘舌音的设计师", gender: "男", dialect: "普通话", tags: ["instruct", "flash", "flash-0918"] },
  { voice: "Bella", nameCn: "萌宝", description: "喝酒不打醉拳的小萝莉", gender: "女", dialect: "普通话", tags: ["instruct", "flash"] },
  { voice: "Jennifer", nameCn: "詹妮弗", description: "品牌级、电影质感般美语女声", gender: "女", dialect: "普通话", tags: ["flash", "flash-0918"] },
  { voice: "Ryan", nameCn: "甜茶", description: "节奏拉满，戏感炸裂，真实与张力共舞", gender: "男", dialect: "普通话", tags: ["flash", "flash-0918"] },
  { voice: "Katerina", nameCn: "卡捷琳娜", description: "御姐音色，韵律回味十足", gender: "女", dialect: "普通话", tags: ["flash", "flash-0918"] },
  { voice: "Aiden", nameCn: "艾登", description: "精通厨艺的美语大男孩", gender: "男", dialect: "普通话", tags: ["flash"] },
  { voice: "Eldric Sage", nameCn: "沧明子", description: "沉稳睿智的老者，沧桑如松却心明如镜", gender: "男", dialect: "普通话", tags: ["instruct", "flash"] },
  { voice: "Mia", nameCn: "乖小妹", description: "温顺如春水，乖巧如初雪", gender: "女", dialect: "普通话", tags: ["instruct", "flash"] },
  { voice: "Mochi", nameCn: "沙小弥", description: "聪明伶俐的小大人，童真未泯却早慧如禅", gender: "男", dialect: "普通话", tags: ["instruct", "flash"] },
  { voice: "Bellona", nameCn: "燕铮莺", description: "声音洪亮，吐字清晰，人物鲜活——金戈铁马入梦来", gender: "女", dialect: "普通话", tags: ["instruct", "flash"] },
  { voice: "Vincent", nameCn: "田叔", description: "一口独特的沙哑烟嗓，道尽千军万马与江湖豪情", gender: "男", dialect: "普通话", tags: ["instruct", "flash"] },
  { voice: "Bunny", nameCn: "萌小姬", description: "“萌属性”爆棚的小萝莉", gender: "女", dialect: "普通话", tags: ["instruct", "flash"] },
  { voice: "Neil", nameCn: "阿闻", description: "平直基线语调，字正腔圆，最专业的新闻主持人", gender: "男", dialect: "普通话", tags: ["instruct", "flash"] },
  { voice: "Elias", nameCn: "墨讲师", description: "既严谨又善于把复杂知识转化为可消化的认知模块", gender: "女", dialect: "普通话", tags: ["instruct", "flash", "flash-0918"] },
  { voice: "Arthur", nameCn: "徐大爷", description: "被岁月与旱烟浸泡过的质朴嗓音，摇开满村奇闻", gender: "男", dialect: "普通话", tags: ["instruct", "flash"] },
  { voice: "Nini", nameCn: "邻家妹妹", description: "糯米糍般又软又黏的嗓音，甜到骨头酥", gender: "女", dialect: "普通话", tags: ["instruct", "flash"] },
  { voice: "Seren", nameCn: "小婉", description: "温和舒缓的声线，助你更快入眠，晚安好梦", gender: "女", dialect: "普通话", tags: ["instruct", "flash"] },
  { voice: "Pip", nameCn: "顽屁小孩", description: "调皮捣蛋却充满童真，是你记忆中的小新", gender: "男", dialect: "普通话", tags: ["instruct", "flash"] },
  { voice: "Stella", nameCn: "少女阿月", description: "甜到发腻的迷糊少女音，瞬间切换的爱与正义", gender: "女", dialect: "普通话", tags: ["instruct", "flash"] },
  { voice: "Bodega", nameCn: "博德加", description: "热情的西班牙大叔", gender: "男", dialect: "普通话", tags: ["flash"] },
  { voice: "Sonrisa", nameCn: "索尼莎", description: "热情开朗的拉美大姐", gender: "女", dialect: "普通话", tags: ["flash"] },
  { voice: "Alek", nameCn: "阿列克", description: "战斗民族的冷，也是毛呢大衣下的暖", gender: "男", dialect: "普通话", tags: ["flash"] },
  { voice: "Dolce", nameCn: "多尔切", description: "慵懒的意大利大叔", gender: "男", dialect: "普通话", tags: ["flash"] },
  { voice: "Sohee", nameCn: "素熙", description: "温柔开朗、情绪丰富的韩国欧尼", gender: "女", dialect: "普通话", tags: ["flash"] },
  { voice: "Ono Anna", nameCn: "小野杏", description: "鬼灵精怪的青梅竹马", gender: "女", dialect: "普通话", tags: ["flash"] },
  { voice: "Lenn", nameCn: "莱恩", description: "理性是底色，叛逆藏在细节里——德国青年", gender: "男", dialect: "普通话", tags: ["flash"] },
  { voice: "Emilien", nameCn: "埃米尔安", description: "浪漫的法国大哥哥", gender: "男", dialect: "普通话", tags: ["flash"] },
  { voice: "Andre", nameCn: "安德雷", description: "声音磁性，自然舒服、沉稳男生", gender: "男", dialect: "普通话", tags: ["flash"] },
  { voice: "Radio Gol", nameCn: "拉迪奥·戈尔", description: "足球诗人，用名字为你们解说足球", gender: "男", dialect: "普通话", tags: ["flash"] },
  { voice: "Jada", nameCn: "上海-阿珍", description: "风风火火的沪上阿姐", gender: "女", dialect: "上海话", tags: ["flash", "flash-0918"] },
  { voice: "Dylan", nameCn: "北京-晓东", description: "北京胡同里长大的少年", gender: "男", dialect: "北京话", tags: ["flash", "flash-0918"] },
  { voice: "Li", nameCn: "南京-老李", description: "耐心的瑜伽老师", gender: "男", dialect: "南京话", tags: ["flash", "flash-0918"] },
  { voice: "Marcus", nameCn: "陕西-秦川", description: "面宽话短，心实声沉——老陕的味道", gender: "男", dialect: "陕西话", tags: ["flash", "flash-0918"] },
  { voice: "Roy", nameCn: "闽南-阿杰", description: "诙谐直爽、市井活泼的台湾哥仔", gender: "男", dialect: "闽南语", tags: ["flash", "flash-0918"] },
  { voice: "Peter", nameCn: "天津-李彼得", description: "天津相声，专业捧哏", gender: "男", dialect: "天津话", tags: ["flash", "flash-0918"] },
  { voice: "Sunny", nameCn: "四川-晴儿", description: "甜到心里的川妹子", gender: "女", dialect: "四川话", tags: ["flash", "flash-0918"] },
  { voice: "Eric", nameCn: "四川-程川", description: "一个跳脱市井的四川成都男子", gender: "男", dialect: "四川话", tags: ["flash", "flash-0918"] },
  { voice: "Rocky", nameCn: "粤语-阿强", description: "幽默风趣的阿强，在线陪聊", gender: "男", dialect: "粤语", tags: ["flash", "flash-0918"] },
  { voice: "Kiki", nameCn: "粤语-阿清", description: "甜美的港妹闺蜜", gender: "女", dialect: "粤语", tags: ["flash", "flash-0918"] },
];

const PRESET_INSTRUCTION_EXAMPLES = [
  "语速稍快，语调上扬，表现出非常开心、兴奋和期待的感觉。",
  "平静、低沉、缓慢，像在讲一段伤心的往事。",
  "专业新闻播报腔，字正腔圆、节奏平稳。",
  "温柔轻声，像在耳边讲睡前故事。",
  "俏皮可爱、带一点撒娇，结尾加上“嘿嘿”的语气。",
  "严肃庄重，像在法庭上陈述关键证据。",
];
