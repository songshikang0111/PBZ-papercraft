# ImageGen 生成记录

使用内置 ImageGen。九张纸偶表启用透明背景，三张底纹表和一张封面底纹使用全幅背景。原图按下表的 ID 保存于主工作区的 `work/archive/v1-book/raw`。

## 纸偶表

各表使用相同的构图约束。将下表对应素材按格位次序接到提示词末尾。

> Create a landscape, transparent production sprite sheet for a mature Chinese dark wuxia pop-up-book film. Use a three-column by two-row grid with six isolated complete silhouettes. Leave generous empty gaps and place each piece within its own cell. Make each an original design in refined, flat frontal, layered matte cardstock, with Chinese woodblock ink, fine paper fibers, a thin dark cut edge and a subtle lit lip. Give standing pieces a clear bottom hinge anchor. Place any cast shadows inside the paper cutouts and keep the surrounding alpha clear. Show complete silhouettes including hands, feet and props. Put three supporting figures in the first row, then the main figure, the landmark, and a connected cluster of decorations. Keep the artwork free of writing or logos.

| ID | 色彩和六格说明 |
| --- | --- |
| `valley` | Storm-washed slate teal, aged brass, mineral red. Lean scrap-metal outlaw with a rectangular serrated blade. Broad mountain chieftain with a huge crescent axe. Puppet bride with a ceremonial robe and crimson flower fan. Cloaked masked pursuer with paired crescent scythes. Riveted antique Chinese steam tower with balconies, pipes, waterwheel and waterfall. Bronze bell, chain, spider lilies and a rock. |
| `forest` | Brown bark, vermilion and tan haze. Wine-drinking sword hermit. Mounted outlaw with a curved thorn shield. Martial artist with bronze gauntlets. Regal witch with red-and-ivory snake motifs. Crimson twisted banyan with timber lookout and red thread. Hanging cages, snapped fence and maple foliage. |
| `village` | Ochre, charcoal and vermilion. Gatekeeper with a riveted greatshield. Seated four-armed wooden musician with a pear-shaped lute. Hooded puppet manipulator with a hand bell and marionette. Female martial aristocrat in cinnabar and moss layers. Stone well cross section with wooden winch and lift. Red threads, tiny fireflies and a broken wooden puppet. |
| `town` | Midnight indigo, amber and vermilion. Lamellar officer with meteor flails. Aquatic acrobat with teal river-dragon headwear. Plum spear fighter. Gold-red lion dancer and extended cloth. Tiered dance hall with layered roofs and amber lanterns. Short decorated storefront. |
| `camp` | Khaki, indigo, antique gold and cinnabar. Armored soldier with golden gourd mace. Crimson-robed swordswoman. Master swordsman with six smaller parchment effigies. Carved thunder puppet with ivory-blue blades. Dovecote on an exposed timber trestle and gate. Tents, banners and palisade. |
| `lake` | Pearl cyan, slate, violet and dark teal. Seated zither player with willow sleeves. Feral aqua trident fighter. White-cloaked snow swordsman. Mauve fighter with two crescent axes. White-walled lakeside snake shrine and pier. Steam boat, cattails and ripples. |
| `prison` | Ochre, smoked terracotta, sage and gray iron. Guard with broad ceremonial saber. Elderly woman with a spiked wooden staff. Pale-masked duelist and two small linked masks. Geometric-armored rogue with an ornamental ring. Ancestral mountain gate, steps, and ledges with suspended cages. Hanging cages and a candle shrine. |
| `estate` | Opera amber, aubergine, bronze and smoked wine. Glaive puppet giant. Twin-knife fighter with straw cape. Masked theater performer with painted half-smiling and half-crying face, carrying a marionette. One-armed martial artist with a fanciful bronze tiger cannon. Shadow-puppet opera hall with a backlit rice-paper screen. Wax lantern, shadow puppet and stage trim. |
| `mountain` | Snow-white, slate, black ink, crimson and muted gold. Wrestler and smaller saw-bearer on his shoulder. Puppeteer with a black cloak. Ceremonial woman with a fan of red paper threads for hair. Angular indigo swordsman with a gold cloud-dragon curve. Snowy mountain shrine with stone arch and broken rock. Snowy pines, bell and prayer ribbons. |

## 页面纹样

> Generate one tall texture atlas with three wide landscape ribbons stacked vertically, each filling exactly one third. Make each a flat overhead, edge-to-edge matte xuan-paper floor print for a mature Chinese dark wuxia pop-up book. Art direct it as a layered Chinese woodblock print with quiet fiber and subdued colors. Keep more detail along the edges and less detail near the middle so figures can stand on the paper in the animation. Make a clean horizontal transition between ribbons. Exclude horizon, typography, logos, hands and a rendered book.

| ID | 上、中、下三条底纹 |
| --- | --- |
| `grounds_early` | Slate blue-green river through shale cliffs and fog. Tan and red-brown forest trail with leaves and thread. Ochre-gray rural terrace stone and wooden boards with concentric grooves. |
| `grounds_mid` | Indigo wet market stone with pale-gold puddle marks and maroon tiles. Flax-gray and slate military drill yard with cart trails. Pearl-celadon lake ripples, islands, aquatic grass and mist. |
| `grounds_late` | Ochre mountain contours, sage cloud scrolls and short angular ledges. Amber theatrical spotlight on tobacco and aubergine boards with ornamental corners. Slate and charcoal ravine under cream snow, with cliff contours and a fine burgundy silk-thread motif. |

## 封面

> Square flat print for the black-blue cloth front cover of a handcrafted Chinese dark wuxia pop-up book. Edge-to-edge ash-indigo textured woven paper with subtle ink grain. Centered oval engraved seal-like landscape emblem in aged copper, sinewy golden lines over red thread, encompassing a tiny lonely sword silhouette seen from the back at the foot of several carved Chinese mountain ridges and a tall antique tower at a distance. Lines appear hand stamped with subtle worn ink. Main emblem around 58 percent of width, blank lower quarter for separate typesetting, no letters, text, logos, typography, designs copied from games, or border. Pure flat front-on view, no book object or cast shadows, luxury antique binding paper.
