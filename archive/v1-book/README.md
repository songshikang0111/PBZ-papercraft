# 影之刃零 · 纸上影境

暗黑武侠立体书同人短片。序章用一册古铜烫印装帧开场，随后按游玩路线展示九个地区。每页选一位压轴首领、三位代表首领和一处地标。片长 76 秒，横屏 1920 × 1080，竖屏 1080 × 1920，均为 30 fps。

## 九页分镜

| 地区 | 压轴 | 三位代表首领 | 背景底图和地标 |
| --- | --- | --- | --- |
| 悲泣溪谷 | 追命 | 残钢、彭猛、新娘阿花 | 暴雨青石、钢铁巨塔、大瀑布、铃和蛛百合 |
| 血色森林 | 白赤练 | 花千笑、荆野、铁狂 | 朱红树叶、镜林巨树、林中吊笼和木栈道 |
| 陆家村 | 沐小葵 | 拙壁、玉瓒、荡秽 | 石阶木板、三偶井的剖面、井下升降台、碎偶 |
| 庞镇 | 舞狮尊主·烈焰 | 火流星、游龙、长鸿 | 黛瓦夜市、灯笼街、舞狮馆 |
| 正道大营 | 玉璧 | 万钧、红衣女剑客、七星剑阵·大师兄 | 灰褐校场、鸽舍高塔、营旗和寨栅 |
| 梅谷湖 | 断肠 | 烟千岁、发狂的游龙、风雪刀客 | 青瓷湖水、白蛇屋船坞、机关船 |
| 枷笼山 | 荒行子 | 毕峰、奎艳艳、玉面郎君 | 赭石崖壁、宗祠山门和悬崖吊笼 |
| 戏梦山庄 | 虎炮·雷当 | 玉鼎、囚锋、呜呜呜 | 琥珀色舞台、戏楼、皮影幕和戏偶 |
| 断魂山 | 左殇 | 力者与锯者、梦差·冷荼、梦华圣母 | 墨蓝雪崖、山神庙、松枝和祈愿带 |

压轴是本片的分镜定义。红衣女剑客、荡秽、风雪刀客等有支线或前置条件，各地的首领组合用于展示代表性战斗。断魂山的左殇战按完成「湖心秘密」的分支呈现，真龙意象借用了额外完成五场龙柱挑战的后续形态。梅谷湖先于枷笼山介绍，反映了乘船到湖区、以琵琶开雾门并返回湖区的路线。游戏章节表还含无名条目，片中用地理区域作为页名。 [正式版章节表](https://kungfupunk.com/zh-hans/phantom-blade-zero-chapters) · [分区首领顺序](https://kungfupunk.com/zh-hans/phantom-blade-zero-boss-order) · [湖区流程](https://pbz-wiki.org/zh/guides/walkthrough-meigu-lake/) · [断魂山结局路线](https://pbz-wiki.org/zh/guides/walkthrough-mount-soulrend/)

研究采用 [灵游坊官方演示介绍](https://blog.playstation.com/2026/08/17/phantom-blade-zero-state-of-play-dives-deep-into-combat-and-the-wulin-world/)、[IGN 中国正式版分区实机](https://www.bilibili.com/video/BV1UEsZ6kEjc/) 和 [流程实录](https://www.bilibili.com/video/BV17zsd6nE1Y/)。用 [正式版图鉴转录](https://www.gamersky.com/handbook/202611/2240895_8.shtml) 核对首领的简体写法，包括「雷当」。

## 视觉和动画规格

- 纤细宣纸纹和薄卡纸切边。朱砂、旧铜和米白随地区切换铁青、土褐、湖绿、戏台琥珀和雪松灰。角色和建筑是根据文字设计的原创纸艺形象。
- 以约 45° 俯视的透视书页造型和左前上方暖光塑造层次，每页以地标与压轴纸偶为中心，台签承接名字。地表采用每页独立的套色木刻材质。
- 每 7.5 秒转换一页。纸页卷曲约 0.84 秒，地标先起，三张小纸偶以约 0.36 秒间隔立起，压轴在约 2.4 秒启动。折片用 Papercraft 的 FlapSpring 模拟铰链回弹，以固定时间采样。
- 横屏左页排地区标题和三个首领，右页叠起地标和压轴纸偶。手机竖屏重新编排地标与纸偶，压轴和名签置于页面上部，前景道具和页角向下延伸。
- 声音采用原创稀疏拨弦、低频延音、摩擦翻页和折片落纸声。

## ImageGen 素材

使用内置 ImageGen 制作九张透明纸偶表、三张地面纹理表、一张封面底图。每张纸偶表为三列两行，顺序为三名代表首领、压轴首领、地标、装饰组。每格为原创正面裁切稿，哑光多层卡纸、细暗切边和单侧浅色高光。地面纹理表为三条横向带状套印，分别按溪谷／森林／村落、城镇／军营／湖水、崖壁／戏台／雪谷的顺序排列。封面为蓝黑装帧布纸上的旧铜武侠山水印记。

原始 PNG 和成片在主工作区的 `work/archive/v1-book/`。裁切后可复用的图像在 `art/`。脚本仅绘制装帧几何、折痕、投影、少量悬浮纸屑和字幕。

## 渲染

需要 Chrome、Noto CJK 字体、FFmpeg 和 Python，素材整理与音轨脚本另用 Pillow、NumPy 和 SciPy。已附裁切素材及 Papercraft v0.6.0 的铰链与风摆函数。重新处理 ImageGen 原图时，把 PNG 放入工作目录的 `raw/`，用分镜 ID 命名，再运行 `prepare_art.py`。

```bash
workdir=work/archive/v1-book
python archive/v1-book/score.py "$workdir/raw/score.wav"
uv run --with playwright python archive/v1-book/render.py \
  --format horizontal --audio "$workdir/raw/score.wav" --output "$workdir/phantom-blade-zero-16x9.mp4"
uv run --with playwright python archive/v1-book/render.py \
  --format vertical --audio "$workdir/raw/score.wav" --output "$workdir/phantom-blade-zero-9x16.mp4"
```

从仓库根目录启动任意静态服务器可预览 `archive/v1-book/`，URL 参数 `format=vertical` 切换手机构图。使用 `render.py --stills` 可检查任意时间点的全分辨率帧。
