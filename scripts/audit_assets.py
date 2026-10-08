#!/usr/bin/env python3
"""Check-up visuel : mesure les assets posés sur les cartes et dans les intérieurs, de Fort-de-France à Hull, et repère
ceux qui s'écartent nettement de leur famille (contour, ombre, style, échelle, couleurs).

Un « asset » :
- un élément posé en mode simple (studio.elements de la carte, catalogue.json) : exactement ses cases ;
- sinon, un objet des calques Décor et « au-dessus de Pierre » : un morceau de dessin d'un seul tenant (pixels pleins qui
  se touchent, d'une case à l'autre, comme l'outil Déplacer). Ne sont pas mesurés : les bordures d'arbres (planche
  lisieres, toutes pareilles) et, dans les intérieurs, les murs (cases pleines de la bande du haut, sans transparence).

Familles (règle simple) :
- intérieurs et mobilier : tout ce qui est dans un intérieur ;
- sinon, d'après la planche de la majorité des pixels de l'asset : catalogue -> catégorie de l'élément (maisons :
  bâtiments ; arbres, plantes : végétation ; mobilier, eau : mobilier urbain) ; g4-batiments : bâtiments ; g4-arbres,
  g4-herbes, g4-plantes, g4-rochers : végétation ; g4-mobilier, g4-clotures, g4-ponts, g4-vehicules, objets,
  jared-bateaux : mobilier urbain ; dppt : objets (rangées >= 125) -> mobilier urbain (rochers et buissons :
  végétation), le reste -> sols et décor au sol ; autotiles-g4, transitions, g4-sols, g4-eau : sols et décor au sol ;
  auto (cases assemblées) : végétation si surtout vert, bâtiment si au moins 3 x 3 cases, mobilier urbain sinon ; un
  grand objet (3 x 3 cases et plus) surtout en cases dppt ou auto et pas vert : bâtiment (maisons DPPt, assemblées) ;
  une case du catalogue hors de tout élément (matière : ponton, pavés…) : sols et décor au sol.

Mesures (sur les pixels pleins de l'asset, alpha >= 128) :
- contour : part des pixels du bord (un voisin hors de l'asset) qui sont foncés (luminance < 70) ; épaisseur : part des
  pixels juste derrière un bord foncé qui sont foncés aussi (proche de 1 : trait de 2 px ou plus) ;
- ombre : pixels noirs semi-transparents (opacité < 100 %, somme RVB < 40, comme remove_shadows.py) ;
- bords flous : pixels semi-transparents non noirs (anticrénelage, signe d'un dessin hors pixel art DS) ;
- couleurs : nombre de couleurs différentes par case occupée ; saturation et luminosité moyennes ;
- taille : hauteur en pixels (comparée à la famille, seulement hors bâtiments : leurs hauteurs varient par nature).

Écarts (par famille, par rapport à la médiane des assets d'au moins 48 pixels ; seuils choisis pour peu de faux
positifs) :
- « pas de contour » : bord foncé < 25 % quand la famille en a > 55 % (et l'asset fait au moins 96 pixels) ;
- « contour épais » : derrière le bord foncé, > 70 % foncé quand la famille est sous 45 % (seulement si l'asset a un
  contour, et pas pour les objets sombres : moins de 30 % de pixels foncés) ;
- « ombre portée » : au moins 12 pixels d'ombre semi-transparente ;
- « bords flous » : au moins 15 % du bord en pixels semi-transparents non noirs ;
- « beaucoup plus de couleurs » : plus de 2,5 fois la médiane de la famille et plus de 60 couleurs par case ;
- « plus saturé / plus terne / plus clair / plus sombre que le reste » : écart à la médiane de plus de 0,32 (saturation,
  hors intérieurs) ou 0,35 (luminosité, sur 0-1), pour les assets d'au moins 400 pixels (600 dans les intérieurs) ;
- « échelle » : hauteur plus de 2,6 fois ou moins de 0,3 fois la médiane (hors bâtiments, intérieurs et grands
  ensembles fusionnés de plus de 8 cases de large : quai, berge).
Ne sont pas mesurés : le vide noir des pièces (cases pleines presque noires), les miettes de moins de 24 pixels.

Sorties : src/builder/ecarts.json ({ <carte ou intérieur ou modèle> : [écarts] }, lu par le panneau « Écarts » du
créateur, src/builder/ecarts.js) ; dans --sortie (par défaut le scratchpad du check-up) : une planche-contact PNG par
famille (écarts encadrés en rouge, raison en légende) et resume.json (médianes par famille, compteurs).

Usage : python3 scripts/audit_assets.py [--carte <id>] [--sortie <dossier>]
"""
import json
import subprocess
import sys
from collections import Counter, defaultdict
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
V2 = ROOT / 'public' / 'assets' / 'v2'
MAPS = ROOT / 'src' / 'data' / 'builtMaps'
ROOMS = ROOT / 'src' / 'data' / 'builtInteriors'
OUT_JSON = ROOT / 'src' / 'builder' / 'ecarts.json'
DEFAULT_OUT = Path('/private/tmp/claude-501/-Users-pierrestang/d048d482-5e38-4ec3-b4fc-7aa100ad1924/scratchpad/checkup')
STRIDE = 100000
T = 16

# Cartes du périmètre (de Fort-de-France à Hull) et villes des intérieurs.
SCOPE_MAPS = ['fort-de-france', 'saint-ay', 'route-de-montepilloy', 'montepilloy', 'bonsecours', 'prytanee', 'bordeaux', 'hull']
SCOPE_CITIES = ['Fort-de-France', 'Saint-Ay', 'Montépilloy', 'Bonsecours', 'Prytanée', 'Bordeaux', 'Hull']

FAMILIES = ['bâtiments et toits', 'végétation', 'mobilier urbain', 'sols et décor au sol', 'intérieurs et mobilier']
G4_FAMILY = {
    'g4-batiments': 'bâtiments et toits', 'g4-arbres': 'végétation', 'g4-herbes': 'végétation', 'g4-plantes': 'végétation',
    'g4-rochers': 'végétation', 'g4-mobilier': 'mobilier urbain', 'g4-clotures': 'mobilier urbain',
    'g4-ponts': 'mobilier urbain', 'g4-vehicules': 'mobilier urbain', 'objets': 'mobilier urbain',
    'jared-bateaux': 'mobilier urbain', 'autotiles-g4': 'sols et décor au sol', 'transitions': 'sols et décor au sol',
    'g4-sols': 'sols et décor au sol', 'g4-eau': 'sols et décor au sol',
}
CAT_FAMILY = {'maisons': 'bâtiments et toits', 'arbres': 'végétation', 'plantes': 'végétation',
              'mobilier': 'mobilier urbain', 'eau': 'mobilier urbain'}
DPPT_NATURE = {(7, 145), (7, 146), (7, 106), (7, 107)}
SKIP_SHEETS = {'lisieres'}

CATALOG = {s['id']: s for s in json.loads((V2 / 'catalog.json').read_text())['sheets']}
_IMGS = {}


def sheet(sid):
    if sid not in _IMGS:
        _IMGS[sid] = np.array(Image.open(V2 / CATALOG[sid]['file']).convert('RGBA'))
    return _IMGS[sid]


def tile(sid, k):
    a = sheet(sid)
    c = CATALOG[sid]['cols']
    out = a[(k // c) * T:(k // c + 1) * T, (k % c) * T:(k % c + 1) * T]
    if out.shape[:2] != (T, T):                     # case hors de la planche : vide
        return np.zeros((T, T, 4), np.uint8)
    return out


def stack(v):
    return [] if v in (-1, None) else (v if isinstance(v, list) else [v])


# ---------- Catalogue du mode simple : case -> catégorie, élément -> définition ----------
CAT_EXT = json.loads((V2 / 'catalogue.json').read_text())
CAT_TILE_CAT = {}
CAT_DEFS = {}
for tid, t in CAT_EXT['themes'].items():
    for e in t['elements']:
        CAT_DEFS.setdefault(e['id'], e)
        CAT_DEFS[(tid, e['id'])] = e
        for row in e['tiles']:
            for k in row:
                if k >= 0:
                    CAT_TILE_CAT.setdefault(k, e['cat'])


def greenish(a):
    vis = a[..., 3] >= 128
    if not vis.any():
        return False
    r, g, b = (a[..., i][vis].astype(int) for i in range(3))
    return ((g > r + 15) & (g > b)).mean() >= 0.5


def family_of_tile(sid, k):
    """Famille d'une case de carte extérieure (None : à décider sur l'asset entier, cases assemblées)."""
    if sid in G4_FAMILY:
        return G4_FAMILY[sid]
    if sid == 'catalogue':
        # Une case du catalogue qui n'est dans aucun élément : une matière du mode simple (ponton, pavés, fleurs…).
        return CAT_FAMILY.get(CAT_TILE_CAT[k], 'mobilier urbain') if k in CAT_TILE_CAT else 'sols et décor au sol'
    if sid == 'dppt':
        c, r = k % 8, k // 8
        if r >= 125:
            return 'végétation' if (c, r) in DPPT_NATURE else 'mobilier urbain'
        return 'sols et décor au sol'
    if sid == 'auto':
        return None
    return 'mobilier urbain'


# ---------- Découpe en assets ----------
def composite(m, layers=('decor', 'dessus'), skip=lambda sid, k, x, y: False):
    """Image RGBA des calques (et, par pixel, l'origine : index de planche-case) ; les cases écartées par skip ne sont
    pas dessinées."""
    W, H = m['width'], m['height']
    img = np.zeros((H * T, W * T, 4), np.uint8)
    origin = np.full((H * T, W * T), -1, np.int64)
    for L in layers:
        for i, v in enumerate(m['layers'][L]):
            x, y = i % W, i // W
            for r in stack(v):
                if r < 0:
                    continue
                sid, k = m['sheets'][r // STRIDE], r % STRIDE
                if sid not in CATALOG or skip(sid, k, x, y):
                    continue
                t = tile(sid, k)
                a = t[..., 3:4].astype(np.float32) / 255
                sl = (slice(y * T, (y + 1) * T), slice(x * T, (x + 1) * T))
                img[sl][..., :3] = (t[..., :3] * a + img[sl][..., :3] * (1 - a)).astype(np.uint8)
                img[sl][..., 3] = np.maximum(img[sl][..., 3], t[..., 3])
                origin[sl][t[..., 3] >= 128] = r
    return img, origin


def studio_assets(m):
    """Éléments du mode simple : [{ id, x, y, w, h, refs: { case: [(calque, réf)] } }]."""
    out = []
    W, H = m['width'], m['height']
    slot = m['sheets'].index('catalogue') if 'catalogue' in m['sheets'] else -1
    if slot < 0:
        return out
    for el in (m.get('studio') or {}).get('elements', []):
        d = CAT_DEFS.get((el.get('theme'), el['id'])) or CAT_DEFS.get(el['id'])
        if not d:
            continue
        refs = {}
        for j, row in enumerate(d['tiles']):
            for i, k in enumerate(row):
                x, y = el['x'] + i, el['y'] + j
                if k < 0 or not (0 <= x < W and 0 <= y < H):
                    continue
                L = 'decor' if j >= d.get('over', 0) else 'dessus'
                ref = slot * STRIDE + k
                if ref in stack(m['layers'][L][y * W + x]):
                    refs.setdefault(y * W + x, []).append((L, ref))
        if refs:
            out.append({'id': el['id'], 'x': el['x'], 'y': el['y'], 'w': d['w'], 'h': d['h'], 'refs': refs,
                        'family': CAT_FAMILY.get(d['cat'], 'mobilier urbain'), 'name': d.get('name', el['id'])})
    return out


def dominant_sheet(m, org):
    cnt = Counter(m['sheets'][r // STRIDE] for r in org.tolist() if r >= 0)
    return cnt.most_common(1)[0][0] if cnt else None


def pixel_assets(m, img, origin, interior):
    """Morceaux de dessin d'un seul tenant (8-connexité) : [{ mask (bool, plein format), refs, family }]."""
    W = m['width']
    lab, n = ndimage.label(img[..., 3] >= 128, structure=np.ones((3, 3)))
    out = []
    for idx, sl in enumerate(ndimage.find_objects(lab), 1):
        if sl is None:
            continue
        sub = lab[sl] == idx
        if sub.sum() < 24:                          # miettes (brins, coins de bordure)
            continue
        refs = {}
        org = origin[sl][sub]
        ys, xs = np.nonzero(sub)
        ys = ys + sl[0].start
        xs = xs + sl[1].start
        cells = (ys // T) * W + (xs // T)
        fam_px = Counter()
        for c, r in set(zip(cells.tolist(), org.tolist())):
            if r < 0:
                continue
            L = next((L for L in ('dessus', 'decor') if r in stack(m['layers'][L][c])), 'decor')
            refs.setdefault(c, []).append((L, r))
        for r, cnt in Counter(org.tolist()).items():
            if r < 0:
                continue
            sid, k = m['sheets'][r // STRIDE], r % STRIDE
            fam_px[family_of_tile(sid, k) if not interior else 'intérieurs et mobilier'] += cnt
        hcells = (sl[0].stop - sl[0].start) / T
        wcells = (sl[1].stop - sl[1].start) / T
        if interior:
            fam = 'intérieurs et mobilier'
        elif (hcells >= 3 and wcells >= 3 and sub.sum() >= 1500 and dominant_sheet(m, org) in ('dppt', 'auto')
              and not greenish(img[sl] * sub[..., None])):
            fam = 'bâtiments et toits'          # maison DPPt ou assemblée (pas un bateau, rangé par sa planche)
        else:
            fam = None
            known = Counter({f: c for f, c in fam_px.items() if f})
            if known:
                fam = known.most_common(1)[0][0]
            if fam is None or fam_px.get(None, 0) > sum(known.values()):
                crop = img[sl] * sub[..., None]
                hcells = (sl[0].stop - sl[0].start) / T
                wcells = (sl[1].stop - sl[1].start) / T
                fam = 'végétation' if greenish(crop) else 'bâtiments et toits' if hcells >= 3 and wcells >= 3 else 'mobilier urbain'
        out.append({'sl': sl, 'mask': sub, 'refs': refs, 'family': fam})
    return out


# ---------- Mesures ----------
def lum(rgb):
    return rgb[..., 0] * 0.299 + rgb[..., 1] * 0.587 + rgb[..., 2] * 0.114


def measure(crop, mask):
    """crop : RGBA de la boîte de l'asset ; mask : ses pixels pleins."""
    a = crop
    alpha = a[..., 3]
    rgb = a[..., :3].astype(np.float32)
    L = lum(rgb)
    area = int(mask.sum())
    pad = np.pad(mask, 1)
    inner = ndimage.binary_erosion(pad, structure=np.array([[0, 1, 0], [1, 1, 1], [0, 1, 0]]))[1:-1, 1:-1]
    border = mask & ~inner
    dark = (L < 70) & mask
    nb = int(border.sum())
    outline = float((dark & border).sum() / nb) if nb else 0.0
    # Derrière un bord foncé : la rangée de pixels suivante (vers l'intérieur).
    behind = ndimage.binary_dilation(dark & border, structure=np.ones((3, 3))) & inner
    thick = float((dark & behind).sum() / behind.sum()) if behind.sum() >= 8 else 0.0
    shadow = int(((alpha > 0) & (alpha < 255) & (rgb.sum(-1) < 40)).sum())
    ring = ndimage.binary_dilation(mask, structure=np.ones((3, 3))) & ~mask
    soft = int(((alpha > 0) & (alpha < 255) & (rgb.sum(-1) >= 40) & ring).sum() + ((alpha > 0) & (alpha < 255) & (rgb.sum(-1) >= 40) & border).sum())
    vis = rgb[mask]
    mx = vis.max(-1)
    mn = vis.min(-1)
    sat = float(np.where(mx > 0, (mx - mn) / np.maximum(mx, 1), 0).mean()) if area else 0.0
    val = float((mx / 255).mean()) if area else 0.0
    ncol = len({tuple(p) for p in a[mask][..., :3].tolist()}) if area else 0
    ys, xs = np.nonzero(mask)
    height = int(ys.max() - ys.min() + 1) if area else 0
    cells = max(1, area / (T * T))
    darkness = float(dark.sum() / area) if area else 0.0
    return {'area': area, 'outline': round(outline, 3), 'thick': round(thick, 3), 'dark': round(darkness, 3), 'shadow': shadow,
            'soft': round(soft / max(nb, 1), 3), 'sat': round(sat, 3), 'val': round(val, 3),
            'colors': round(ncol / cells, 1), 'height': height}


# ---------- Écarts ----------
def medians(items):
    big = [it for it in items if it['m']['area'] >= 48]
    if not big:
        return None
    med = {k: float(np.median([it['m'][k] for it in big])) for k in ('outline', 'thick', 'sat', 'val', 'colors', 'height')}
    med['n'] = len(big)
    return med


def reasons(it, med):
    m = it['m']
    out = []
    if med is None:
        return out
    if m['area'] >= 96 and med['outline'] > 0.55 and m['outline'] < 0.25:
        out.append(f"pas de contour (bord foncé {m['outline']:.0%}, la famille {med['outline']:.0%})")
    if med['thick'] < 0.45 and m['thick'] > 0.70 and m['area'] >= 96 and m['dark'] < 0.30 and m['outline'] >= 0.4:
        out.append(f"contour épais (2 px ou plus ; la famille : 1 px)")
    if m['shadow'] >= 12:
        out.append(f"ombre portée ({m['shadow']} px)")
    if m['soft'] >= 0.15 and m['area'] >= 64:
        out.append(f"bords flous ({m['soft']:.0%} du bord semi-transparent : style hors DS ?)")
    if m['area'] >= 96 and m['colors'] > 2.5 * med['colors'] and m['colors'] > 60:
        out.append(f"beaucoup plus de couleurs ({m['colors']:.0f} par case, la famille {med['colors']:.0f} : style hors DS ?)")
    interior = it['family'] == 'intérieurs et mobilier'
    if m['area'] >= (600 if interior else 400):
        ds = m['sat'] - med['sat']
        if abs(ds) > 0.32 and not interior:            # meubles blancs, vitrés, colorés : la saturation varie par nature
            out.append('beaucoup plus saturé que le reste' if ds > 0 else 'beaucoup plus terne que le reste')
        dv = m['val'] - med['val']
        if abs(dv) > 0.35:
            out.append('beaucoup plus clair que le reste' if dv > 0 else 'beaucoup plus sombre que le reste')
    if (not interior and it['family'] != 'bâtiments et toits' and med['height'] >= 16 and m['area'] >= 64
            and it.get('w_cells', 1) <= 8):              # pas les grands ensembles fusionnés (quai, berge entière)
        r = m['height'] / med['height']
        if r > 2.6:
            out.append(f"échelle : {r:.1f} fois plus haut que la moyenne de la famille")
        elif r < 0.3:
            out.append(f"échelle : {1 / r:.1f} fois plus petit que la moyenne de la famille")
    return out


# ---------- Lieux ----------
def interior_scope():
    js = ("import('./src/builder/interiorIndex.js').then(({interiorIndex})=>{const i=interiorIndex();"
          "process.stdout.write(JSON.stringify(i.city))})")
    city = json.loads(subprocess.check_output(['node', '-e', js], cwd=ROOT))
    rooms = sorted(r for r, c in city.items() if c in SCOPE_CITIES)
    places = []
    used_models = set()
    for r in rooms:
        p = ROOMS / f'{r}.json'
        if not p.exists():
            continue
        d = json.loads(p.read_text())
        if d.get('modele'):
            used_models.add(d['modele'])
        else:
            places.append((r, d, city[r]))
    for mid in sorted(used_models):
        d = json.loads((ROOMS / 'modeles' / f'{mid}.json').read_text())
        places.append((mid, d, 'modèle'))
    return places


def wall_skip(m):
    """Intérieur : les murs (cases pleines, sans transparence) de la bande du haut ne sont pas des assets."""
    W, H = m['width'], m['height']
    walk_rows = [y for y in range(H) if any(not m['solid'][y * W + x] for x in range(W))]
    top = walk_rows[0] if walk_rows else H
    full = {}

    def skip(sid, k, x, y):
        if y >= top + 1:
            return False
        key = (sid, k)
        if key not in full:
            full[key] = bool((tile(sid, k)[..., 3] == 255).all())
        return full[key]
    return skip


_VOID = {}


def is_void(sid, k):
    """Case de vide noir (bord des pièces HGSS) : pleine et presque noire partout."""
    if (sid, k) not in _VOID:
        t = tile(sid, k)
        _VOID[(sid, k)] = bool((t[..., 3] == 255).all() and (lum(t[..., :3].astype(np.float32)) < 24).all())
    return _VOID[(sid, k)]


def audit_place(pid, m, interior):
    items = []
    W = m['width']
    studio = [] if interior else studio_assets(m)
    taken = {(c, r) for s in studio for c, lst in s['refs'].items() for _, r in lst}
    base_skip = wall_skip(m) if interior else (lambda sid, k, x, y: False)

    def skip(sid, k, x, y):
        if sid in SKIP_SHEETS or base_skip(sid, k, x, y) or is_void(sid, k):
            return True
        return (y * W + x, m['sheets'].index(sid) * STRIDE + k) in taken
    img, origin = composite(m, skip=skip)
    full, _ = composite(m, skip=lambda sid, k, x, y: sid in SKIP_SHEETS)
    for s in studio:
        cells = sorted(s['refs'])
        one, _ = composite({**m, 'layers': {L: [(lambda c: [r for l2, r in s['refs'].get(c, []) if l2 == L])(i) or -1
                                                for i in range(len(m['layers'][L]))] for L in ('decor', 'dessus')}})
        ys = [c // W for c in cells]
        xs = [c % W for c in cells]
        sl = (slice(min(ys) * T, (max(ys) + 1) * T), slice(min(xs) * T, (max(xs) + 1) * T))
        crop = one[sl]
        mask = crop[..., 3] >= 128
        items.append({'place': pid, 'family': s['family'], 'cells': cells, 'refs': s['refs'], 'element': s['id'],
                      'name': s['name'], 'crop': crop, 'mask': mask, 'm': measure(crop, mask)})
    for a in pixel_assets(m, img, origin, interior):
        sl = a['sl']
        crop = img[sl].copy()
        crop[~a['mask']] = 0
        items.append({'place': pid, 'family': a['family'], 'cells': sorted(a['refs']), 'refs': a['refs'],
                      'w_cells': (a['sl'][1].stop - a['sl'][1].start) / T,
                      'crop': crop, 'mask': a['mask'], 'm': measure(crop, a['mask'])})
    return items


def contact_sheet(fam, items, path):
    items = sorted(items, key=lambda it: (not it['why'], it['place']))
    cell_w, cell_h, cols = 132, 132, 12
    rows = (len(items) + cols - 1) // cols
    sheet_img = Image.new('RGBA', (cols * cell_w, max(1, rows) * cell_h + 28), (54, 58, 66, 255))
    d = ImageDraw.Draw(sheet_img)
    d.text((6, 6), f'{fam} : {len(items)} assets, {sum(1 for it in items if it["why"])} écarts', fill=(255, 255, 255))
    for n, it in enumerate(items):
        x0, y0 = (n % cols) * cell_w, (n // cols) * cell_h + 28
        im = Image.fromarray(it['crop'])
        k = min(110 / im.width, 92 / im.height, 3)
        im = im.resize((max(1, int(im.width * k)), max(1, int(im.height * k))), Image.NEAREST)
        sheet_img.alpha_composite(im, (x0 + (cell_w - im.width) // 2, y0 + 4))
        if it['why']:
            d.rectangle((x0 + 1, y0 + 1, x0 + cell_w - 2, y0 + cell_h - 2), outline=(230, 60, 60), width=2)
        label = it['place'][:18]
        d.text((x0 + 4, y0 + 98), label, fill=(200, 200, 210))
        if it['why']:
            d.text((x0 + 4, y0 + 110), it['why'][0][:21], fill=(255, 140, 140))
            if len(it['why'][0]) > 21:
                d.text((x0 + 4, y0 + 120), it['why'][0][21:42], fill=(255, 140, 140))
    sheet_img.save(path)


def main():
    args = sys.argv[1:]
    only = args[args.index('--carte') + 1] if '--carte' in args else None
    out_dir = Path(args[args.index('--sortie') + 1]) if '--sortie' in args else DEFAULT_OUT
    out_dir.mkdir(parents=True, exist_ok=True)
    places = [(mid, json.loads((MAPS / f'{mid}.json').read_text()), False) for mid in SCOPE_MAPS]
    places += [(pid, d, True) for pid, d, _ in interior_scope()]
    if only:
        places = [p for p in places if p[0] == only]
    items = []
    for pid, m, interior in places:
        items += audit_place(pid, m, interior)
    by_fam = defaultdict(list)
    for it in items:
        by_fam[it['family']].append(it)
    meds = {f: medians(lst) for f, lst in by_fam.items()}
    for it in items:
        it['why'] = reasons(it, meds[it['family']])
    # Écarts : le fichier lu par le créateur (fusionné avec l'existant si --carte).
    ecarts = json.loads(OUT_JSON.read_text()) if only and OUT_JSON.exists() else {}
    for pid, m, _ in places:
        ecarts[pid] = []
    for it in items:
        if not it['why']:
            continue
        W = next(m['width'] for pid, m, _ in places if pid == it['place'])
        xs = [c % W for c in it['cells']]
        ys = [c // W for c in it['cells']]
        e = {'x': min(xs), 'y': min(ys), 'w': max(xs) - min(xs) + 1, 'h': max(ys) - min(ys) + 1, 'cells': it['cells'],
             'famille': it['family'], 'raisons': it['why'],
             'refs': {str(c): [[L, r] for L, r in lst] for c, lst in it['refs'].items()},
             'ref': {'element': it['element']} if it.get('element') else {}, 'mesures': it['m']}
        ecarts[it['place']].append(e)
    OUT_JSON.write_text(json.dumps(ecarts, ensure_ascii=False, separators=(',', ':')))
    summary = {'familles': {}, 'raisons': Counter()}
    for fam in FAMILIES:
        lst = by_fam.get(fam, [])
        if not lst:
            continue
        summary['familles'][fam] = {'assets': len(lst), 'écarts': sum(1 for it in lst if it['why']), 'médianes': meds[fam]}
        contact_sheet(fam, lst, out_dir / f"famille-{fam.split()[0]}.png")
    for it in items:
        for w in it['why']:
            summary['raisons'][w.split(' (')[0].split(' :')[0]] += 1
    summary['raisons'] = dict(summary['raisons'].most_common())
    (out_dir / 'resume.json').write_text(json.dumps(summary, ensure_ascii=False, indent=1))
    for fam, s in summary['familles'].items():
        print(f"{fam:24} {s['assets']:4} assets, {s['écarts']:3} écarts")
    print('raisons :', summary['raisons'])
    print(f'{OUT_JSON.relative_to(ROOT)} ; planches et résumé : {out_dir}')


if __name__ == '__main__':
    main()
