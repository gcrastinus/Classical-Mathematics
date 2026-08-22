import os, re, subprocess, json, sys
import numpy as np
from PIL import Image
import xml.etree.ElementTree as ET

BASE = os.path.expanduser("~/mnt/Euclid")
PDF  = os.path.join(BASE, "Augros - Introductory Geometry and Arithmetic.pdf")
TMP  = os.path.join(BASE, "Teaching/_tmp")
FIG  = os.path.join(TMP, "figs"); os.makedirs(FIG, exist_ok=True)
DPI  = 300
S    = DPI/72.0

txt = open(os.path.join(TMP,'book.txt'),encoding='utf-8',errors='replace').read().split('\f')

def find_page(pat):
    out={}
    for i,p in enumerate(txt):
        for m in re.finditer(pat,p,re.M):
            n=int(m.group(1))
            out.setdefault(n,i+1)
    return out

head = find_page(r'^\s*THEOREM (\d+):')
rem  = find_page(r'^\s*THEOREM (\d+) Remarks')

def words(page):
    o=os.path.join(TMP,'bb.xml')
    subprocess.run(['pdftotext','-bbox-layout','-f',str(page),'-l',str(page),PDF,o],check=True)
    root=ET.parse(o).getroot()
    ns={'p':root.tag.split('}')[0].strip('{')}
    pg=root.find('.//p:page',ns)
    W=float(pg.get('width')); Hh=float(pg.get('height'))
    ws=[]
    for w in pg.iter('{%s}word'%ns['p']):
        ws.append((float(w.get('xMin')),float(w.get('yMin')),
                   float(w.get('xMax')),float(w.get('yMax')),(w.text or '').strip()))
    return W,Hh,ws

def render(page):
    pre=os.path.join(TMP,'r')
    for f in os.listdir(TMP):
        if f.startswith('r-') and f.endswith('.png'): os.remove(os.path.join(TMP,f))
    subprocess.run(['pdftoppm','-png','-r',str(DPI),'-f',str(page),'-l',str(page),PDF,pre],check=True)
    for f in sorted(os.listdir(TMP)):
        if f.startswith('r-') and f.endswith('.png'):
            return Image.open(os.path.join(TMP,f)).convert('L')
    raise RuntimeError('no render')

def graphics_bands(page, ytop, ybot):
    W,Hh,ws = words(page)
    img = render(page)
    a = np.array(img)
    ink = a < 190
    # mask out every word box, dilated 2pt
    for (x0,y0,x1,y1,t) in ws:
        X0=max(0,int((x0-2)*S)); X1=min(ink.shape[1],int((x1+2)*S)+1)
        Y0=max(0,int((y0-2)*S)); Y1=min(ink.shape[0],int((y1+2)*S)+1)
        ink[Y0:Y1, X0:X1] = False
    # restrict to the vertical span of the proof
    Ytop=max(0,int(ytop*S)); Ybot=min(ink.shape[0],int(ybot*S))
    ink[:Ytop,:]=False; ink[Ybot:,:]=False
    rows = ink.sum(axis=1)
    thresh = 2
    bands=[]; start=None; gap=0; GAPMAX=int(14*S)
    for y,v in enumerate(rows):
        if v>thresh:
            if start is None: start=y
            gap=0
        else:
            if start is not None:
                gap+=1
                if gap>GAPMAX:
                    bands.append((start,y-gap)); start=None; gap=0
    if start is not None: bands.append((start,len(rows)-1))
    out=[]
    for (y0,y1) in bands:
        if (y1-y0) < int(28*S/ (S)) * 1:  # min height 28 px
            pass
        if (y1-y0) < 30: continue
        cols = ink[y0:y1+1,:].sum(axis=0)
        nz=np.nonzero(cols>0)[0]
        if len(nz)==0: continue
        x0,x1 = nz[0], nz[-1]
        if (x1-x0) < 30: continue
        # convert back to points
        bx0,by0,bx1,by1 = x0/S, y0/S, x1/S, y1/S
        # absorb any word boxes that sit inside / touch the graphics box (these are the labels)
        for _ in range(3):
            for (wx0,wy0,wx1,wy1,t) in ws:
                if not t: continue
                if wx1 < bx0-14 or wx0 > bx1+14 or wy1 < by0-14 or wy0 > by1+14: continue
                if len(t) > 6: continue                      # not a label: real prose
                if wy1 < ytop or wy0 > ybot: continue
                bx0=min(bx0,wx0); by0=min(by0,wy0); bx1=max(bx1,wx1); by1=max(by1,wy1)
        out.append((bx0,by0,bx1,by1))
    return out, img, W, Hh

def head_y(page, pat):
    W,Hh,ws = words(page)
    return None

manifest={}
for n in range(1,38):
    hp = head.get(n); rp = rem.get(n, hp)
    if not hp: continue
    # y of the theorem heading on its page, and of the Remarks heading
    def yof(page, regex, which):
        W,Hh,ws = words(page)
        # rebuild lines
        for (x0,y0,x1,y1,t) in ws:
            if re.match(regex,t): return (y0,y1,Hh)
        return None
    ytop_info = None
    W,Hh,ws = words(hp)
    ytop = 0
    for i,(x0,y0,x1,y1,t) in enumerate(ws):
        if t.upper().startswith('THEOREM'):
            nxt = ws[i+1][4] if i+1 < len(ws) else ''
            if nxt.rstrip(':') == str(n):
                ytop = y1; break
    ybot = Hh
    pages = list(range(hp, rp+1))
    figs=[]
    for pg in pages:
        Wp,Hp,wsp = words(pg)
        t0 = ytop if pg==hp else 0
        t1 = Hp
        if pg==rp:
            for i,(x0,y0,x1,y1,t) in enumerate(wsp):
                if t.upper().startswith('THEOREM'):
                    if i+2 < len(wsp) and wsp[i+2][4].startswith('Remark'):
                        t1 = y0; break
        bands,img,_,_ = graphics_bands(pg, t0, t1)
        for k,(bx0,by0,bx1,by1) in enumerate(bands):
            m=8
            box=(int((bx0-m)*S), int((by0-m)*S), int((bx1+m)*S), int((by1+m)*S))
            box=(max(0,box[0]),max(0,box[1]),min(img.size[0],box[2]),min(img.size[1],box[3]))
            crop=img.crop(box)
            fn=os.path.join(FIG,f"t{n:02d}_{pg}_{k}.png")
            crop.save(fn)
            figs.append({'file':os.path.basename(fn),'page':pg,'w':crop.size[0],'h':crop.size[1]})
    manifest[n]={'headPage':hp,'remPage':rp,'figs':figs}
    print(n, hp, rp, [ (f['w'],f['h']) for f in figs ], flush=True)

json.dump(manifest, open(os.path.join(TMP,'figs.json'),'w'), indent=1)
print("DONE")
