# 第二版音效需求清单

**放置**：通用音效放进 `work/film/audio/common/sfx/`，各章音效放进 `work/film/audio/<章>/sfx/`，人声放进对应章的 `vo/`。文件名照下表，格式用 48 kHz WAV，和现有素材包一致。同一项能给两三个变体更好，按 `_01`、`_02` 编号。

**来源**：优先从游戏音频包（Wwise SFX bank）里取。找不到的标注出来，我用合成或者通用素材补。纸张类声音（翻折、立起）继续由 `sfx.py` 合成，不用找。

**优先级**：P0 是样片（悲泣溪谷）和魂的通用动作必需的，P1 是各章 Boss 的招式，P2 是环境声，有了更好。

## A. 魂 · 通用战斗（P0）

| 文件名 | 内容 | 备注 |
| --- | --- | --- |
| `guard_01~03` | 格挡：刀与兵器相撞的金属撞击，带火花的嘶响 | 平常接招用，要和弹反明显区分 |
| `parry_perfect_01~02` | 完美弹反：清脆的高音"叮"加冲击声 | 已有 `01-valley/sfx/parry_01.wav`，请确认它是不是弹反音 |
| `guard_break_01` | 被破防：沉重的撞击声，伴随失衡 | |
| `telegraph_red_01` | 红光（不可格挡）提示音 | 游戏里 Boss 发出危险招式时的提示音 |
| `telegraph_blue_01` | 蓝光（可弹反）提示音 | 同上 |
| `shadowstep_out_01` / `shadowstep_in_01` | 瞬身：散成黑烟的声音，以及在 Boss 背后重新出现的声音 | 魂的闪避或瞬移音效 |
| `counter_slash_01~02` | 瞬身之后背刺或反击斩 | |
| `dodge_01~02` | 闪避时衣料带起的风声 | |
| `hero_slash_light_01~03` / `hero_slash_heavy_01~02` | 魂挥刀的挥空声和命中声 | 现在是合成的，换成原声会好很多 |
| `hit_flesh_01~03` | 刀砍中身体 | |
| `execute_01` | 处决 | 已有 `02-forest/sfx/execute_01.wav` |
| `boss_break_01` | Boss 失衡 | 已有 `09-mountain/sfx/boss_break_01.wav` |

## B. 各章 Boss 招式（P1）

| 章 | 文件名 | 内容 |
| --- | --- | --- |
| 01 追命 | `chain_throw_01~02`、`chain_rattle_01`、`chain_hook_pull_01` | 锁链甩出时的呼啸、锁链哗啦声、钩住后往回拽 |
| | `sickle_swing_01~02`、`mech_arms_unfold_01` | 镰刀挥舞声；二阶段钢臂展开的机械声 |
| | `zhuiming_charge_01`（VO） | 蓄力发声。素材包报告里这一项缺，标的是 0/2 |
| 02 白赤练 | `blink_dash_01~02` | 快速闪身瞬移 |
| | `ribbon_whip_01` | 飘带挥动 |
| | `serpent_emerge_01`、`serpent_hiss_01`、`serpent_roar_01`、`serpent_strike_01` | 大蛇破土而出、嘶声、咆哮、扑咬 |
| 03 沐小葵 | `sword_qi_01~02`、`red_burst_01` | 剑气月牙飞出；红光在脚下炸开 |
| | `summon_guard_01` | 召唤护卫 |
| | `yuyao_kick_01`、`tiegui_punch_01`、`tiegui_charge_01` | 玉妖踢击；铁鬼重拳、冲撞 |
| | `yuyao_attack_heavy_01`、`tiegui_attack_heavy_01`（VO） | 报告里这两项缺 |
| 04 骨婉约 | `paper_money_swirl_01` | 她登场时漫天纸钱翻飞。找不到的话我用合成纸声代替（她的人声见 D 节；第三版不再有她的战斗） |
| 04 舞狮 | `pole_land_01~03` | 落在木桩上的"咚"声 |
| | `fire_breath_01`、`fireball_01`、`fire_pillar_01` | 吐火（持续火流）、火球、火柱 |
| | `lion_gong_cymbal_01`、`hoho_shout_01` | 舞狮锣钹；鹤鹤弟子的吆喝 |
| | `wushizunzhu_charge_01`（VO） | |
| 05 玉璧 | `wind_blade_01~02`、`gust_01` | 风刃、阵风 |
| | `thunder_strike_01~02`、`lightning_thrust_01` | 落雷、雷光突刺 |
| | `storm_vortex_loop_01`、`gold_circle_burst_01` | 闪电旋风持续环绕的声音；金色法阵炸开 |
| | `yubi_charge_01`（VO） | |
| 06 风雪刀客 | `ice_wave_01~03` | 冰封波，三连斩各一个 |
| | `ice_freeze_01`、`ice_shatter_01` | 冰封住魂；破冰而出 |
| | `ice_spike_burst_01`、`blizzard_loop_01` | 地面冰刺爆发；风雪持续声 |
| 07 荒行子 | `ball_chain_swing_01`、`ball_impact_01` | 链球甩动、链球砸地 |
| | `saw_spinup_01`、`saw_grind_loop_01` | 电锯启动、电锯持续运转 |
| | `transform_mech_01`、`red_world_drone_01` | 变形成电锯头的机械声；转入红色背景时的低频嗡鸣 |
| 08 雷当 | `cannon_aim_01`、`cannon_fire_01~02`、`cannon_charge_01` | 瞄准提示声、开炮、蓄力 |
| | `explosion_01~02`、`ground_slam_01~02` | 爆炸、砸地 |
| | `rock_fall_01~03`、`big_leap_01` | 巨石砸落，需要几个变体；跃起 |
| | `leidang_ultimate_line_01`（VO） | "You won't escape this move!" 这句的原版中文 |
| 09 左殇 | `gold_sword_hum_01`、`flying_swords_volley_01`、`swords_gather_01` | 金剑嗡鸣、万剑齐射、万剑汇聚 |
| | `gold_burst_01`、`dragon_roar_01`、`blade_lock_01` | 金光爆发、金龙咆哮、刀剑相抵 |
| | `pavilion_shatter_01` | 门楼震碎 |

## C. 环境声（P2，可选）

`ambience_waterfall`、`ambience_stream`、`ambience_forest_wind`、`ambience_lake_reeds`、`ambience_town_night`（加火盆噼啪声）、`ambience_camp`（旗帜加远处鼓声）、`ambience_lake_snow`、`ambience_shrine`、`ambience_mountain_snow`。每段 20～60 秒，能循环就行。

## D. 人声补充（第三版，交给提取人声的 Agent）

第三版起，每章的台词由场景脚本按招式和阶段逐句排时间（`film.voice`），`mix.py` 照排好的时间放。下面的文件放好就会被自动用上，文件名和目录要一致。**每句都请写明原文和它属于第几阶段**，阶段不能猜：放错阶段比不放更糟。

**P0：缺了就会空着的位置**

| 章 | 文件（放进 `work/film/audio/<章>/vo/`） | 内容 | 用在哪 |
| --- | --- | --- | --- |
| 04 庞镇 | `guwanyue_line_01.wav` | 骨婉约登场时的一句台词（游戏里她出场或开战时说的那句）。附原文 | 她在广场纸钱中升起时（第三版只登场、说台词，不打） |
| 04 庞镇 | `guwanyue_scream_01.wav` | 骨婉约的尖啸 | 同上，备用 |
| 03 陆家村 | `yuyao_attack_heavy_01.wav`、`tiegui_attack_heavy_01.wav` | 玉妖、铁鬼的重击发声 | 二阶段护卫出手时 |
| 04 庞镇 | `wushizunzhu_charge_01.wav` | 舞狮尊主蓄力发声 | 一阶段跃起重砸前 |

**P1：已有但内容不明，请核对并写明原文和阶段**

| 文件 | 时长 | 需要确认的内容 |
| --- | --- | --- |
| `03-village/vo/muxiaokui_line_01.wav` | 1.4 s | 用户说是“玉妖、铁鬼，听命！”，属于二阶段。请确认原文 |
| `03-village/vo/muxiaokui_line_02.wav` | 9.0 s | 原文和阶段都不明，现在没有用 |
| `04-town/vo/wushizunzhu_line_02.wav` | 3.0 s | 和 `line_01`（归——位！）同一个源文件，原文不明，现在没有用 |
| `06-lake/vo/fengxuedaoke_p1_line_02.wav` | 2.1 s | 原文不明，现在没有用 |
| `07-prison/vo/huangxingzi_line_01.wav` | 10.8 s | 荒行子目前只有发声没有台词。原文和阶段不明 |
| `07-prison/vo/yumianlangjun_encounter_line_01.wav` | 10.3 s | 玉面郎君，原文不明 |
| `02-forest/vo/baichilian_p2_line_0x.wav` | | 素材报告说 HSPP 组的二阶段归类待试听。现在用在二阶段，如果其实是另一场战斗的台词请告诉我 |
| `09-mountain/vo/zuoshang_p1_*` / `p2_*` | | “龙体（LongTi）”组在报告里归一阶段，普通组归二阶段。片中二阶段才变金色空间、出金龙。请确认这个阶段对应关系 |

**P2：缺台词的角色（有就加，没有就只用发声）**

- 剑偶·玉璧：战斗中的台词（现在只有战后对白）。
- 荒行子、玉面郎君、烟千岁、断肠、囚锋、残钢：任意一句战斗台词。
- 每个 Boss 第二阶段的台词，尤其是追命、沐小葵（铁玉女王）、舞狮尊主（最后一舞）、玉璧、荒行子（旋锯刑者）。
