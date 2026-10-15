# Une NN_x_plana.png + NN_x_iso.png en NN_x_lado.png (izquierda: vista actual, derecha: ?view=iso). Uso: python3 merge.py
import glob, os
from PIL import Image, ImageDraw
d = '/home/user/Game/studio/docs/capturas-vista-iso/'
for f in sorted(glob.glob(d + '*_plana.png')):
    g = f.replace('_plana', '_iso')
    if not os.path.exists(g): continue
    a, b = Image.open(f).convert('RGB'), Image.open(g).convert('RGB')
    im = Image.new('RGB', (a.width + b.width + 8, a.height), (255, 0, 255))
    im.paste(a, (0, 0)); im.paste(b, (a.width + 8, 0))
    dr = ImageDraw.Draw(im); dr.rectangle((0, 0, 70, 14), fill=(0, 0, 0)); dr.text((3, 2), 'PLANA', fill=(255, 255, 255))
    dr.rectangle((a.width + 8, 0, a.width + 78, 14), fill=(0, 0, 0)); dr.text((a.width + 11, 2), 'ISO', fill=(255, 255, 255))
    im.save(f.replace('_plana', '_lado'))
