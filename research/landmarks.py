"""Collect close and wide landmark shots from named on-location guides."""

import json
from pathlib import Path
from urllib.parse import quote

from collect import BWIKI, ROOT, bwiki_original, load_image, parallel, read_soup, resource


PAGE = 'https://allthings.how/phantom-blade-zero-'
EXTRAS = [
    ('02-forest','狂犬','https://wikily.gg/phantom-blade-zero/enemies','犬形杂兵，原图补录'),
    ('02-forest','乌鸦','https://wiki.biligame.com/yingzhiren/血色森林','兽形怪，原图补录'),
]


def capture(details):
    url = PAGE+details['slug']+'/'
    soup = read_soup('landmark-'+details['slug'], url)
    rows = []
    for im in soup.select('article figure img'):
        s = im.get('src','')
        alt = im.get('alt','')
        if '/wp-content/uploads/' not in s or not alt:
            continue
        matches = [word for word in details['patterns'] if word in alt.lower()]
        if not matches:
            continue
        is_map = ' map ' in alt.lower() and 'map with the opera house' in alt.lower()
        rows.append(resource(details['region'],'map' if is_map else 'scene',details['subject'],
                             '实机地图点位' if is_map else '地标实机近景／远景',url,s,
                             credit='S-GAME / All Things How 实机图文',image_id=Path(s).stem,
                             keywords=matches))
    return rows[:details['limit']]


def animal(args):
    region, name, fallback, note = args
    url = BWIKI + quote(name)
    s = read_soup('animal-'+name,url)
    entries = []
    for im in s.select('.mw-parser-output img'):
        src = im.get('src','')
        if 'patchwiki.biligame.com/images/yingzhiren/' not in src or int(im.get('data-file-width',im.get('width',0))) < 300:
            continue
        entries.append(resource(region,'enemy',name,'兽形怪图鉴',url,bwiki_original(src),credit='S-GAME / BWIKI'))
    return entries


def main():
    catalog = ROOT/'research'/'catalog.json'
    content = json.loads(catalog.read_text())
    supplements = json.loads((ROOT/'research'/'landmark_sources.json').read_text())
    rows = [i for group in parallel(capture,supplements,8) for i in group]
    rows += [i for group in parallel(animal,EXTRAS,2) for i in group]
    for region, name, url, note in EXTRAS:
        if name not in {x['name'] for x in content['enemies']}:
            content['enemies'].append(dict(name=name,region=region,page=url,type='兽形怪',note=note))
    seen = {(x['region'],x['kind'],x['url']) for x in content['images']}
    outgoing = {(x['region'],x['kind'],x['url']):x for x in rows if (x['region'],x['kind'],x['url']) not in seen}
    print('Landmark candidates',len(outgoing),flush=True)
    content['images'].extend(parallel(load_image,outgoing.values(),12))
    catalog.write_text(json.dumps(content,ensure_ascii=False,indent=2)+'\n')


if __name__ == '__main__':
    main()
