"""Build a portable local contact sheet and an offline search page."""

from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import json
import shutil
import subprocess

from PIL import Image, ImageDraw, ImageFont

from collect import ROOT, WORK, norm


ALIASES = {
    '梦华圣母': ('救苦救难梦华圣母娘娘',),
    '舞狮尊主': ('被面具控制的舞狮尊主：烈焰', '舞狮尊主的最后一舞'),
    '金面具': ('金面具黑衣人', '暗魔天堡之主：魔渊'),
    '雷当': ('虎炮：雷当', '雷当：独臂虎'),
    '呜呜呜': ('幽怨女娃：呜呜呜',),
    '力者和锯者': ('力者和锯者', '力者：石破天惊之态'),
}
MAP_ORDER = ('01-valley','02-forest','03-village','04-town','05-camp','06-lake','07-prison','08-estate','09-mountain')


def share_name(candidate, display):
    if norm(candidate) == norm(display):
        return True
    if len(norm(candidate)) >= 2 and norm(candidate) in norm(display):
        return True
    return False


def avatar(row):
    return row['kind'] == 'boss'


def tags_gameplay(row):
    return row['kind'] == 'boss-frame' and '实机' in row['view']


def add_associations(data):
    people = defaultdict(list)
    for row in data['bosses'] + data['extras']:
        people[row['region']].append(row['name'])
    for im in data['images']:
        r = im['region']
        s = im['subject']
        if im['kind'] not in ('boss','boss-frame') and not (im['kind']=='enemy' and s == '呜呜呜'):
            continue
        possibilities = people[r]
        labels = [s]
        if not avatar(im):
            # Article stills can document the common encounter and silhouette, with phase
            # roll-up displayed separately in the coverage report.
            labels.extend(im.get('boss_names',[]))
        resolved = set()
        for label in labels:
            resolved.update(ALIASES.get(label, ()))
            same = [name for name in possibilities if norm(name) == norm(label)]
            if same:
                resolved.update(same)
                continue
            shared = [name for name in possibilities if share_name(label, name)]
            if shared:
                resolved.update(shared)
                continue
            if im['kind'] == 'boss':
                reverse = [name for name in possibilities if share_name(name,label)]
                if len(reverse)==1:
                    resolved.update(reverse)
        im['related'] = [name for name in possibilities if name in resolved]
        if im['kind']=='enemy' and s=='呜呜呜' and '幽怨女娃：呜呜呜' in possibilities:
            im['related'] = ['幽怨女娃：呜呜呜']
    data['images'].sort(key=lambda row:(row['region'], row['kind'], row['subject'], row['view'], row['file']))


def cjk_font(size):
    try:
        path = subprocess.check_output(['fc-match', '-f', '%{file}', 'Noto Sans CJK SC'],text=True)
        return ImageFont.truetype(path.strip(), size)
    except (OSError, subprocess.CalledProcessError):
        return ImageFont.load_default(size=size)


def thumbnail(im):
    full = WORK / im['file']
    dest = WORK / 'thumbs' / (im['sha256'][:18]+'.webp')
    im['thumb'] = dest.relative_to(WORK).as_posix()
    if not dest.exists():
        with Image.open(full) as raw:
            image = raw.convert('RGBA' if raw.mode in ('RGBA','LA','P') else 'RGB')
            image.thumbnail((460,400))
            image.save(dest,quality=81,method=1)


def map_contact(data):
    w,h=480,385
    sheet=Image.new('RGB',(w*3,h*3),'#211e19')
    draw=ImageDraw.Draw(sheet)
    title=cjk_font(30)
    small=cjk_font(17)
    for i,r in enumerate(MAP_ORDER):
        x,y=(i%3)*w,(i//3)*h
        matches=[row for row in data['images'] if row['region']==r and row['kind']=='map' and ('底图' in row['view'] or '瓦片' in row['view'])]
        draw.text((x+21,y+16),data['regions'][r],font=title,fill='#eee1c4')
        if not matches:
            draw.text((x+21,y+90),'尚无原始底图',font=small,fill='#bdab91')
            continue
        im=max(matches,key=lambda row:row['size'][0]*row['size'][1])
        with Image.open(WORK/im['file']) as original:
            img=original.convert('RGB')
            img.thumbnail((w-30,h-95))
            sheet.paste(img,(x+(w-img.width)//2,y+62))
        caption = '独立底图瓦片拼回' if '瓦片' in im['view'] else '游戏内底图原文件'
        if r == '08-estate':
            caption = '与庞镇共享游戏底图，此区另有点位截图'
        draw.text((x+21,y+h-22),caption,font=small,fill='#c1a889')
    sheet.save(WORK/'maps-contact.jpg',quality=91)


def write_coverage(data):
    images=data['images']
    regions=data['regions']
    lines=['# 参考图覆盖与缺口','',
           '统计以本地可打开且经解码的文件为准。不同图鉴裁幅可能来自同一视图。实机构图包括同一场遭遇的动作、距离和场地变化，有来源标注的正侧背设定单独写明。','',
           '| 地区 | 图鉴头目条目 | 有头目图 | 有实机或设定的头目条目¹ | 小怪文件 | 场景 | 地图 |',
           '| --- | ---: | ---: | ---: | ---: | ---: | ---: |']
    for region,name in regions.items():
        people=[x for x in data['bosses'] if x['region']==region]
        imgs=[x for x in images if x['region']==region]
        good=set(n for row in imgs if row['kind'] in ('boss','boss-frame') for n in row.get('related',[]))
        additional=set(n for row in imgs if row['kind']=='boss-frame' for n in row.get('related',[]))
        counts=Counter(x['kind'] for x in imgs)
        line=(name,len(people),sum(x['name'] in good for x in people),sum(x['name'] in additional for x in people),
              counts['enemy'],counts['scene'],counts['map'])
        lines.append('| ' + ' | '.join(map(str,line)) + ' |')
    lines.extend([
        '', '¹ 以遭遇为单位的实机有时同时涵盖多个阶段。表中覆盖表示有画面可查，阶段专属画面仍需逐帧核对。', '',
        '## 多角度覆盖', '',
        '剪纸折件可以用角色的不同实机构图推敲整体轮廓。目前带明确正、侧、背三向设定的首领参考可在「全局美术」和「金面具黑衣人」中找到。其余参考图的同侧裁幅、视角移动、动作变化和独立正侧背设定分别看待。', '',
    ])
    for region,name in regions.items():
        imgs=[x for x in images if x['region']==region]
        names=[]
        for row in [x for x in data['bosses'] if x['region']==region]:
            matching=[p for p in imgs if row['name'] in p.get('related',[])]
            if not any(p['kind']=='boss-frame' for p in matching):
                names.append(row['name'])
        if names:
            lines.append('- ' + name + '的附加实机图仍缺：' + '、'.join(names) + '。')
    if lines[-1]:
        lines.append('')
    lines.extend([
        '## 下一轮精补优先级', '',
        '1. 先从每区压轴首领取入口正面、静止或转身侧面、移动后背面三帧。要能看清头身比例、衣摆、手部和道具接点。实机带强特效的帧另作运动参考。',
        '2. 两阶段和双体首领先标明阶段，再分别标注多出来的纸层。优先处理追命六绝凶镰、白赤练献祭姿态、沐小葵与玉妖铁鬼、舞狮最后一舞、雷当独臂、力者与锯者拆分、左殇真龙之躯。',
        '3. 场景补图先查钢铁巨塔基座、三偶井下部、舞狮馆正门和内场、白蛇屋船坞、宗祠外山门、戏楼幕的背面。部件受遮挡时仅记录可证实的结构。',
        '4. 序章为教学和开场，参考其开场实机和马车追逐地形。断魂山在已核对的区域小怪名录中没有单独普通敌人组，画面以冷荼等终局角色、雪路、空营和寺庙为主。',
        '5. 跨区补充单独记录金面具黑衣人的四次龙柱、第五次魔渊、各处人面榕树试炼和回随主线重战。以实际遭遇位置为准。 [五场龙柱位置](https://kungfupunk.com/zh-hans/bosses/mo-yuan) · [全流程分区实机](https://www.bilibili.com/video/BV1UEsZ6kEjc/)',
        '',
    ])
    (ROOT/'research'/'coverage.md').write_text('\n'.join(lines))


def main():
    data=json.loads((ROOT/'research'/'catalog.json').read_text())
    assert len(data['bosses'])==75
    assert all((WORK/im['file']).is_file() for im in data['images'])
    add_associations(data)
    (WORK/'thumbs').mkdir(exist_ok=True)
    unique={im['sha256']: im for im in data['images']}
    with ThreadPoolExecutor(max_workers=7) as pool:
        list(pool.map(thumbnail, unique.values()))
    for im in data['images']:
        im['thumb']=unique[im['sha256']]['thumb']
    (WORK/'data.js').write_text('window.REFERENCE_LIBRARY = ' + json.dumps(data,ensure_ascii=False) + ';\n')
    shutil.copy2(ROOT/'research'/'library.html',WORK/'index.html')
    map_contact(data)
    write_coverage(data)
    print(len(unique),'unique reference image files,',
          sum(row['kind']=='boss-frame' for row in data['images']),'boss gameplay or design records')


if __name__=='__main__':
    main()
