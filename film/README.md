# 影之刃零 · Papercraft Boss 巡礼

按 `.agents/skills/papercraft` 的立体书纸模风格制作。每章一个 three.js 纸模场景，地区立起后依次点名精英，最后打关底 Boss 战。

## 结构

- `common/film.js`：章节共用的运行时。负责镜头关键帧、按时立起的卡片组、角色纸偶（姿态换卡、翻卡变身）和纸质特效（刀光纸带、碎纸、水花冠、波纹环、血刺环），名牌和标题叠层，以及音效事件。驱动的是 skill 原样的 harness。
- `common/fx.js`（第二版）：纸艺特效，包括星芒、锯齿环、金箔火花、黑红纸屑瞬身、火舌、冰晶、冰封、手风琴闪电、卷纸风、纸链、弹出爆裂、纸条瀑布。特效按 15 帧/秒步进，像定格动画。
- `common/build.js`（第三版）：3D 纸模建筑，包括江南马头墙房子、木板屋和吊脚屋，以及倾斜的多层楼阁。
- `common/terrain.js`（第二版）：地形件，包括峡谷两侧的隧道书式崖壁、远山剪影、平台小岛。
- `kit.js` 第二版新增：成束红线 `threadBand()` 和缠绕红线 `threadWrap()`；战斗节拍 `guard`（格挡）、`tell`（红蓝提示加顿帧）、`deflect`（弹反）、`shadowstep`（瞬身）、`counter`（反击）；转场加快。`film.hitstop()` 让场景时间停住，镜头和叠层继续走。
- 计划：[PLAN-v2.md](PLAN-v2.md)。音效需求：[SFX-REQUEST.md](SFX-REQUEST.md)，取到的文件放进 `work/film/audio/common/sfx/`，`sfx.py` 会自动用它们替换合成音。
- `chapters/NN-地区/`：每章一个页面（`index.html` + `scene.js`），场景文件开头写着该章的纸艺规格。
- `jobs/*.json`：codex 生图任务（透明贴纸），`tools/gen.py` 执行，记录写入 `work/film/stickers/log.jsonl`。
- `tools/render.py`：静帧和逐帧成片渲染；`tools/sfx.py` 按事件合成音效轨；`tools/sheet.py` 做贴纸拼图。

## 常用命令

```bash
# 生成贴纸（已存在的跳过；--force 重做）
python film/tools/gen.py film/jobs/01-valley.json
# 只导出声音和台词事件表，然后检查台词落点
uv run --with playwright python film/tools/render.py film/chapters/03-village events && python film/tools/mix.py --probe 03-village
# 关键帧静帧（负数表示距结尾多少秒）
uv run --with playwright python film/tools/render.py film/chapters/01-valley stills 4 18.3 24.45
# 整章：逐帧 PNG、无声 MP4、音效 WAV、带音效的预览 MP4
uv run --with playwright --with numpy python film/tools/render.py film/chapters/01-valley video
```

素材和成片都在 `work/film/`（不进 git）：`stickers/`、`fonts/`、`renders/<章节>/`。配乐由剪辑时另行铺入，音效轨单独导出。
