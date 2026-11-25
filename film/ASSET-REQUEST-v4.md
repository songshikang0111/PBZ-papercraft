# 第四版素材需求（预留位与文件名）

下面每项素材都有一个固定的文件名和位置。文件放进去以后，重新混音（`python film/tools/mix.py <章>`）就会自动用上，大多数不用重渲画面。格式统一为 48 kHz WAV，和现有素材包一致。

## P0

| 放到这里 | 内容 | 生效方式 |
| --- | --- | --- |
| `work/film/audio/<章>/music/mus_map_full.wav` | 该区域地图音乐的**完整分层**：Top 层、Mid 层或引擎预混的整轨。没有的话，用同区域其他状态里旋律最完整的一段 | 放进去就替换原来的 `mus_map.wav`，只重混即可 |
| `work/film/audio/common/music/title_theme.wav` | 主菜单或标题主题曲 | 片头配乐，只重混即可 |
| `work/film/audio/common/music/ending_theme.wav` | 片尾字幕曲，或者其他适合收尾的主题 | 片尾配乐，只重混即可 |

9 章目录依次是：`01-valley`、`02-forest`、`03-village`、`04-town`、`05-camp`、`06-lake`、`07-prison`、`08-estate`、`09-mountain`。

## P1

| 放到这里 | 内容 | 生效方式 |
| --- | --- | --- |
| `work/film/fonts/game-ui.ttf` | 游戏 UI 中文字体（名牌和字幕用的那款） | 需要改名牌、片尾「制作人」的绘制，并重渲片尾。到位后告诉我 |
| `work/film/audio/<章>/vo/<角色>_line_short_01.wav` | 中 Boss 1～3 秒的单句台词，需要的角色：彭猛、阿花、梦华、火流星、舞狮尊主 | 换掉现在较长的那句台词，需要重新导出事件表 |
| `work/film/audio/<章>/music/mus_preboss_01.wav` | Boss 战前的紧张段，或者剧情过场曲 | 以后做精英段和 Boss 之间的过渡 |

## P2

- `work/film/audio/<章>/sfx/` 下面放中 Boss 的招式音效，例如阿花扔白花（`ahua_flower_throw_01.wav`）、玉瓒暗球（`yuzan_orb_01.wav`）、荡秽巨偶掌击（`danghui_palm_01.wav`）、烟千岁琴音（`qin_strum_01.wav`）、梦华扇击（`menghua_fan_01.wav`）、荆野血滴子（`jingye_blades_01.wav`）。放进来以后，我把它们接到对应的事件上。
- 庞镇、断魂崖的实机截图或设定图，请放进 `research/user-refs/`。

仍然缺的独立人声：玉妖重击，以及骨婉约的两句战中对白。
