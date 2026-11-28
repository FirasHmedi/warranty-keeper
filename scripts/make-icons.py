"""Draws the app icon (a shield with a check mark) and writes every icon asset.

Same style as the other Pomwik apps: one green glyph with thick rounded strokes
on the paper background. Run from the project root: python3 scripts/make-icons.py
(needs Pillow).
"""
from PIL import Image, ImageDraw

GREEN = (31, 111, 74)
PAPER = (246, 245, 241)
SS = 4  # supersampling factor
STROKE = 70
# Adaptive icon layers: keep the glyph inside the 66dp safe circle of the 108dp layer.
ADAPTIVE_SCALE = 0.78


def glyph_mask(size):
    """Glyph drawn on a 1024 grid, scaled by size / 1024 around the centre."""
    big = size * SS
    k = big / 1024
    mask = Image.new('L', (big, big), 0)
    d = ImageDraw.Draw(mask)
    w = STROKE * k

    def p(x, y):
        return (x * k, y * k)

    def stroke(points, closed=False):
        """Thick line with round joins and caps."""
        pts = [p(x, y) for x, y in points]
        if closed:
            pts = pts + pts[:1]
        # Discs stamped every w/16 along the path: exact width, round joins.
        for (x1, y1), (x2, y2) in zip(pts, pts[1:]):
            n = max(1, int(((x2 - x1) ** 2 + (y2 - y1) ** 2) ** 0.5 / (w / 16)))
            for i in range(n + 1):
                x, y = x1 + (x2 - x1) * i / n, y1 + (y2 - y1) * i / n
                d.ellipse((x - w / 2, y - w / 2, x + w / 2, y + w / 2), fill=255)

    def curve(a, c, b, n=32):
        """Points of a quadratic Bezier curve from a to b (control point c), a excluded."""
        out = []
        for i in range(1, n + 1):
            t = i / n
            out.append(tuple((1 - t) ** 2 * a[j] + 2 * (1 - t) * t * c[j] + t * t * b[j] for j in (0, 1)))
        return out

    # Shield outline: top rising to a point in the middle, straight sides,
    # two curves meeting at the bottom point.
    left, right, top, bottom, side_end = 252, 772, 200, 850, 500
    pts = [(512, top - 30), (right, top + 30), (right, side_end)]
    pts += curve((right, side_end), (right, 730), (512, bottom))
    pts += curve((512, bottom), (left, 730), (left, side_end))
    pts += [(left, top + 30)]
    stroke(pts, closed=True)

    # Check mark.
    stroke([(398, 520), (480, 602), (640, 430)])
    return mask.resize((size, size), Image.LANCZOS)


def place(canvas, scale, color, background=None):
    """Glyph scaled by `scale` (relative to the canvas) and centred."""
    size = round(canvas * scale)
    m = glyph_mask(size)
    full = Image.new('L', (canvas, canvas), 0)
    off = (canvas - size) // 2
    full.paste(m, (off, off))
    img = Image.new('RGBA', (canvas, canvas), background + (255,) if background else (0, 0, 0, 0))
    img.paste(Image.new('RGBA', (canvas, canvas), color + (255,)), (0, 0), full)
    return img


def main():
    place(1024, 1.0, GREEN, PAPER).convert('RGB').save('assets/icon.png')
    place(512, ADAPTIVE_SCALE, GREEN).save('assets/android-icon-foreground.png')
    Image.new('RGBA', (512, 512), PAPER + (255,)).save('assets/android-icon-background.png')
    place(432, ADAPTIVE_SCALE, (255, 255, 255)).save('assets/android-icon-monochrome.png')
    place(1024, 1.0, GREEN).save('assets/splash-icon.png')
    place(48, 1.0, GREEN, PAPER).save('assets/favicon.png')


if __name__ == '__main__':
    main()
