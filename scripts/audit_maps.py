#!/usr/bin/env python3
"""Vérifie les cartes du jeu dessinées avec le créateur (map.built) : calques et collisions cohérents avec le dessin.

  mur_invisible       case bloquée où rien n'est dessiné (hors eau et bâtiments) : un objet retiré du dessin ;
  objet_traversable   case libre sous un objet plein du calque Décor (hors fleurs, portes, pontons, ponts) ;
  cache_dessus        case libre où le calque « au-dessus de Pierre » le cache (toits, cimes) : normal derrière une
                      maison, le jeu montre alors sa silhouette (MapScene.updateSilhouette) ;
  trou_sol            case sans sol ;
  herbe_sans_dessin   hautes herbes / blé de la grille sans dessin d'herbes (corriger la grille, sourceGrid) ;
  herbes_hors_grille  hautes herbes dessinées sur une case '.' (le jeu n'y cache pas les jambes) : à corriger ;
  fleurs_et_bords     case '.' texturée mais pas en hautes herbes (fleurs, bords de chemin, coquillages, touffes d'herbe
                      rase) : indicatif, normal. Les hautes herbes se reconnaissent à leurs contours : presque toutes
                      vertes, et au moins 8 % de pixels sombres (14 % au minimum sur les vraies cases 'ĥ'), 0 % pour
                      une touffe d'herbe rase ;
  poche               cases libres qu'on ne peut pas atteindre (ni départ, ni PNJ, ni bord, ni porte).

Usage : python3 scripts/audit_maps.py   (après avoir touché une carte du créateur, avec node scripts/check_paths.js)
"""
import json, subprocess, sys
from collections import Counter, deque
from PIL import Image
from pathlib import Path
R=str(Path(__file__).resolve().parent.parent)+'/'; V2=R+'public/assets/v2/'
cat={s['id']:s for s in json.load(open(V2+'catalog.json'))['sheets']}
imgs={}
def tile(sheet,k):
    if sheet not in imgs: imgs[sheet]=Image.open(V2+cat[sheet]['file']).convert('RGBA')
    c=cat[sheet]['cols']; return imgs[sheet].crop(((k%c)*16,(k//c)*16,(k%c)*16+16,(k//c)*16+16))
def layer_img(m,L,i):
    cell=m['layers'][L][i]; out=Image.new('RGBA',(16,16))
    for r in (cell if isinstance(cell,list) else [cell]):
        if r!=-1: out.alpha_composite(tile(m['sheets'][r//100000], r%100000))
    return out
def full(img):  # part de pixels entièrement opaques
    a=img.getchannel('A').getdata(); return sum(1 for v in a if v==255)/256
def greenish(img):  # part de pixels verts (herbe, feuillage) : les hautes herbes sont presque toutes vertes
    px=[p for p in img.getdata() if p[3]]
    return sum(1 for r,g,b,a in px if g>r+20 and g>b)/max(1,len(px))
def dark(img):  # part de pixels sombres (contours des brins)
    px=[p for p in img.getdata() if p[3]]
    return sum(1 for r,g,b,a in px if r*0.3+g*0.59+b*0.11<110)/max(1,len(px))
def share(img):
    px=list(img.convert('RGB').getdata())[6*16:]; return Counter(px).most_common(1)[0][1]/len(px)
WATER=set('w~GBø=I')
data=json.loads(subprocess.check_output(['node', R+'scripts/export_audit.mjs'], cwd=R))
report={}
for mid,g in data.items():
    m=json.load(open(R+f"src/data/builtMaps/{g['file']}.json")); W,H=m['width'],m['height']
    src=g['source']; grid=g['grid']; solid=m['solid']
    res={k:[] for k in ['mur_invisible','objet_traversable','cache_dessus','trou_sol','herbe_sans_dessin','herbes_hors_grille','fleurs_et_bords','poche']}
    for y in range(H):
        for x in range(W):
            i=y*W+x; c=src[y][x]
            sol=layer_img(m,'sol',i); dec=layer_img(m,'decor',i); top=layer_img(m,'dessus',i)
            if full(sol)<0.95: res['trou_sol'].append((x,y))
            if solid[i] and full(dec)<0.15 and full(top)<0.15 and c not in WATER and c not in 'RWD':
                # bloquée sans rien : sauf l'eau dessinée au sol
                if share(sol)>0.5 or True: res['mur_invisible'].append((x,y,c))
            if not solid[i] and full(dec)>=0.5 and c not in '=IfƒDɱ':
                res['objet_traversable'].append((x,y,c))
            if not solid[i] and full(top)>=0.6:
                res['cache_dessus'].append((x,y,c))
            comp=sol.copy(); comp.alpha_composite(dec)
            plant=share(comp)<0.5
            if c in 'ĥʬ' and not plant: res['herbe_sans_dessin'].append((x,y))
            # herbes dessinées hors grille : seulement les cases d'herbe libres au sol texturé sans objet
            if c=='.' and not solid[i] and plant and full(dec)<0.05:
                res['herbes_hors_grille' if greenish(comp)>=0.9 and dark(comp)>=0.08 else 'fleurs_et_bords'].append((x,y))
    # poches : composantes libres sans point d'intérêt ni départ ni bord de carte
    seen=set(); interest={(p['x'],p['y']) for p in g['pts']}; sp=g['spawn']
    for y in range(H):
        for x in range(W):
            if solid[y*W+x] or (x,y) in seen: continue
            q=deque([(x,y)]); seen.add((x,y)); comp=[]
            while q:
                cx,cy=q.popleft(); comp.append((cx,cy))
                for nx,ny in ((cx+1,cy),(cx-1,cy),(cx,cy+1),(cx,cy-1)):
                    if 0<=nx<W and 0<=ny<H and not solid[ny*W+nx] and (nx,ny) not in seen: seen.add((nx,ny)); q.append((nx,ny))
            touches = any((cx,cy) in interest or (cx,cy)==(sp['x'],sp['y']) or cx in (0,W-1) or cy in (0,H-1) for cx,cy in comp)
            # une porte est à côté de la poche ? (case porte bloquée par une scène) : on garde
            if not touches: res['poche'].append(comp if len(comp)<=6 else comp[:6]+[f'… {len(comp)} cases'])
    report[mid]=res
    print(f"== {mid} ({g['file']})")
    for k,v in res.items():
        if v: print(f"  {k}: {len(v)}  {v[:14]}")
