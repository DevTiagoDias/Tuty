// components/Game/engine/AssetManager.ts

export interface SpriteFrame {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ProcessedSheet {
  canvas: HTMLCanvasElement;
  frames: SpriteFrame[];
}

export class AssetManager {
  private static sheets: Map<string, ProcessedSheet> = new Map();
  private static loading: Set<string> = new Set();

  static getSpriteSheet(src: string): ProcessedSheet | null {
    if (this.sheets.has(src)) {
      return this.sheets.get(src)!;
    }

    if (this.loading.has(src)) return null;

    this.loading.add(src);
    const img = new Image();
    img.src = src;

    img.onload = () => {
      const w = img.width;
      const h = img.height;
      const offscreen = document.createElement("canvas");
      offscreen.width = w;
      offscreen.height = h;
      const ctx = offscreen.getContext("2d");

      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;

        // 1. Remove tanto fundo Verde (#00FF00) quanto Magenta (#FF00FF)
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          const isGreenBg = g > 145 && r < 120 && b < 120;
          const isMagentaBg = r > 180 && g < 90 && b > 180;

          if (isGreenBg || isMagentaBg) {
            data[i + 3] = 0;
          }
        }

        ctx.putImageData(imgData, 0, 0);

        // 2. Deteta automaticamente a caixa (bounding box) de cada boneco na horizontal
        const frames = this.detectFrames(data, w, h);
        this.sheets.set(src, { canvas: offscreen, frames });
      }
      this.loading.delete(src);
    };

    return null;
  }

  private static detectFrames(
    data: Uint8ClampedArray,
    width: number,
    height: number
  ): SpriteFrame[] {
    const colHasPixel = new Array<boolean>(width).fill(false);

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const alpha = data[(y * width + x) * 4 + 3];
        if (alpha > 20) {
          colHasPixel[x] = true;
          break;
        }
      }
    }

    const frames: SpriteFrame[] = [];
    let inSprite = false;
    let startX = 0;

    for (let x = 0; x < width; x++) {
      if (colHasPixel[x] && !inSprite) {
        inSprite = true;
        startX = x;
      } else if (!colHasPixel[x] && inSprite) {
        inSprite = false;
        const segmentW = x - startX;
        if (segmentW > 15) {
          // Encontra o topo (minY) e a base dos pés (maxY) deste boneco
          let minY = height;
          let maxY = 0;
          for (let sx = startX; sx < x; sx++) {
            for (let sy = 0; sy < height; sy++) {
              if (data[(sy * width + sx) * 4 + 3] > 20) {
                if (sy < minY) minY = sy;
                if (sy > maxY) maxY = sy;
              }
            }
          }
          frames.push({
            x: startX,
            y: minY,
            w: segmentW,
            h: Math.max(1, maxY - minY + 1),
          });
        }
      }
    }

    return frames;
  }
}