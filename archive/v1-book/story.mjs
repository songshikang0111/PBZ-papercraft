export const opening = 4.5;
export const pageLength = 7.5;
export const closing = 4;
export const fps = 30;

export const pages = [
  {
    id: 'valley', name: '悲泣溪谷', en: 'WEEPING CREEK VALLEY', seal: '#a13e2d',
    landmark: '钢铁巨塔 · 大瀑布', subtitle: '逆流而上',
    note: '瀑布后的通路，绕进钢铁巨塔。',
    bosses: ['残钢', '彭猛', '新娘阿花', '追命'], tags: ['初战', '据点', '支线', '瀑布再战'],
  },
  {
    id: 'forest', name: '血色森林', en: 'CRIMSON FOREST', seal: '#983728',
    landmark: '镜林巨树', subtitle: '林中血，镜中蛇',
    note: '改走林中官道，穿过飞贼营地与镜林。',
    bosses: ['花千笑', '荆野', '铁狂', '白赤练'], tags: ['官道', '亡命徒', '镜林入口', '双蛇夫人'],
  },
  {
    id: 'village', name: '陆家村', en: 'VILLAGE OF LU', seal: '#8c4736',
    landmark: '三偶井 · 井下升降台', subtitle: '失心村',
    note: '井下人偶设施连着通往庞镇的暗道。',
    bosses: ['拙壁', '玉瓒', '荡秽', '沐小葵'], tags: ['守门人', '乐师偶', '隐藏首领', '组织少主'],
  },
  {
    id: 'town', name: '庞镇', en: 'PANGZHEN', seal: '#a13b26',
    landmark: '后街 · 舞狮馆', subtitle: '死镇',
    note: '从地下酒馆绕到后街，追查心的踪迹。',
    bosses: ['火流星', '游龙', '长鸿', '舞狮尊主·烈焰'], tags: ['鬼差队长', '水行帮主', '雷枪', '封印地'],
  },
  {
    id: 'camp', name: '正道大营', en: 'MANDATE ENCAMPMENT', seal: '#aa3f32',
    landmark: '鸽舍高塔 · 校场', subtitle: '英雄？罪人？',
    note: '经鸽舍上塔，过七星剑阵，再入校场。',
    bosses: ['万钧', '红衣女剑客', '大师兄', '玉璧'], tags: ['守门巨锤', '鸽舍塔顶', '七星剑阵', '廿一号剑偶'],
  },
  {
    id: 'lake', name: '梅谷湖', en: 'MEIGU LAKE', seal: '#95483b',
    landmark: '白蛇屋船坞 · 机关船', subtitle: '湖',
    note: '乘机关船访各处船坞。修好琵琶，便可拨开通往枷笼山的雾。',
    shortNote: '机关船穿过湖上船坞，雾门通往枷笼山。',
    bosses: ['烟千岁', '发狂的游龙', '风雪刀客', '断肠'], tags: ['梅谷乐坊', '水行帮船坞', '幻术师遗迹', '白蛇屋'],
  },
  {
    id: 'prison', name: '枷笼山', en: 'MOUNTAIN OF IMPRISONMENT', seal: '#943a2c',
    landmark: '宗祠山门 · 悬崖吊笼', subtitle: '背叛与监禁',
    note: '琵琶拨开湖上雾障，沿囚笼道攀向宗祠。',
    bosses: ['毕峰', '奎艳艳', '玉面郎君', '荒行子'], tags: ['横刀平台', '宗祠外山门', '山道', '昆仑叛教者'],
  },
  {
    id: 'estate', name: '戏梦山庄', en: 'MIRAGE ESTATE', seal: '#953b32',
    landmark: '戏楼 · 皮影幕', subtitle: '破局',
    note: '回到湖区取白蛇屋信物，再沿主线进入山庄。',
    bosses: ['玉鼎', '囚锋', '呜呜呜', '虎炮·雷当'], tags: ['偃月刀偶', '赤影骨刃', '支线', '圣躯心池'],
  },
  {
    id: 'mountain', name: '断魂山', en: 'MOUNT SOULREND', seal: '#922e33',
    landmark: '山神庙 · 断魂崖', subtitle: '断魂',
    note: '完成「湖心秘密」后，梦华战后可继续迎战左殇。',
    shortNote: '「湖心秘密」分支可继续迎战左殇。',
    bosses: ['力者与锯者', '梦差·冷荼', '梦华圣母', '左殇'], tags: ['断魂崖双首领', '大梦倾颓处', '终局分歧', '结局分支'],
  },
];

export const duration = opening + pageLength * pages.length + closing;
