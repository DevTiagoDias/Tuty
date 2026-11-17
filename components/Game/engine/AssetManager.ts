// components/Game/engine/AssetManager.ts

export class AssetManager {
  private static processedSheets: Map<string, HTMLCanvasElement> = new Map();
  private static loading: Set<string> = new Set();

  static getSpriteSheet(src: string): HTMLCanvasElement | null {
    if (this.processedSheets.has(src)) {
      return this.processedSheets.get(src)!;
    }

    if (this.loading.has(src)) return null;

    this.loading.add(src);
    const img = new Image();
    img.src = src;

    img.onload = () => {
      const offscreen = document.createElement("canvas");
      offscreen.width = img.width;
      offscreen.height = img.height;
      const ctx = offscreen.getContext("2d");

      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, offscreen.width, offscreen.height);
        const data = imgData.data;

        // Remove o fundo Verde (#00FF00) automaticamente (Chroma Key)
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Deteta píxeis onde o verde é dominante e brilhante
          if (g > 150 && r < 110 && b < 110) {
            data[i + 3] = 0; // Transparente
          }
        }

        ctx.putImageData(imgData, 0, 0);
        this.processedSheets.set(src, offscreen);
      }
      this.loading.delete(src);
    };

    return null;
  }
}