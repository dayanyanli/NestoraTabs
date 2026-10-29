from pathlib import Path
from PIL import Image, ImageDraw
root = Path(__file__).resolve().parents[1]
S=4
im=Image.new('RGBA',(128*S,128*S),(0,0,0,0))
d=ImageDraw.Draw(im)
def box(v): return tuple(int(n*S) for n in v)
d.rounded_rectangle(box((0,0,128,128)),radius=28*S,fill='#183D57')
for x in (21,82): d.rounded_rectangle(box((x,23,x+25,105)),radius=8*S,fill='#C5F0E1')
d.line(box((33,35,94,93)),fill='#68C5AF',width=21*S)
for x,y in ((33,35),(94,93)): d.ellipse(box((x-10.5,y-10.5,x+10.5,y+10.5)),fill='#68C5AF')
for x in (28,89): d.line(box((x,32,x+10,32)),fill='#183D57',width=4*S)
for size in (16,32,48,128): im.resize((size,size),Image.Resampling.LANCZOS).save(root/f'icons/icon{size}.png')
