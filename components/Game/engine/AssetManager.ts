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
  private static rawImages: Map<string, HTMLImageElement> = new Map();
  private static loading: Set<string> = new Set();

  static getRawImage(src: string): HTMLImageElement | null {
    if (!src) return null;
    if (this.rawImages.has(src)) {
      const img = this.rawImages.get(src)!;
      return img.complete && img.naturalWidth > 0 ? img : null;
    }
    if (this.loading.has(src)) return null;

    this.loading.add(src);
    const img = new Image();
    img.src = src;
    img.onload = () => {
      this.rawImages.set(src, img);
      this.loading.delete(src);
    };
    img.onerror = () => {
      this.loading.delete(src);
    };
    return null;
  }

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

        // Chroma key aprimorado: remove o fundo verde neon (#00FF00) e também a borda esverdeada de compressão JPEG
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          const isNeonGreen = g > 135 && g - r > 45 && g - b > 45;
          const isGreenHalo = g > 110 && g > r * 1.35 && g > b * 1.35;
          const isMagentaBg = r > 180 && g < 90 && b > 180;

          if (isNeonGreen || isGreenHalo || isMagentaBg) {
            data[i + 3] = 0;
          }
        }

        ctx.putImageData(imgData, 0, 0);
        const frames = this.detectFrames(data, w, h);
        this.sheets.set(src, { canvas: offscreen, frames });
      }
      this.loading.delete(src);
    };

    img.onerror = () => {
      this.loading.delete(src);
    };

    return null;
  }

  private static detectFrames(
    data: Uint8ClampedArray,
    width: number,
    height: number
  ): SpriteFrame[] {
    // Conta quantos pixels opacos cada coluna possui (ignora ruído < 3px para não juntar bonecos vizinhos!)
    const colHasSprite = new Array<boolean>(width).fill(false);

    for (let x = 0; x < width; x++) {
      let opaqueCount = 0;
      for (let y = 0; y < height; y++) {
        if (data[(y * width + x) * 4 + 3] > 40) {
          opaqueCount++;
        }
      }
      if (opaqueCount >= 3) {
        colHasSprite[x] = true;
      }
    }

    const rawSegments: { startX: number; endX: number }[] = [];
    let inSprite = false;
    let startX = 0;

    for (let x = 0; x < width; x++) {
      if (colHasSprite[x] && !inSprite) {
        inSprite = true;
        startX = x;
      } else if ((!colHasSprite[x] || x === width - 1) && inSprite) {
        inSprite = false;
        const endX = x === width - 1 ? width : x;
        if (endX - startX >= 8) {
          rawSegments.push({ startX, endX });
        }
      }
    }

    // Mescla apenas micro-fendas internas (< 3px) para NUNCA colar dois quadros de corrida num só
    const merged: { startX: number; endX: number }[] = [];
    for (const seg of rawSegments) {
      if (merged.length > 0 && seg.startX - merged[merged.length - 1].endX <= 2) {
        merged[merged.length - 1].endX = seg.endX;
      } else {
        merged.push({ ...seg });
      }
    }

    const frames: SpriteFrame[] = [];
    for (const seg of merged) {
      const segW = seg.endX - seg.startX;
      if (segW < 14) continue;

      let minY = height;
      let maxY = 0;
      for (let sx = seg.startX; sx < seg.endX; sx++) {
        for (let sy = 0; sy < height; sy++) {
          if (data[(sy * width + sx) * 4 + 3] > 40) {
            if (sy < minY) minY = sy;
            if (sy > maxY) maxY = sy;
          }
        }
      }

      if (maxY > minY) {
        frames.push({
          x: seg.startX,
          y: minY,
          w: segW,
          h: Math.max(1, maxY - minY + 1),
        });
      }
    }

    return frames;
  }
}
