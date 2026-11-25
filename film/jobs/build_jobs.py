"""Write the sticker job files for every chapter from one table: (id, catalog keyword for the content references, how
many references, subject line). References are picked from research/catalog.json (the region's scene and boss-frame
images whose subject contains the keyword). Run: python film/jobs/build_jobs.py"""
import json, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
CAT = json.load(open(ROOT / 'research/catalog.json'))
STY = {'path': 'work/boss-chibi/透明PNG/01 悲泣溪谷/05 追命·组织猎杀者.png', 'role': 'STYLE reference only: copy its matte cut-paper rendering, edge treatment, grain and value steps; not its subject.'}
STY2 = {'path': 'work/film/stickers/01-valley/wedding.png', 'role': 'STYLE reference for props and buildings: copy exactly this cut-paper prop rendering (layered card planes, dark cut edge, matte grain); not its subject.'}
ROLE = 'CONTENT reference (game screenshot): take the subject, its structure, materials and palette from it; redraw it fresh in the paper style; ignore UI, characters, markers, subtitles and watermarks.'


def refs(region, key, n=2):
    out = []
    for kind in ('scene', 'boss-frame', 'boss'):
        for i in CAT['images']:
            if i['region'] == region and i['kind'] == kind and key in i['subject'] and len(out) < n:
                out.append('work/reference-library/' + i['file'])
    return out


T = {
 '01-valley': ('01-valley', [
  ('stele', '杀气塔', 2, 'A weathered stone stele on a turtle-shaped stone base, carved panel face with worn script grooves (no readable text), moss on top, a faded red cloth tied round it. Front view. Palette: grey stone, moss green, faded red.'),
  ('redposts', '杀气塔', 2, 'A cluster of three leaning wooden stakes driven into the ground with many red threads strung between them and hanging down, a small paper talisman tied to one. Front view. Palette: dark grey wood, crimson threads, off-white paper.'),
  ('planks', '杀气塔', 2, 'A pile of broken weathered grey planks and a toppled wooden barrel, a coil of hemp rope. Front view, low and wide. Palette: grey wood, hemp, rust nails.'),
 ]),
 '02-forest': ('02-forest', [
  ('maple', '悬崖', 2, 'A Chinese red maple tree in full autumn colour: twisted dark trunk, a broad layered crown of crimson, scarlet and orange leaf clusters in three value steps. Front view. Palette: crimson, vermilion, orange, dark brown bark.'),
  ('bigtree', '巨树', 3, 'An enormous ancient twisted tree with a gnarled split trunk and roots, its branches hung with countless red threads and small red paper tags, a sparse dark crown. Front view, the landmark of a haunted forest. Palette: dark umber bark, crimson threads, muted dusk purple shadows.'),
  ('banditcamp', '飞贼营地', 3, 'A bandit camp shack: a crooked wooden lean-to with a ragged straw-thatch roof, hanging hides and a tattered banner, crates and a cooking pot on a tripod. Three-quarter front view. Palette: weathered brown wood, straw ochre, faded red cloth.'),
  ('bridge', '飞贼营地 · 悬崖', 2, 'A short rickety wooden plank footbridge segment with rope railings and wooden posts, seen from the side. Palette: grey-brown planks, hemp rope.'),
  ('cliff', '悬崖', 3, 'A wide backdrop of rust-red and grey rocky cliffs with red maple trees on the ledges and drifting mist at the base, bottom edge straight. Frontal elevation, a wide layered backdrop card. Palette: grey stone, rust red, autumn crimson.'),
  ('whiteflowers', '镜林巨树和红线花场', 2, 'A wide low clump of small white wildflowers with pale violet centres in dark green leaves, bottom edge flat. Front view. Palette: off-white, pale lilac, dark sage green.'),
  ('redbush', '悬崖', 2, 'A low round autumn shrub with crimson and orange leaf clusters, bottom edge flat. Front view. Palette: crimson, orange, umber.'),
  ('mirrorpine', '镜林', 3, 'A tall misty dark-teal fir tree of an eerie mirror forest, layered drooping boughs, a few pale lichen strands. Front view. Palette: deep teal green, slate, pale grey-green.'),
 ]),
 '03-village': ('03-village', [
  ('house', '三偶井井口', 3, 'An old village house of Lu Village: dark timber frame, grey plastered walls, a curved grey-tile roof, a wooden door with red couplet strips (no readable text), two red paper lanterns, a clay jar by the door. Three-quarter front view. Palette: dark wood, grey plaster, grey tile, red lantern accents.'),
  ('well', '井口绞盘', 3, 'The Three-Puppet Well: a round dry-stone well rim with a wooden windlass frame and rope, red ropes and red ribbons tied round it, small clay jars beside it. Three-quarter front view. Palette: grey fieldstone, dark wood, crimson rope.'),
  ('rednet', '三偶井井口', 2, 'A wooden frame strung with a dense net of red ropes and knots, like a cat\'s cradle web, standing on two posts. Front view. Palette: dark wood, crimson rope.'),
  ('terrace', '梯田', 2, 'A low dry-stone terrace retaining wall with stone steps rising through it and tufts of grass on top. Front view, wide and low. Palette: grey-ochre fieldstone, dry grass.'),
  ('reeds', '升降', 2, 'A wide clump of golden dry pampas reeds with feathery plumes glowing in sunset, bottom edge flat. Front view. Palette: warm gold, amber, dry ochre.'),
  ('lonetree', '升降', 2, 'A lone bare windswept tree on a plain at sunset, a slender leaning trunk and sparse twisting branches. Front view. Palette: dark umber silhouette with warm amber rim.'),
  ('boardwalk', '三偶井井口、井台与木栈', 2, 'A short wooden plank boardwalk on posts with a simple rail, red rope knots tied at the posts. Three-quarter view. Palette: weathered brown planks, crimson rope.'),
 ]),
 '04-town': ('04-town', [
  ('lionhall', '舞狮馆', 3, 'The Lion Dance Hall gate: a tall red-lacquered Chinese gatehouse with a curved double roof, carved brackets, a big lion-head ornament above the door, red lanterns hanging from the eaves. Front elevation. Palette: deep red, dark wood, tarnished gold, black tile.'),
  ('stakes', '桩阵', 3, 'A group of wooden plum-blossom stakes for lion dancing: seven tall round wooden posts of different heights with iron bands, some charred. Front view. Palette: dark brown wood, black char, iron grey.'),
  ('lanterns', '桩阵', 2, 'A string of red paper lanterns hanging from a sagging rope between two tall poles, with small triangular flags. Front view, wide. Palette: red lanterns with gold bands, dark poles.'),
  ('shop', '后街', 2, 'A two-storey wooden shop house on a night street: dark timber, paper windows, a cloth awning, a hanging shop banner (no readable text), a lantern. Three-quarter front view. Palette: dark wood, warm paper windows, faded red.'),
  ('drum', '舞狮馆', 2, 'A large red lion-dance drum on a wooden stand with drumsticks, gold studs around the rim. Three-quarter view. Palette: red, gold, dark wood.'),
  ('dockboat', '水行帮主', 2, 'A half-sunk wooden sampan boat with a broken mast at a dock, lily pads around it. Side view. Palette: dark wet wood, green lily pads.'),
  ('lionmask', '舞狮', 2, 'A giant ornate lion-dance lion head mask, fierce face, flaming red and gold fur fringe, big eyes, open mouth. Front three-quarter view. Palette: crimson, flame orange, gold, black.'),
 ]),
 '05-camp': ('05-camp', [
  ('palisade', '栅栏', 2, 'A section of a sharpened log palisade wall with a small wooden gate and rope lashings. Front view, wide. Palette: weathered brown logs, hemp rope.'),
  ('watchtower', '大营', 3, 'A wooden military watchtower on four log legs with cross braces, a small roofed lookout box on top with a tattered banner. Front view. Palette: brown timber, grey thatch, faded white banner.'),
  ('burningtower', '七星阵场地、屋顶和木构横梁', 3, 'A burning wooden scaffold tower on a training ground, cross-braced timber, layered paper flames licking up one side. Front view. Palette: charred brown timber, orange and red flames.'),
  ('roof', '红衣女剑客', 3, 'A Chinese hall roof seen from the side and slightly above: a sweeping hip-and-gable roof of grey tiles with upturned eaves and a tall bronze finial spire at the top. Palette: dark grey tile, bronze.'),
  ('hallgate', '剑偶', 3, 'A dark red training hall gate with a horizontal plaque (no readable text), red pillars, a red curtain, red candles burning in front. Front elevation. Palette: deep red, black lacquer, candle orange.'),
  ('weaponrack', '校场', 2, 'A wooden weapon rack holding spears, swords and a halberd, a straw training dummy next to it. Front view. Palette: brown wood, iron grey, straw.'),
  ('candles', '校场', 2, 'A cluster of red ritual candles of different heights on the ground, small flames, melted wax. Front view, low. Palette: crimson, warm wax, small orange flames.'),
  ('pigeonhouse', '鸽舍', 2, 'A raised wooden pigeon loft hut on stilts with a small ladder and a few grey pigeons on the roof. Three-quarter view. Palette: brown wood, grey roof, slate grey birds.'),
 ]),
 '06-lake': ('06-lake', [
  ('mechboat', '机关船', 3, 'A mechanical wooden boat with a round riveted iron prow pod that has a glowing red eye-lamp, a small cabin and oars. Side three-quarter view. Palette: dark wood, iron, one red lamp.'),
  ('pier', '码头', 2, 'A wooden pier on piles stretching sideways, a mooring post with rope and a paper lantern on a pole. Side view. Palette: grey-brown wood, rope.'),
  ('reeds', '鱼人', 2, 'A wide clump of tall green-grey lake reeds and cattails, bottom edge flat. Front view. Palette: grey-green, ochre tips.'),
  ('bamboo', '白蛇屋前厅、竹林与木桩', 3, 'A dense clump of green bamboo stalks with leaf sprays. Front view. Palette: jade and grey green.'),
  ('snakehouse', '白蛇屋', 3, 'The White Serpent House: an elegant lakeside Chinese hall with white plaster walls, dark timber, a curved grey-tile roof and a wooden veranda over the water. Three-quarter front view. Palette: white plaster, dark wood, grey tile.'),
  ('island', '码头 · 白蛇屋', 3, 'A wide misty backdrop of karst islands rising from a lake with a small pavilion on one and snowy mountains far behind, bottom edge straight. Frontal layered backdrop card. Palette: grey-green rock, pale mist, white snow caps.'),
  ('wreck', '风雪刀客', 3, 'A snow-covered wrecked wooden ship lying broken on its side at a frozen dock, snow drifts on the deck and broken masts. Three-quarter view. Palette: dark wood, white snow, pale ice blue.'),
  ('snowdock', '风雪刀客', 2, 'A broken snowy wooden dock platform with a red torii-like post and a lantern, snow on the planks. Front view. Palette: dark wood, white snow, one red post.'),
 ]),
 '07-prison': ('07-prison', [
  ('cage', '囚笼', 3, 'A wooden prison cage hanging by chains from a tall wooden gallows post, bars of rough timber. Front view. Palette: dark wood, iron chain.'),
  ('mistcliff', '雾门', 3, 'A wide backdrop of sheer vertical grey-green karst cliffs with mist and clinging trees, red cloth strips hanging from ropes across the gap, bottom edge straight. Frontal backdrop card. Palette: grey-green rock, pale mist, red accents.'),
  ('ribbons', '雾门、枷笼山入口及山道祭坛', 3, 'Two tall poles with long red ribbons and paper talismans fluttering in the wind. Front view. Palette: dark wood, crimson ribbons, off-white paper.'),
  ('shrinegate', '宗祠', 3, 'An ancestral hall mountain gate: a dark stone and timber gatehouse with a grey tile roof and two stone lanterns. Front elevation. Palette: dark grey stone, black timber, grey tile.'),
  ('redhall', '荒行子', 3, 'The interior back wall of a red-lit ancestral hall: dark red pillars, lattice screens, rows of red lanterns and an altar table with candles. Frontal elevation, wide. Palette: deep crimson, black lacquer, warm candlelight.'),
  ('fern', '囚笼', 2, 'A lush clump of dark green ferns, bottom edge flat. Front view. Palette: deep green, sage.'),
  ('altar', '雾门、枷笼山入口及山道祭坛', 2, 'A mountain road altar: a small stone shrine with offerings and red cloth, a broken red crystal cluster beside it. Front view. Palette: grey stone, crimson.'),
 ]),
 '08-estate': ('08-estate', [
  ('redgate', '戏楼、红门和水上灯笼', 3, 'A grand red lacquered double door gate with gold studs and a carved lintel, a white stone lion statue on each side. Front elevation. Palette: deep red, gold, white stone.'),
  ('opera', '山庄入口、灯池与戏楼外围', 3, 'A two-storey Chinese opera stage tower with curved eaves, red pillars, a stage opening with curtains, lanterns along the eaves. Front elevation. Palette: deep red, dark wood, black tile, warm lantern light.'),
  ('puppetscreen', '皮影八幕、红绳与灯位', 3, 'A Chinese shadow-puppet theatre screen: a glowing warm parchment screen in an ornate red frame with a painted gateway scene and two shadow-puppet figures silhouetted on it. Front view. Palette: warm parchment, red frame, dark puppet silhouettes.'),
  ('waterlanterns', '戏楼、红门和水上灯笼', 2, 'A group of floating lotus-shaped paper lanterns, small flames. Front view, low and wide. Palette: pale pink and red paper, warm flame.'),
  ('stairs', '圣躯心池、长阶与门楼', 3, 'A long stone stairway leading up to a red gate tower, with carved balustrades on both sides and red lanterns. Front elevation. Palette: grey stone, deep red, warm lanterns.'),
  ('willow', '山庄入口、灯池与戏楼外围', 2, 'A drooping willow tree with long hanging fronds. Front view. Palette: muted night green, dark trunk.'),
  ('tigercannon', '雷当', 3, 'A huge bronze tiger-head cannon: an ornate snarling tiger head with a cannon muzzle in its open mouth, on a heavy wheeled carriage. Three-quarter view. Palette: dark bronze, gold, iron.'),
 ]),
 '09-mountain': ('09-mountain', [
  ('snowpine', '断魂山路线截图', 3, 'A snow-laden dark fir tree with heavy white snow on each layered bough. Front view. Palette: dark blue-green, white snow, cool shadows.'),
  ('temple', '断魂山路线截图 04', 2, 'A red mountain temple hall in snow: red pillars and doors, a heavy grey tile roof covered with snow, warm light inside, stone steps. Three-quarter front view. Palette: crimson, white snow, warm interior light.'),
  ('snowcliff', '断魂山路线截图 10', 3, 'A wide backdrop of jagged snowy mountain ridges and dark rock under night sky tones, bottom edge straight. Frontal backdrop card. Palette: white snow, blue-grey rock, deep navy.'),
  ('plankpath', '断魂山路线截图 08', 2, 'A snowy wooden plank walkway on stilts along a cliff edge, snow on the planks. Side view. Palette: dark wood, white snow.'),
  ('candlealtar', '冷荼', 3, 'A snowy altar of many red candles around a wooden cross-shaped grave marker, red cloth, small flames. Front view. Palette: crimson, white snow, dark wood, warm flames.'),
  ('icechunks', '力者和锯者', 3, 'A cluster of broken ice slabs and frozen rocks jutting from a frozen lake. Front view, low. Palette: pale ice blue, white, slate.'),
  ('bareTree', '断魂山路线截图 14', 2, 'A bare frosted winter tree with twisted branches dusted with snow. Front view. Palette: dark brown, white frost.'),
  ('tent', '断魂山路线截图 16', 2, 'A snowy last camp: a canvas tent, a wooden fence, a campfire and a round wooden shield target. Three-quarter view. Palette: canvas grey, dark wood, warm fire.'),
 ]),
}

for chap, (region, items) in T.items():
    region_key = region
    jobs = []
    for sid, key, n, text in items:
        rs = refs(region_key, key, n)
        if not rs: print('no refs for', chap, sid, key)
        jobs.append({'id': f'{chap}-{sid}', 'out': f'{chap}/{sid}.png', 'inputs': [STY, STY2] + [{'path': p, 'role': ROLE} for p in rs], 'prompt': 'Subject: ' + text})
    name = 'film/jobs/' + chap + ('-extra' if chap == '01-valley' else '') + '.json'
    json.dump(jobs, open(ROOT / name, 'w'), ensure_ascii=False, indent=1)
    print(name, len(jobs))
