"""Rendu des cartes Tiled d'intérieurs HGSS (pack de SirMaIo) en PNG, à l'échelle du jeu (cases de 16 px) :
les références d'agencement de ../*.png. Usage : python3 render_tmx.py"""
import sys, os, re, xml.etree.ElementTree as ET
from PIL import Image
HERE=os.path.dirname(os.path.abspath(__file__))
SKIP=re.compile(r'passage|systemtag|terrain|prio', re.I)
def load_tsx(path):
    t=ET.parse(path).getroot(); img=t.find('image')
    src=os.path.basename(img.get('source'))
    p=os.path.join(HERE,'..','..','..','tilesets','interieurs','hgss-sirmaio',src)
    im=None
    if os.path.exists(p):
        import numpy as np
        a=np.array(Image.open(p).convert('RGBA'))
        for key in ((240,91,161),(255,245,104)):
            a[(a[...,0]==key[0])&(a[...,1]==key[1])&(a[...,2]==key[2])]=0
        im=Image.fromarray(a)
    return {'tw':int(t.get('tilewidth')),'th':int(t.get('tileheight')),'cols':int(t.get('columns') or 0),'img':im,'name':src}
def render(tmx,out):
    m=ET.parse(tmx).getroot(); T=int(m.get('tilewidth'))
    # Carte infinie : des morceaux (chunks) placés à leurs coordonnées ; on ramène tout à une grille finie.
    def cells(layer):
        d=layer.find('data'); out={}
        chunks=d.findall('chunk')
        if chunks:
            for c in chunks:
                cx,cy,cw=int(c.get('x')),int(c.get('y')),int(c.get('width'))
                for i,v in enumerate(int(v) for v in (c.text or '').replace('\n','').split(',') if v.strip()):
                    if v: out[(cx+i%cw, cy+i//cw)]=v
        else:
            w=int(layer.get('width'))
            for i,v in enumerate(int(v) for v in (d.text or '').replace('\n','').split(',') if v.strip()):
                if v: out[(i%w, i//w)]=v
        return out
    layers=[(l, cells(l)) for l in m.iter('layer') if l.get('visible')!='0' and not SKIP.search(l.get('name',''))]
    pts=[p for _,c in layers for p in c]
    if not pts: return set()
    x0=min(p[0] for p in pts); y0=min(p[1] for p in pts)
    W=max(p[0] for p in pts)-x0+1; H=max(p[1] for p in pts)-y0+1
    sets=[]
    for ts in m.findall('tileset'):
        src=os.path.join(HERE,'Tilesets',os.path.basename(ts.get('source')))
        if SKIP.search(src) or not os.path.exists(src): sets.append((int(ts.get('firstgid')),None)); continue
        sets.append((int(ts.get('firstgid')),load_tsx(src)))
    sets.sort(key=lambda s:s[0])
    canvas=Image.new('RGBA',(W*T,H*T),(0,0,0,255)); missing=set()
    for layer,c in layers:
        for (cx,cy),g in c.items():
            i=(cy-y0)*W+(cx-x0)
            gid=g & 0x1FFFFFFF
            if not gid: continue
            fg,ts=max((s for s in sets if s[0]<=gid), key=lambda s:s[0])
            if not ts or not ts['img']: missing.add(ts['name'] if ts else '?'); continue
            k=gid-fg; c=ts['cols'] or ts['img'].width//ts['tw']
            tile=ts['img'].crop(((k%c)*ts['tw'],(k//c)*ts['th'],(k%c+1)*ts['tw'],(k//c+1)*ts['th']))
            canvas.alpha_composite(tile,((i%W)*T,(i//W)*T))
    canvas=canvas.resize((W*T//2,H*T//2),Image.NEAREST).convert('RGB')
    bb=canvas.getbbox()
    if bb: canvas.crop(bb).save(out)
    return missing
OUT=os.path.join(HERE,'..')
for f in sorted(os.listdir(os.path.join(HERE,'Maps'))):
    try:
        miss=render(os.path.join(HERE,'Maps',f),os.path.join(OUT,f.replace(' .tmx','.tmx').replace('.tmx','.png')))
        if miss: print(f,'missing',miss)
    except Exception as e: print(f,'ERR',e)
