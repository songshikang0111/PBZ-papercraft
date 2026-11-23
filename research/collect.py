"""Build a local visual reference library from publicly linked game material."""

from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor
from hashlib import sha256
from io import BytesIO
import json
from pathlib import Path
import re
from threading import Semaphore
from urllib.parse import quote, unquote, urljoin, urlsplit

from bs4 import BeautifulSoup
from PIL import Image
import requests


ROOT = Path(__file__).resolve().parents[1]
WORK = ROOT / 'work' / 'reference-library'
CACHE = ROOT / 'work' / 'archive' / 'reference-cache' / 'html'
BWIKI = 'https://wiki.biligame.com/yingzhiren/'
CDX = 'https://pbz.gg'
OFFICIAL = 'https://pbz.s-game.com'
GUIDE = 'https://www.3dmgame.com/gl/3993074'
GAME = 'https://www.gamersky.com/handbook/'
CLIPS = 'https://www.youtube.com/watch?v=sfk5xxCzCJ8'
REGIONS = {
    '00-prologue': '序章', '01-valley': '悲泣溪谷', '02-forest': '血色森林',
    '03-village': '陆家村', '04-town': '庞镇', '05-camp': '正道大营',
    '06-lake': '梅谷湖', '07-prison': '枷笼山', '08-estate': '戏梦山庄', '09-mountain': '断魂山',
}
REGION_IDS = {name: key for key, name in REGIONS.items()}
REGION_IDS.update({'陆家村地区': '03-village', '庞镇地区': '04-town', '断魂崖': '09-mountain'})
# Page numbers indexed against the original playthrough, one row per beat or character.
SCENE_PAGES = {
    '00-prologue': {1: '庞镇外的开场与追逐', 2: '序章出口'},
    '01-valley': {17: '驿道与崖壁', 48: '血肉花田与喜堂', 56: '大瀑布与机械结构',
                 57: '杀气炉', 59: '巨塔与木栈道', 69: '瀑布到山路'},
    '02-forest': {96: '进林与荒废官道', 110: '木栈道与亡命徒场地', 129: '飞贼营地',
                  153: '镜林入口', 159: '镜林巨树与红线', 697: '结冰后镜林'},
    '03-village': {177: '村口梯田与瓦屋', 198: '村落旧街与桥', 224: '三偶井外围',
                   235: '三偶井下方', 238: '井下人偶设施', 244: '暗道与船坞'},
    '04-town': {255: '镇口及后街街巷', 281: '机关船入口', 287: '黄家宅邸',
                309: '屋瓦与街道', 335: '舞狮馆前', 351: '舞狮馆与封印地', 356: '后街地窖'},
    '05-camp': {441: '营前山谷大门', 461: '营地木垒', 481: '鸽舍高塔一带',
                487: '七星剑阵屋面', 498: '校场入口', 502: '校场高低落差'},
    '06-lake': {379: '湖面与码头', 383: '梅谷乐坊', 390: '岛屿湖岸',
                401: '白蛇屋', 407: '水行帮码头', 627: '幻术师遗迹与雪谷'},
    '07-prison': {522: '枷笼山入口', 529: '铁杀营地', 547: '囚笼与机关',
                  557: '宗祠外山门', 575: '山道与宗祠', 581: '宗祠前场'},
    '08-estate': {640: '入庄门庭', 646: '演武场', 650: '戏票与戏楼',
                  652: '皮影幕与舞台', 657: '游廊与厅堂', 674: '圣躯心池前', 680: '出庄裂墙'},
    '09-mountain': {701: '雪谷与山神庙', 703: '山路雪石', 705: '最后的正道营地',
                    709: '断魂崖入口', 712: '大梦倾颓处前路', 716: '断魂山终局镜头'},
}
WALK_GUIDES = {
    '01-valley': [('202611/2241946', 3, ('瀑布','钢铁巨塔','杀气塔','栈道','喜堂'))],
    '02-forest': [('202611/2242145', 3, ('镜林','巨树','飞贼营地','官道','悬崖'))],
    '03-village': [('202611/2242215', 3, ('三偶井','井下','升降','梯田','坑底'))],
    '04-town': [('202610/2238139', 10, ('舞狮馆','景炀轩','码头','祠堂','后街'))],
    '05-camp': [('202611/2248047', 2, ('鸽舍','校场','大营','高塔','栅栏'))],
    '06-lake': [('202611/2248055', 3, ('机关船','码头','白蛇屋','乐坊','鱼人','镜子'))],
    '07-prison': [('202611/2248070', 2, ('囚笼','宗祠','山门','铁杀营地','箭塔'))],
    '08-estate': [('202611/2241522', 1, ('戏楼','戏票','圣躯','戏园','戏台'))],
}
SEPARATE_BOSSES = [
    ('08-estate', '幽怨女娃：呜呜呜', '同一图鉴在普通敌人中也出现；按有独立遭遇的补录处理。', BWIKI + quote('幽怨女娃：呜呜呜')),
    ('07-prison', '铁面杀手', '赎罪名单支线交战；普通敌人图鉴另有铁面。', GAME + '202610/2236093_35.shtml'),
]
BOSS_PAGES = {
    15: '残钢', 24: '彭猛', 50: '阿花', 61: '追命', 76: '金面具黑衣人', 100: '花千笑',
    117: '荆野', 151: '铁狂', 163: '白赤练', 185: '拙壁', 206: '毕远', 214: '碧海',
    219: '炎茹', 234: '荡秽', 237: '玉瓒', 242: '沐小葵', 264: '火流星', 278: '斩骑',
    303: '武轩', 316: '婉约', 323: '谢秋冬', 337: '游龙', 341: '长鸿', 353: '烈焰',
    359: '雷婷', 367: '勾魂', 373: '诡异魔偶', 376: '祝原', 385: '烟千岁', 391: '独眼弓客',
    400: '断肠', 405: '发狂的水行帮主', 424: '蛊鹤', 445: '吞噬尸体的小雪',
    456: '万钧', 473: '乌冷霜', 485: '红衣女剑客', 489: '大师兄', 500: '玉璧',
    527: '铁杀', 542: '毕峰', 552: '奎艳艳', 579: '玉面郎君', 582: '荒行子',
    593: '寒岁|清道夫', 629: '风雪刀客', 648: '玉鼎', 659: '囚锋', 677: '雷当',
    699: '玉琮', 710: '力者|锯者', 713: '冷荼', 714: '梦华圣母', 715: '左殇',
}
VIDEO_CHAPTERS = {
    '少年左殇': 0, '组织冥主：左殇（序章）': 141, '组织猎杀者：追命': 402, '残钢': 522,
    '彭猛': 682, '六绝凶镰': 939, '花千笑': 1613, '荆野': 1935, '阿花': 2215,
    '铁狂': 2469, '白赤练': 2860, '拙壁': 3849, '毕远': 3994, '碧海': 4294,
    '炎茹': 4554, '玉瓒': 4805, '沐小葵': 5243, '铁鬼': 5243, '玉妖': 5243,
    '火流星': 6362, '斩骑': 6913, '武轩': 7101, '婉约': 7318, '谢秋冬': 7795,
    '水行帮主：游龙': 8029, '长鸿': 8190, '勾魂': 8932, '烈焰': 9233, '最后一舞': 9233,
    '阿瑾': 10182, '断肠': 10436, '诡异魔偶': 10660, '金面具黑衣人': 11007,
    '荡秽': 11788, '万钧': 12494, '吞噬尸体的小雪': 12795, '乌冷霜': 13146,
    '红衣女剑客': 13575, '大师兄': 13741, '玉璧': 14272, '祝原': 14721, '烟千岁': 14888,
    '蛊鹤': 15171, '发狂的水行帮主': 15387, '铁杀': 16273, '毕峰': 16469, '奎艳艳': 16689,
    '玉面郎君': 17020, '荒行子': 17301, '清道夫': 17972, '寒岁': 17972, '雷婷': 18376,
    '独眼弓客': 18551, '风雪刀客': 19154, '玉鼎': 19630, '囚锋': 20037, '魔渊': 20193,
    '雷当': 20935, '力者': 22034, '锯者': 22034, '玉琮': 23067, '冷荼': 23609,
    '梦华圣母': 23609, '左殇': 25009, '真龙之躯': 25618,
}
LIMITS = defaultdict(lambda: Semaphore(4))


def cached(key, url):
    file = CACHE / f'{key}.html'
    if file.exists() and file.stat().st_size != 7351:
        return file.read_text()
    r = requests.get(url, timeout=18)
    r.raise_for_status()
    body = r.content.decode('utf-8', errors='replace')
    file.write_text(body)
    return body


def read_soup(key, url):
    return BeautifulSoup(cached(key, url), 'html.parser')


def bwiki_original(src):
    if '/thumb/' in src:
        return src.replace('/thumb/', '/').rsplit('/', 1)[0]
    return src


def resource(region, kind, subject, view, page, url, **fields):
    return dict(region=region, kind=kind, subject=subject, view=view, page=page, url=url, **fields)


def work_item(func, arg):
    try:
        return func(arg)
    except (requests.RequestException, ValueError, KeyError, IndexError, OSError) as error:
        print(f'{func.__name__} {str(arg)[:150]}: {error}', flush=True)
        return None


def parallel(func, args, threads=12):
    with ThreadPoolExecutor(max_workers=threads) as pool:
        return [x for x in pool.map(lambda arg: work_item(func, arg), args) if x is not None]


def index_cards(soup, kind):
    rows = {}
    for card in soup.select('.yzr-enemy-card'):
        name_link = card.select_one('a.yzr-enemy-card-name')
        if not name_link or not card.select_one('.yzr-enemy-card-meta'):
            continue
        name = name_link.get_text(' ', strip=True)
        image = card.select_one('img')
        details = card.select('.yzr-enemy-card-meta a')
        area = details[0].get_text(' ', strip=True) if details else '未标注'
        page = urljoin(BWIKI, name_link['href'])
        if name not in rows:
            rows[name] = {
                'name': name, 'region': REGION_IDS.get(area, 'cross-region'), 'areas': [],
                'type': card.select_one('.yzr-enemy-card-type').get_text(' ', strip=True),
                'page': page, 'images': [], 'video': [],
            }
        row = rows[name]
        if area not in row['areas']:
            row['areas'].append(area)
        if image and not row['images']:
            row['images'].append(resource(row['region'], kind, name, '图鉴半身像', page,
                                         bwiki_original(image['src']), credit='S-GAME / BWIKI'))
    return list(rows.values())


def character_detail(entry):
    page = entry['page']
    name = entry['name']
    slug = unquote(urlsplit(page).path.split('/')[-1])
    api = BWIKI + 'api.php?action=parse&format=json&prop=text&page=' + quote(slug, safe='')
    key = 'boss-' + sha256(name.encode()).hexdigest()[:10]
    html = json.loads(cached(key, api))['parse']['text']['*']
    s = BeautifulSoup(html, 'html.parser')
    results = []
    for im in s.select('img'):
        src = im.get('src', '')
        if 'patchwiki.biligame.com/images/yingzhiren/' not in src:
            continue
        width = int(im.get('data-file-width', im.get('width', 0)) or 0)
        if width < 450:
            continue
        label = unquote(src.split('/')[-1])
        alt = im.get('alt') or ''
        description = label + alt
        if not any(word in description for word in ('全身','半身','侧面','背面','立绘','截图','形象','人偶','原画','角色','演示')):
            continue
        view = next((x for x in ('全身','侧面','背面','半身','原画','截图') if x in description), '图鉴补图')
        results.append(resource(entry['region'], 'boss', name, view, page, bwiki_original(src), credit='S-GAME / BWIKI'))
    return results


def pbz_detail(arg):
    page, region, primary = arg
    s = read_soup('pbz-' + page.rstrip('/').split('/')[-1], page)
    results = []
    for image in s.select('main img'):
        src = image.get('src', '')
        alt = image.get('alt', '')
        if '/media/game/bosses/' not in src or '-portrait-' not in src:
            continue
        if not alt.startswith('影之刃零首领：'):
            continue
        path = '/media/game/bosses/' + src.split('/media/game/bosses/', 1)[-1]
        name = alt.removeprefix('影之刃零首领：') or primary
        results.append(resource(region, 'boss', name, '图鉴宽幅', page, urljoin(CDX, path), credit='S-GAME / pbz.gg'))
    return list({row['url']: row for row in results}.values())


def guide_scene(arg):
    region, number, label, focus = arg
    page = f'{GUIDE}_{number}.html' if number > 1 else f'{GUIDE}.html'
    s = read_soup(f'3dm-{number}' if number > 1 else '3dm-start', page)
    main = s.select_one('.news_warp_center') or s.select_one('.news_content') or s.select_one('article')
    if not main:
        return []
    images = [a for a in main.select('img[src*="/uploads/images/gl/"]')]
    if not images:
        return []
    rows = []
    for i, image in enumerate(images[:5 if focus else 2]):
        rows.append(resource(region, 'boss-frame' if focus else 'scene', label,
                             f'实机帧 {i + 1}', page, urljoin(page, image['src']), credit='S-GAME / 3DM 实机图文'))
    return rows


def guide_gamersky(arg):
    region, relative, markers = arg
    page = GAME + relative + '.shtml'
    s = read_soup('gs-' + relative.split('/')[-1], page)
    matched = []
    for image in s.select('.Mid2L_con img[data-src]'):
        parent = image.find_parent('p')
        if not parent or not image.parent.get('href','').startswith(('http','//')):
            continue
        prev = parent.find_previous_sibling('p')
        if not prev:
            continue
        caption = prev.get_text(' ', strip=True)
        terms = [m for m in markers if m in caption]
        if not terms:
            continue
        url = image.parent['href'].split('?', 1)[-1]
        if not url.startswith('https://img'):
            continue
        matched.append(resource(region, 'scene', ' · '.join(terms[:3]), '实机截图',
                                page, url, credit='S-GAME / 游民星空实机图文'))
    return matched[:10]


def load_image(row):
    work = dict(row)
    region, kind = work['region'], work['kind']
    url = work['url']
    key = sha256(url.encode()).hexdigest()[:12]
    directory = WORK / 'images' / region / kind
    directory.mkdir(parents=True, exist_ok=True)
    old = list(directory.glob(f'{key}.*'))
    if old:
        path = old[0]
    else:
        with LIMITS[urlsplit(url).netloc]:
            r = requests.get(url, timeout=24)
            r.raise_for_status()
        with Image.open(BytesIO(r.content)) as im:
            im.verify()
            extension = {'JPEG':'jpg','PNG':'png','WEBP':'webp','GIF':'gif'}.get(im.format)
        if extension is None:
            raise ValueError('unexpected file format')
        path = directory / f'{key}.{extension}'
        path.write_bytes(r.content)
    with Image.open(path) as im:
        work['size'] = list(im.size)
    work['file'] = path.relative_to(WORK).as_posix()
    work['sha256'] = sha256(path.read_bytes()).hexdigest()
    return work


def norm(name):
    chars = str.maketrans({'軒':'轩','約':'约','異':'异','紅':'红','鋼':'钢','殤':'殇','夢':'梦',
                          '「':'','」':'',' ':''})
    return re.sub(r'[：·“”『』-，,，。]', '', name.translate(chars))


def video_links(row):
    name = norm(row['name'])
    for key, stamp in sorted(VIDEO_CHAPTERS.items(), key=lambda x: -len(x[0])):
        if norm(key) in name:
            row['video'].append(CLIPS + '&t=' + str(stamp) + 's')
            break


def main():
    CACHE.mkdir(parents=True, exist_ok=True)
    WORK.mkdir(parents=True, exist_ok=True)
    api = BWIKI + 'api.php?action=parse&format=json&prop=text&page=' + quote('头目')
    boss_html = json.loads(cached('api', api))['parse']['text']['*']
    bosses = index_cards(BeautifulSoup(boss_html, 'html.parser'), 'boss')
    print(f'{len(bosses)} BWIKI boss records', flush=True)
    assert len(bosses) == 75
    enemies = index_cards(read_soup('human', BWIKI + quote('人形怪')), 'enemy')
    try:
        animal_json = json.loads(cached('animal-api', BWIKI + 'api.php?action=parse&format=json&prop=text&page=' + quote('兽形怪')))
        enemies += index_cards(BeautifulSoup(animal_json['parse']['text']['*'], 'html.parser'), 'enemy')
    except (KeyError, ValueError, requests.RequestException) as error:
        print(error)
    images = [im for boss in bosses + enemies for im in boss['images']]
    extras = []
    for region, name, note, page in SEPARATE_BOSSES:
        extras.append(dict(region=region, name=name, note=note, page=page))
    for row in bosses:
        video_links(row)

    sources = [(region, page, title, None) for region, entries in SCENE_PAGES.items() for page, title in entries.items()]
    for number, focus in BOSS_PAGES.items():
        names = focus.split('|')
        matching = [x for x in bosses if any(norm(n) in norm(x['name']) for n in names)]
        area = matching[0]['region'] if matching else 'unknown'
        if number == 405:
            area = '06-lake'
        if number == 715:
            area = '09-mountain'
        if number == 373:
            area = '01-valley'
        sources.append((area, number, focus.replace('|', ' · '), True))

    print('Fetching game maps and official stills', flush=True)
    for region, name in REGIONS.items():
        if region == '00-prologue':
            continue
        label = '庞镇地区' if region == '04-town' else name
        page = BWIKI + quote(label)
        try:
            s = read_soup(region.split('-', 1)[1] if region != '04-town' else 'town-region', page)
            for im in s.select('.mw-parser-output img'):
                if '地图' in im.get('alt',''):
                    images.append(resource(region, 'map', name + '手绘底图', '游戏内底图原文件',
                                           page, bwiki_original(im['src']), credit='S-GAME / BWIKI'))
        except requests.RequestException:
            pass
    for area, name, url, page in EXTRA_MAPS:
        images.append(resource(area, 'map', name, '游戏内地图补证', page, url, credit='S-GAME / 来源页'))

    official_js = cached('mediajs', OFFICIAL + '/jsc/media-data.js')
    for path in sorted(set(re.findall(r"\.\./assets/media/screenshots/[^'\"]+", official_js))):
        path = path.removeprefix('..')
        basename = Path(path).stem
        area, kind, title = OFFICIAL_TAGS.get(basename, ('global', 'mood', '官方媒体图 ' + basename))
        images.append(resource(area, kind, title, '官方原尺寸', OFFICIAL + '/en-US/#media', OFFICIAL + path, credit='S-GAME'))

    portrait_list = read_soup('pbz', CDX + '/zh-hans/bosses/')
    portraits = []
    for a in portrait_list.select('main a.br'):
        span = a.select_one('.br-line')
        if not span:
            continue
        region = REGION_IDS.get(span.get_text(' ', strip=True).split(' · ')[-1], 'cross-region')
        portraits.append((urljoin(CDX, a['href']), region, a.h3.get_text(' ', strip=True)))
    groups = [(region, file + (f'_{i}' if i > 1 else ''), keys)
              for region, guides in WALK_GUIDES.items() for file, count, keys in guides for i in range(1, count + 1)]

    for getter, args, jobs in (
        (character_detail, bosses, 6), (pbz_detail, portraits, 6),
        (guide_scene, sources, 9), (guide_gamersky, groups, 5), (powerpyx_stills, [None], 1)
    ):
        print('Gathering', getter.__name__, len(args), flush=True)
        for result in parallel(getter, args, jobs):
            images.extend(result)

    images = list({(x['url'], x['region'], x['kind'], x['subject']): x for x in images}.values())
    # Download shared source URLs once for each section, retaining all catalog associations.
    requests_by_file = {(x['url'], x['region'], x['kind']): x for x in images}
    print('Downloading', len(requests_by_file), 'image files', flush=True)
    resolved = {(x['url'], x['region'], x['kind']): x for x in parallel(load_image, requests_by_file.values(), 14)}
    results = []
    for row in images:
        matched = resolved.get((row['url'], row['region'], row['kind']))
        if matched:
            row.update({k: matched[k] for k in ('file', 'sha256', 'size')})
        results.append(row)
    for characters in (bosses, enemies):
        for row in characters:
            row.pop('images')
    output = {'regions':REGIONS,'bosses':bosses,'extras':extras,'enemies':enemies,'images':results}
    (ROOT/'research'/'catalog.json').write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n')
    print(Counter(x['kind'] for x in results if x.get('file')), flush=True)


def powerpyx_stills(_):
    url = 'https://www.powerpyx.com/phantom-blade-zero-mount-soulrend-collectible-locations/'
    page = read_soup('powerpyx', url)
    out = []
    for im in page.select('img[src*="mount-soulrend"]'):
        parent = im.find_parent('a')
        if not parent or not parent.get('href','').endswith('.jpg'):
            continue
        if len(out) == 20:
            break
        out.append(resource('09-mountain', 'scene', f'断魂山路线截图 {len(out)+1:02d}', '实机截图',
                            url, parent['href'], credit='S-GAME / PowerPyx 实机图文'))
    return out


OFFICIAL_TAGS = {
    'char_Leidang': ('08-estate', 'boss-frame', '雷当 官方造型'),
    'monster_Sawman': ('09-mountain', 'boss-frame', '锯者 官方造型'),
    'monster_vanquish1': ('global', 'mood', '龙体改造 细节一'),
    'monster_vanquish2': ('global', 'mood', '龙体改造 细节二'),
    'scene_Paifang': ('global', 'mood', '牌坊比例与飞檐'),
    'scene_dragonpole': ('global', 'mood', '龙柱与地面连接'),
    'scene_ruin': ('global', 'mood', '废墟与折线地形'),
    'scene_temple': ('global', 'mood', '庙内层次'),
    'scene_templeoutside': ('global', 'mood', '庙外空间层次'),
    '6': ('global', 'mood', '湖上码头 灰雾与近远尺度'),
}
EXTRA_MAPS = []

if __name__ == '__main__':
    main()
