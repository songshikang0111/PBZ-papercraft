# 悲泣溪谷 · 连续俯拍样片

用 14.5 秒试验连续俯拍、首领 Q 版比例和地标层级。镜头从驿道一路向下滑动，先经过残钢，再过彭猛的谷道，最后掠过钢铁巨塔与大瀑布，看追命立起。横屏和竖屏独立取景，同样保留整条镜头轨迹。竖屏 720 × 1280，横屏 1280 × 720，24 fps。完整版分镜见 [第二版规划](../plans/v2-continuous-descent.md)。

## 图像输入与输出

最终使用的七张原图都以研究图库中的游戏图像为 ImageGen 视觉输入。角色稿重做了体型、面具、服饰和纹样，建筑稿重新设计了立面和水轮组合。工具按每一行单独生成原图，杂项图集再裁切。本地研究图库在 [work/reference-library](../../work/reference-library/index.html)。

| 输出 | 实际参考输入 | 使用方式 |
| --- | --- | --- |
| `broken-steel` · 残钢 | 图鉴 `7868bbb445ee.png`，实机 `f0119ebd89ff.webp` | 破损金属的大轮廓、低重心与朽铁色；重画方形半面罩和半斜大刃 |
| `axe-master` · 彭猛 | 图鉴 `be746f74913f.png`，实机 `66a8db22e27c.webp` | 肩宽、斧柄姿态和沉重体型；夸张成大肩矮腿、粗线条斧面 |
| `scythe-pursuer` · 追命 | 六绝凶镰图鉴 `2243fe2387b4.png`，池边实机 `8cb241f0ccb6.webp` | 镰状轮廓与红墨反差；暖白面具和六道弧形折片意象 |
| `iron-tower` · 钢铁巨塔 | 手绘地图 `c588dd8e3967.png`，金属管道实机 `b5271b023da7.jpg`，塔前实机 `0e928c61dfb8.jpg` | 取山谷里竖向塔身、深檐、管道与石阶的关系；独立水轮塔稿 |
| `waterfall` · 大瀑布 | 瀑布路段 `bfd0f7f885ab.jpg`，瀑布池 `6fdedd2b2032.webp` | 水帘竖向分层、墨岩和灰绿水色；单独裁出折片 |
| `props` · 12 格图集 | 驿道实机 `0315241e6b14.jpg`、瀑布路段、手绘地图 | 取谷壁、松树、风化木和红色局部，含旅人、两类小怪、门、铃、矮栏、松、岩、芦苇及花 |
| `ground` · 连续底纹 | 手绘地图、瀑布路段、驿道实机 | 取灰青地貌、湿石和白水走势；重新排成连续可走的 S 形路径 |

[逐张生图记录](imagegen.json)可以查看实际提示词和每个输入文件。地图、图鉴和实机可从 [悲泣溪谷图库](../../work/reference-library/index.html?region=01-valley) 查阅。生产图与图集裁切见 `art/`，原始 ImageGen 输出在 `work/archive/v2-valley/raw/`。

## 纸景规格

- 28° 长焦，约 48° 俯视。连续移动的焦带用于辨认脚下路线、纸偶和远处构件。竖版收近镜头并抬升焦点。
- 以黛青岩、灰绿水、暖灰纸路、旧铜、朱红点色为主。Q 版首领约 2.7–3 个头高。宽刀、巨斧、弧镰分别构成三种清楚剪影。
- 地面是生成的连续纸纹，纸偶、巨塔和瀑布有透明印刷正背面、约 1.8% 厚度的实几何裁边、接触阴影与铰链。两组低矮小怪只做比例参照。
- 开头纸景从平面抬升。后面经过已经立起的谷景时，Boss、塔和水帘分别翻开朝下收起的折片，露出印刷面。声音用原创溪流、轻纸折和稀疏拨弦。

## 本地复现

在仓库根目录准备运行环境。

```bash
npm ci --prefix archive/v2-valley
uv run --with playwright python archive/v2-valley/render.py \
  --format vertical --stills 3 6.8 11.6 --output work/archive/v2-valley/qa/vertical
```

去掉 `--stills` 和对应的时间，输出文件名指定为 `work/archive/v2-valley/valley-9x16.mp4` 即可渲染 MP4。横屏使用 `--format horizontal`。渲染需要 Chrome 和 FFmpeg。Linux 上可用 `--gpu` 选择 ANGLE OpenGL，或用 `--software` 选择 SwiftShader。

音轨从 `score.py` 生成并经 FFmpeg 做响度处理，用 `--audio` 传入 WAV。若要从原始 ImageGen 图重新打包，用 Pillow、NumPy 和 OpenCV 运行 `prepare_art.py`，参数为原图目录。
