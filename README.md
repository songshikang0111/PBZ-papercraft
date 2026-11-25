# 影之刃零 · Papercraft

《影之刃零》(Phantom Blade Zero) 的非官方同人短片项目：把九个地区和关底 Boss 做成立体书纸模，一章一个 three.js 场景，逐帧渲染后混音合成。

> **声明**：这是粉丝自制的非商业项目，与 S-GAME 及《影之刃零》官方无关。游戏名称、角色和世界观归 S-GAME 所有。仓库里只有代码、文档和自行生成的纸艺贴纸。官方原画、游戏截图和实机视频不入库，调研文档只给出来源链接。

## 内容

| 目录 | 说明 |
| --- | --- |
| [`film/`](film/README.md) | 第四版成片「纸艺 Boss 巡礼」：片头、九章地区（地区立起、精英招式展示、关底 Boss 多阶段对决、往下滑转场）、片尾字幕，约 7 分 25 秒 |
| [`film/chapters/`](film/chapters) | 每章一个页面（`index.html` + `scene.js`），场景文件开头写着该章的纸艺规格 |
| [`film/common/`](film/common) | 共用运行时：镜头关键帧、卡片立起、纸偶换姿、纸质特效、3D 纸模建筑和地形 |
| [`film/tools/`](film/tools) | 渲染、音效合成、混音、合成全片的脚本 |
| [`research/`](research/README.md) | 参考资料的采集脚本、目录和来源说明 |
| [`archive/`](archive/README.md) | 旧版：第一版实体翻页书、第二版悲泣溪谷连续俯拍样片和分镜计划 |
| [`.agents/skills/papercraft/`](.agents/skills/papercraft/SKILL.md) | 所用的 Papercraft 立体书风格 skill（v0.6.0，作者 xikhar，MIT 协议） |

制作说明见 [film/README.md](film/README.md)，章节流程见 [film/SOP.md](film/SOP.md)，第三、四版计划见 [film/PLAN-v3.md](film/PLAN-v3.md)。

## 运行

需要 Python 3、[uv](https://github.com/astral-sh/uv)、ffmpeg 和能跑 Playwright Chromium 的环境。场景从 CDN 加载 three.js。

```bash
# 某一章的关键帧静帧（负数表示距结尾多少秒）
uv run --with playwright python film/tools/render.py film/chapters/01-valley stills 4 18.3 24.45

# 整章逐帧渲染，输出无声 MP4、音效 WAV 和预览 MP4
uv run --with playwright --with numpy python film/tools/render.py film/chapters/01-valley video

# 批量渲染 → 混音 → 合成全片
film/tools/queue.sh 01-valley 02-forest
python film/tools/mix.py
python film/tools/assemble.py
```

生成的贴纸、字体、配乐、配音和渲染结果都放在本地 `work/` 目录下，不入库。只克隆仓库时，章节页面能打开，但缺少这些素材，需要先用 `film/tools/gen.py` 按 `film/jobs/*.json` 生成贴纸，并自备字体和音频。

## 致谢

- 纸艺风格方法和示例来自 Papercraft skill（xikhar，MIT）。
- 地图、图鉴和实机参考的来源见 [research/README.md](research/README.md)，包括 BWIKI、pbz.gg、All Things How 和 S-GAME 媒体中心等。
