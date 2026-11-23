"""Add named gameplay stills, publisher concept sheets and original map tiles."""

from collections import Counter, defaultdict
from hashlib import sha256
from io import BytesIO
import json
import math
from pathlib import Path
import re
import unicodedata
from urllib.parse import urljoin

from PIL import Image
import requests

from collect import (
    CACHE, ROOT, WORK, resource, parallel, load_image, norm,
    read_soup,
)


ARTICLE_BASE = 'https://allthings.how'
MAP_BASE = 'https://static.allthings.how/game-maps/phantom-blade-zero'
ALL_BOSSES = ARTICLE_BASE + '/phantom-blade-zero-bosses/'
WUXIA_BOSSES = 'https://wuxiapunk.com/zh/story/phantom-blade-zero-bosses/'
MULTI_GALLERY = 'https://phantom-blade-zero.games/zh/media/'
ATLAS = {
    'Prologue':'00-prologue', 'Weeping Creek Valley':'01-valley', 'Crimson Forest':'02-forest',
    'Village of Lu':'03-village', 'Pangzhen':'04-town', 'Mandate Encampment':'05-camp',
    'Meigu Lake':'06-lake', 'Mountain of Imprisonment':'07-prison', 'Mirage Estate':'08-estate',
    'Mount Soulrend':'09-mountain',
}
MAP_KEYS = {
    '04-town': ('pangzhen', '庞镇原画地图', (8192, 4512)),
    '07-prison': ('mountain-of-imprisonment', '枷笼山原画地图', (8192, 8192)),
}
ENGLISH_ALIASES = {
    'Zuo Shang': '少年左殇',
    'Hua, Deadly Betrothed': '新娘阿花',
    'The Hunt, Sixfold Scythe': '追命：六绝凶镰',
    'The Hunt, Hunter of the Order': '组织猎杀者：追命',
    'The Crusher, Earthshattering Form': '力者：石破天惊之态',
    'Zuo Shang, the True Lóng': '左殇：真龙之躯',
    'The Lion Dance Grandmaster’s Final Dance': '舞狮尊主的最后一舞',
}
MANUAL_ART = {
    'concept-gold-mask-sheet': ('01-valley', 'boss-frame', '金面具黑衣人', '官方设定｜正面、侧面、背面、面部'),
    'concept-soul-sheet': ('global', 'mood', '魂的服装和道具设定', '官方设定｜多个全身姿态'),
    'concept-hero-turnaround': ('global', 'mood', '魂的全身比例和衣层', '官方设定｜正面'),
    'concept-boss-lineup': ('global', 'mood', '五位敌对角色并列', '官方设定｜全身轮廓关系'),
    'concept-armored-warrior-sheet': ('global', 'mood', '重甲武将与机械手部件', '官方设定｜转身构造'),
    'concept-creature-lineup': ('global', 'mood', '异化杂兵的衣层、体型和盾纹', '官方设定｜全身阵容'),
    'concept-wulin-lineup': ('global', 'mood', '武林服饰与骑兵剪影', '官方设定｜全身阵容'),
    'concept-red-tree': ('02-forest', 'scene', '红树与红线', '概念图｜远景气氛，非正式版点位'),
    'character-leidang': ('08-estate', 'boss-frame', '雷当', '官方渲染｜虎形结构特写'),
    'boss-sawman': ('09-mountain', 'boss-frame', '力者和锯者', '官方渲染｜双首领同框'),
    'concept-long-pillars': ('global', 'mood', '悬崖龙柱和木桥', '概念图｜烟雾、动线'),
    'concept-cracked-mask': ('global', 'mood', '有裂纹的白瓷面具', '官方设定｜材质细节'),
}


def english(s):
    plain = ''.join(c for c in unicodedata.normalize('NFKD', s.lower()) if not unicodedata.combining(c))
    return re.sub('[^a-z0-9]', '', plain)


def map_reference(arg):
    region, (slug, name, bounds) = arg
    url = f'{ARTICLE_BASE}/phantom-blade-zero/map/{slug}/'
    output = WORK / 'images' / region / 'map' / 'game-background-2048.png'
    z = 3
    division = 2 ** (5-z)
    w, h = (v // division for v in bounds)
    if not output.exists():
        bundle = Image.new('RGB', (w, h), '#161e26')
        tiles = [(x,y) for x in range(math.ceil(w/256)) for y in range(math.ceil(h/256))]
        folder = CACHE.parent / 'map-tiles' / slug
        folder.mkdir(parents=True, exist_ok=True)
        def get_tile(point):
            x, y = point
            file = folder / f'{z}-{x}-{y}.webp'
            if not file.exists():
                response = requests.get(f'{MAP_BASE}/tiles/{slug}/{z}/{x}/{y}.webp', timeout=16)
                response.raise_for_status()
                file.write_bytes(response.content)
            with Image.open(file) as image:
                return (x, y), image.convert('RGB')
        results = parallel(get_tile, tiles, 7)
        if len(results) != len(tiles):
            raise ValueError(f'{slug} missing map tiles {len(results)}/{len(tiles)}')
        for (x,y), tile in results:
            bundle.paste(tile,(x*256,y*256))
        output.parent.mkdir(parents=True, exist_ok=True)
        bundle.save(output)
    return resource(region,'map',name,'游戏原画底层｜公开地图瓦片拼回，无网页标点',url,
                    f'{MAP_BASE}/tiles/{slug}/{z}/0/0.webp',
                    file=output.relative_to(WORK).as_posix(),size=[w,h],
                    sha256=sha256(output.read_bytes()).hexdigest(),credit='S-GAME / All Things How 地图底层')


def article_images(item):
    page, entries = item
    key = 'ath-boss-' + page.strip('/').split('/')[-1]
    s = read_soup(key, page)
    images = [im for im in s.select('article figure img') if
              '/wp-content/uploads/' in im.get('src','') and im.get('alt')]
    if not images:
        return []
    picks = list(dict.fromkeys([0, 1, 2, 3, len(images)//2, int(len(images)*.68), len(images)-2]))
    out = []
    for i in picks:
        if not 0 <= i < len(images):
            continue
        im = images[i]
        caption = im['alt']
        common_area = entries[0][0]
        associated = max(entries,key=lambda entry: len(english(entry[2])) if english(entry[2]) in english(caption) else -1)
        subject = associated[1]
        # Keep multi-phase articles associated with the encounter without guessing exact phases.
        family = [x[1] for x in entries]
        if len(family)>1 and english(associated[2]) not in english(caption):
            subject = entries[0][1]
        label = '实机广角构图' if re.search(r'arena|wide shot|field|bridge|courtyard|pier|cliff|gate',caption,re.I) else '实机动作构图'
        if re.search(r'close.up|close up|close view',caption,re.I):
            label = '实机近景'
        if re.search(r'back view|seen from behind|side view|front view',caption,re.I):
            label += '｜来源描述有方向'
        out.append(resource(common_area, 'boss-frame', subject, label, page, im['src'],
                            credit='S-GAME / All Things How 实机图文', boss_names=family,
                            image_id=Path(im['src']).stem))
    return out


def fill_articles(catalog):
    index = read_soup('allboss', ALL_BOSSES)
    en_to_zh = {english(k): v for k, v in ENGLISH_ALIASES.items()}
    list_soup = read_soup('wuxiaBoss',WUXIA_BOSSES)
    for tr in list_soup.select('main table tr'):
        cells = tr.select('td')
        if len(cells)>=5 and cells[0].get_text(strip=True).isdigit():
            zh, en = [cells[i].get_text(' ',strip=True) for i in (1,2)]
            en_to_zh.setdefault(english(en),zh)
    jobs = defaultdict(list)
    more = []
    for table in index.select('article table'):
        h = table.find_previous(['h2','h3'])
        if not h:
            continue
        r = ATLAS.get(h.get_text(' ',strip=True))
        if not r:
            continue
        for tr in table.select('tr'):
            cells = tr.select('td')
            if len(cells) < 4 or not cells[0].get_text(strip=True).isdigit():
                continue
            english_name = cells[1].get_text(' ',strip=True)
            zh = en_to_zh.get(english(english_name), english_name)
            article = None
            for a in tr.select('a[href]'):
                link = a['href']
                if link.startswith(ARTICLE_BASE + '/phantom-blade-zero-') and 'bosses/' not in link:
                    article = link
            if article:
                entry = (r, zh, english_name)
                if entry not in jobs[article]:
                    jobs[article].append(entry)
            # The list thumbnails remain optional; existing portraits beat these on resolution.
    print('Named boss articles',len(jobs),flush=True)
    for result in parallel(article_images, jobs.items(), 9):
        more.extend(result)
    for item, entries in jobs.items():
        for r, zh, _ in entries:
            match = [b for b in catalog['bosses'] if b['region']==r and norm(b['name']) == norm(zh)]
            for b in match:
                b.setdefault('articles',[]).append(item)
    return more


def fill_gallery():
    s = read_soup('gallery', MULTI_GALLERY)
    images = []
    for item in s.select('[data-media-card]'):
        button = item.select_one('[data-full]')
        if not button:
            continue
        url = button['data-full']
        stem = re.sub(r'-[0-9]+$','',Path(url).stem)
        region,kind,subject,view = MANUAL_ART.get(stem,('global','mood',stem,'媒体图库｜构图与气氛'))
        images.append(resource(region, kind, subject, view, MULTI_GALLERY, url,
                               credit='S-GAME / 媒体图库转引'))
    return images


def main():
    path = ROOT/'research'/'catalog.json'
    data = json.loads(path.read_text())
    # Keep each unavailable 3DM page as an online source, independent of blocked files.
    refs = {}
    viable = []
    for row in data['images']:
        if row.get('file'):
            viable.append(row)
        else:
            refs.setdefault((row['region'],row['kind'],row['subject'],row['page']),{
                k:row[k] for k in ('region','kind','subject','page')
            })
    data['online_sources'] = list(refs.values())
    data['images'] = viable
    rows = fill_articles(data) + fill_gallery()
    screenshot_maps = [
        ('07-prison','枷笼山菜单原始截图','https://gamehq.gg/phantom-blade-zero/media/maps/mountain-of-imprisonment.webp','https://gamehq.gg/phantom-blade-zero/map'),
        ('04-town','庞镇菜单原始截图','https://gamehq.gg/phantom-blade-zero/media/maps/pangzhen.webp','https://gamehq.gg/phantom-blade-zero/map'),
    ]
    rows += [resource(r,'map',label,'游戏菜单截图，保留原界面',page,url,credit='S-GAME State of Play / GameHQ')
             for r,label,url,page in screenshot_maps]
    print('Additional images to download',len(rows),flush=True)
    unique = {(x['region'],x['url'],x['kind']):x for x in rows}
    for row in parallel(load_image,unique.values(),14):
        if row not in data['images']:
            data['images'].append(row)
    for r in parallel(map_reference, MAP_KEYS.items(), 2):
        if r not in data['images']:
            data['images'].append(r)
    data['images'] = list({(x['region'],x['kind'],x['file']):x for x in data['images']}.values())
    print(Counter(row['kind'] for row in data['images']),flush=True)
    path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')


if __name__=='__main__':
    main()
