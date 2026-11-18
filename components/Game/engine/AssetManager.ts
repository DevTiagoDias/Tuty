// components/Game/engine/AssetManager.ts

export interface SpriteFrame {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Centro de massa horizontal (px dentro do quadro) – usado como âncora para o corpo não "balançar". */
  cx?: number;
}

export interface ProcessedSheet {
  /** Atlas já limpo: fundo verde removido e cada quadro isolado, com 2px de respiro. */
  canvas: HTMLCanvasElement;
  frames: SpriteFrame[];
  width: number;
  height: number;
}

export interface AtlasResult {
  width: number;
  height: number;
  pixels: Uint8ClampedArray;
  frames: SpriteFrame[];
}

export interface AtlasOptions {
  /**
   * true  = folha com UMA fileira de poses (player). Tudo que estiver fora dessa
   *         fileira (ex.: os "fantasmas" borrados do topo da imagem) é descartado.
   * false = folha de objetos soltos (props, arco, coração...).
   */
  singleRow: boolean;
}

/* ------------------------------------------------------------------ */
/*  Pipeline de pixels (função pura – não depende de DOM)             */
/* ------------------------------------------------------------------ */

interface Comp {
  id: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  area: number;
}

const ATLAS_PAD = 2;

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const s = values.slice().sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

/** Estima a cor do chroma key olhando os 4 cantos. Retorna null se não for um fundo verde. */
function estimateKeyColor(data: Uint8ClampedArray, w: number, h: number) {
  const size = Math.max(4, Math.min(16, Math.floor(Math.min(w, h) / 40)));
  const rs: number[] = [];
  const gs: number[] = [];
  const bs: number[] = [];
  const corners = [
    [0, 0],
    [w - size, 0],
    [0, h - size],
    [w - size, h - size],
  ];
  for (const [cx, cy] of corners) {
    let r = 0;
    let g = 0;
    let b = 0;
    for (let y = cy; y < cy + size; y++) {
      for (let x = cx; x < cx + size; x++) {
        const i = (y * w + x) * 4;
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
      }
    }
    const n = size * size;
    rs.push(r / n);
    gs.push(g / n);
    bs.push(b / n);
  }
  const key = { r: median(rs), g: median(gs), b: median(bs) };
  const excess = key.g - Math.max(key.r, key.b);
  return excess > 60 ? key : null;
}

/**
 * Remove o fundo verde SEM destruir os verdes "de verdade" da arte (folhas, vinhas):
 * em vez de apagar "qualquer verde", apaga só o que está perto da cor exata do fundo.
 * Depois limpa a franja esverdeada de 1–2px que sobra na borda dos desenhos.
 */
function keyOutBackground(data: Uint8ClampedArray, w: number, h: number) {
  const key = estimateKeyColor(data, w, h);
  if (!key) return;

  const KEY_DIST = 50;
  const keySq = KEY_DIST * KEY_DIST;

  for (let i = 0; i < data.length; i += 4) {
    const dr = data[i] - key.r;
    const dg = data[i + 1] - key.g;
    const db = data[i + 2] - key.b;
    if (dr * dr + dg * dg + db * db < keySq) data[i + 3] = 0;
  }

  const hasClearNeighbor = (x: number, y: number) =>
    (x > 0 && data[((y * w + x - 1) << 2) + 3] === 0) ||
    (x < w - 1 && data[((y * w + x + 1) << 2) + 3] === 0) ||
    (y > 0 && data[(((y - 1) * w + x) << 2) + 3] === 0) ||
    (y < h - 1 && data[(((y + 1) * w + x) << 2) + 3] === 0);

  // Erosão da franja: só pixels de borda, bem esverdeados e ainda "parentes" do fundo
  const limits = [130, 100];
  for (const limit of limits) {
    const kill: number[] = [];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) << 2;
        if (data[i + 3] === 0) continue;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const excess = g - Math.max(r, b);
        if (excess <= 28) continue;
        const dr = r - key.r;
        const dg = g - key.g;
        const db = b - key.b;
        if (Math.sqrt(dr * dr + dg * dg + db * db) >= limit) continue;
        if (hasClearNeighbor(x, y)) kill.push(i);
      }
    }
    for (const i of kill) data[i + 3] = 0;
  }

  // Despill: tira o reflexo verde dos pixels que sobraram na borda
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) << 2;
      if (data[i + 3] === 0) continue;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (g - Math.max(r, b) > 8 && hasClearNeighbor(x, y)) {
        data[i + 1] = Math.max(r, b);
      }
    }
  }
}

/** Componentes conectados (8 vizinhos) sobre os pixels opacos. */
function labelComponents(data: Uint8ClampedArray, w: number, h: number) {
  const n = w * h;
  const labels = new Int32Array(n);
  const stack = new Int32Array(n);
  const comps: Comp[] = [];
  let nextId = 1;

  for (let start = 0; start < n; start++) {
    if (labels[start] !== 0 || data[(start << 2) + 3] === 0) continue;

    const id = nextId++;
    const comp: Comp = { id, minX: w, maxX: 0, minY: h, maxY: 0, area: 0 };
    let sp = 0;
    stack[sp++] = start;
    labels[start] = id;

    while (sp > 0) {
      const idx = stack[--sp];
      const x = idx % w;
      const y = (idx - x) / w;

      comp.area++;
      if (x < comp.minX) comp.minX = x;
      if (x > comp.maxX) comp.maxX = x;
      if (y < comp.minY) comp.minY = y;
      if (y > comp.maxY) comp.maxY = y;

      for (let dy = -1; dy <= 1; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= h) continue;
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          if (nx < 0 || nx >= w) continue;
          const nIdx = ny * w + nx;
          if (labels[nIdx] === 0 && data[(nIdx << 2) + 3] !== 0) {
            labels[nIdx] = id;
            stack[sp++] = nIdx;
          }
        }
      }
    }
    comps.push(comp);
  }

  return { labels, comps };
}

/** Se duas poses encostaram e viraram um único componente, corta no "vale" entre elas. */
function splitTouchingPoses(
  labels: Int32Array,
  comps: Comp[],
  rowIds: number[],
  w: number
): number[] {
  const widths = rowIds.map((id) => comps[id - 1].maxX - comps[id - 1].minX + 1);
  const medW = median(widths);
  const result: number[] = [];

  for (const id of rowIds) {
    const c = comps[id - 1];
    const cw = c.maxX - c.minX + 1;
    if (cw <= medW * 1.7) {
      result.push(id);
      continue;
    }

    const counts = new Int32Array(cw);
    for (let y = c.minY; y <= c.maxY; y++) {
      for (let x = c.minX; x <= c.maxX; x++) {
        if (labels[y * w + x] === id) counts[x - c.minX]++;
      }
    }
    const margin = Math.floor(cw * 0.25);
    let best = Math.floor(cw / 2);
    let bestCount = Infinity;
    for (let i = margin; i < cw - margin; i++) {
      if (counts[i] < bestCount) {
        bestCount = counts[i];
        best = i;
      }
    }
    const splitX = c.minX + best;

    const right: Comp = {
      id: comps.length + 1,
      minX: w,
      maxX: 0,
      minY: c.maxY,
      maxY: c.minY,
      area: 0,
    };
    const left: Comp = { id, minX: w, maxX: 0, minY: c.maxY, maxY: c.minY, area: 0 };

    for (let y = c.minY; y <= c.maxY; y++) {
      for (let x = c.minX; x <= c.maxX; x++) {
        if (labels[y * w + x] !== id) continue;
        const target = x >= splitX ? right : left;
        if (target === right) labels[y * w + x] = right.id;
        target.area++;
        if (x < target.minX) target.minX = x;
        if (x > target.maxX) target.maxX = x;
        if (y < target.minY) target.minY = y;
        if (y > target.maxY) target.maxY = y;
      }
    }
    comps[id - 1] = left;
    comps.push(right);
    result.push(left.id, right.id);
  }

  return result;
}

export function buildAtlas(
  source: Uint8ClampedArray,
  w: number,
  h: number,
  options: AtlasOptions
): AtlasResult {
  const data = new Uint8ClampedArray(source); // não mexe no original
  keyOutBackground(data, w, h);

  const { labels, comps } = labelComponents(data, w, h);
  const usable = comps.filter((c) => c.area >= 6);
  const maxArea = usable.reduce((m, c) => Math.max(m, c.area), 0);

  if (usable.length === 0) {
    return { width: 1, height: 1, pixels: new Uint8ClampedArray(4), frames: [] };
  }

  // 1) Quais componentes são "quadros de verdade"?
  let rowIds: number[];
  if (options.singleRow) {
    const big = usable.filter((c) => c.area >= maxArea * 0.25);
    const baselineComp = big.reduce((a, b) => (b.maxY > a.maxY ? b : a));
    const refH = baselineComp.maxY - baselineComp.minY + 1;
    rowIds = usable
      .filter(
        (c) =>
          c.area >= maxArea * 0.06 &&
          c.maxY >= baselineComp.maxY - refH * 0.3 &&
          c.maxY - c.minY + 1 >= refH * 0.35
      )
      .map((c) => c.id);
    rowIds = splitTouchingPoses(labels, comps, rowIds, w);
  } else {
    rowIds = usable.filter((c) => c.area >= maxArea * 0.015).map((c) => c.id);
  }

  // 2) Agrupa componentes que ocupam a mesma coluna (ex.: parceiro encostado no arco)
  const groups: { ids: number[]; minX: number; maxX: number; minY: number; maxY: number }[] =
    [];
  const sortedRow = rowIds
    .map((id) => comps[id - 1])
    .sort((a, b) => b.area - a.area);

  for (const c of sortedRow) {
    let merged = false;
    if (!options.singleRow) {
      for (const g of groups) {
        const overlap = Math.min(g.maxX, c.maxX) - Math.max(g.minX, c.minX) + 1;
        const smaller = Math.min(g.maxX - g.minX + 1, c.maxX - c.minX + 1);
        if (overlap > 0 && overlap >= smaller * 0.6) {
          g.ids.push(c.id);
          g.minX = Math.min(g.minX, c.minX);
          g.maxX = Math.max(g.maxX, c.maxX);
          g.minY = Math.min(g.minY, c.minY);
          g.maxY = Math.max(g.maxY, c.maxY);
          merged = true;
          break;
        }
      }
    }
    if (!merged) {
      groups.push({ ids: [c.id], minX: c.minX, maxX: c.maxX, minY: c.minY, maxY: c.maxY });
    }
  }

  // 3) Em folhas de objetos, brilhos/estrelinhas soltas entram no objeto mais próximo
  const inRow = new Set(rowIds);
  if (!options.singleRow) {
    for (const c of usable) {
      if (inRow.has(c.id)) continue;
      const cx = (c.minX + c.maxX) / 2;
      const cy = (c.minY + c.maxY) / 2;
      for (const g of groups) {
        const mx = (g.maxX - g.minX + 1) * 0.12;
        const my = (g.maxY - g.minY + 1) * 0.12;
        if (cx >= g.minX - mx && cx <= g.maxX + mx && cy >= g.minY - my && cy <= g.maxY + my) {
          g.ids.push(c.id);
          g.minX = Math.min(g.minX, c.minX);
          g.maxX = Math.max(g.maxX, c.maxX);
          g.minY = Math.min(g.minY, c.minY);
          g.maxY = Math.max(g.maxY, c.maxY);
          break;
        }
      }
    }
  }

  groups.sort((a, b) => a.minX - b.minX);

  // 4) Monta o atlas: cada quadro copia SÓ os pixels do próprio desenho
  const groupOf = new Int32Array(comps.length + 2).fill(-1);
  groups.forEach((g, gi) => g.ids.forEach((id) => (groupOf[id] = gi)));

  const atlasW =
    groups.reduce((sum, g) => sum + (g.maxX - g.minX + 1) + ATLAS_PAD, ATLAS_PAD);
  const atlasH =
    groups.reduce((m, g) => Math.max(m, g.maxY - g.minY + 1), 0) + ATLAS_PAD * 2;
  const pixels = new Uint8ClampedArray(atlasW * atlasH * 4);
  const frames: SpriteFrame[] = [];

  let cursor = ATLAS_PAD;
  groups.forEach((g, gi) => {
    const fw = g.maxX - g.minX + 1;
    const fh = g.maxY - g.minY + 1;
    const oy = ATLAS_PAD + (atlasH - ATLAS_PAD * 2 - fh); // alinha pela base
    let sumX = 0;
    let count = 0;

    for (let y = g.minY; y <= g.maxY; y++) {
      for (let x = g.minX; x <= g.maxX; x++) {
        const src = y * w + x;
        if (groupOf[labels[src]] !== gi) continue;
        const dst = ((oy + (y - g.minY)) * atlasW + (cursor + (x - g.minX))) * 4;
        const si = src * 4;
        pixels[dst] = data[si];
        pixels[dst + 1] = data[si + 1];
        pixels[dst + 2] = data[si + 2];
        pixels[dst + 3] = data[si + 3];
        sumX += x - g.minX;
        count++;
      }
    }

    frames.push({ x: cursor, y: oy, w: fw, h: fh, cx: count ? sumX / count + 0.5 : fw / 2 });
    cursor += fw + ATLAS_PAD;
  });

  return { width: atlasW, height: atlasH, pixels, frames };
}

/* ------------------------------------------------------------------ */
/*  Reamostragem de qualidade (evita serrilhado ao reduzir a arte)     */
/* ------------------------------------------------------------------ */

function resampleCanvas(
  src: HTMLCanvasElement,
  dw: number,
  dh: number
): HTMLCanvasElement {
  let cur = src;
  let cw = src.width;
  let ch = src.height;

  // Reduz pela metade enquanto der: cada passo faz uma média 2x2 (parecido com mipmap)
  while (cw / 2 >= dw && ch / 2 >= dh) {
    const nw = Math.max(1, Math.floor(cw / 2));
    const nh = Math.max(1, Math.floor(ch / 2));
    cur = drawScaled(cur, nw, nh);
    cw = nw;
    ch = nh;
  }
  if (cw !== dw || ch !== dh) cur = drawScaled(cur, dw, dh);
  if (cur === src) cur = drawScaled(src, dw, dh);
  return cur;
}

function drawScaled(src: HTMLCanvasElement, w: number, h: number): HTMLCanvasElement {
  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  const ctx = out.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(src, 0, 0, src.width, src.height, 0, 0, w, h);
  return out;
}

/* ------------------------------------------------------------------ */
/*  AssetManager                                                       */
/* ------------------------------------------------------------------ */

export class AssetManager {
  private static sheets: Map<string, ProcessedSheet> = new Map();
  private static rawImages: Map<string, HTMLImageElement> = new Map();
  private static scaledFrames: Map<string, HTMLCanvasElement> = new Map();
  private static scaledImages: Map<string, HTMLCanvasElement> = new Map();
  private static loading: Set<string> = new Set();

  /** Folhas com uma única fileira de poses (descartam lixo fora da fileira). */
  private static isSingleRowSheet(src: string) {
    return /player/i.test(src);
  }

  static getRawImage(src: string): HTMLImageElement | null {
    if (!src) return null;

    const cached = this.rawImages.get(src);
    if (cached) return cached;

    const key = `raw:${src}`;
    if (this.loading.has(key)) return null;

    this.loading.add(key);
    const img = new Image();
    img.onload = () => {
      this.rawImages.set(src, img);
      this.loading.delete(key);
    };
    img.onerror = () => {
      this.loading.delete(key);
    };
    img.src = src;
    return null;
  }

  static getSpriteSheet(src: string): ProcessedSheet | null {
    if (!src) return null;

    const cached = this.sheets.get(src);
    if (cached) return cached;

    if (this.loading.has(src)) return null;
    this.loading.add(src);

    const img = new Image();
    img.onload = () => {
      try {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const tmp = document.createElement("canvas");
        tmp.width = w;
        tmp.height = h;
        const tctx = tmp.getContext("2d", { willReadFrequently: true });
        if (!tctx) return;
        tctx.drawImage(img, 0, 0);
        const imgData = tctx.getImageData(0, 0, w, h);

        const atlas = buildAtlas(imgData.data, w, h, {
          singleRow: this.isSingleRowSheet(src),
        });

        const canvas = document.createElement("canvas");
        canvas.width = atlas.width;
        canvas.height = atlas.height;
        const ctx = canvas.getContext("2d")!;
        const out = ctx.createImageData(atlas.width, atlas.height);
        out.data.set(atlas.pixels);
        ctx.putImageData(out, 0, 0);

        this.sheets.set(src, {
          canvas,
          frames: atlas.frames,
          width: atlas.width,
          height: atlas.height,
        });
      } finally {
        this.loading.delete(src);
      }
    };
    img.onerror = () => {
      this.loading.delete(src);
    };
    img.src = src;
    return null;
  }

  /**
   * Quadro da folha já reduzido para o tamanho final (scale = pixels finais / pixels do atlas).
   * É calculado uma vez e guardado em cache, então o jogo desenha 1:1, sem serrilhado.
   */
  static getScaledFrame(
    src: string,
    frameIndex: number,
    scale: number
  ): HTMLCanvasElement | null {
    const sheet = this.getSpriteSheet(src);
    if (!sheet) return null;
    const frame = sheet.frames[frameIndex];
    if (!frame) return null;

    const key = `${src}|${frameIndex}|${Math.round(scale * 1000)}`;
    const cached = this.scaledFrames.get(key);
    if (cached) return cached;

    const crop = document.createElement("canvas");
    crop.width = frame.w;
    crop.height = frame.h;
    crop.getContext("2d")!.drawImage(
      sheet.canvas,
      frame.x,
      frame.y,
      frame.w,
      frame.h,
      0,
      0,
      frame.w,
      frame.h
    );

    const dw = Math.max(1, Math.round(frame.w * scale));
    const dh = Math.max(1, Math.round(frame.h * scale));
    const out = resampleCanvas(crop, dw, dh);
    this.scaledFrames.set(key, out);
    return out;
  }

  /** Imagem inteira (ex.: fundo) já reduzida com qualidade para w x h. */
  static getScaledImage(src: string, w: number, h: number): HTMLCanvasElement | null {
    const img = this.getRawImage(src);
    if (!img) return null;

    const dw = Math.max(1, Math.round(w));
    const dh = Math.max(1, Math.round(h));
    const key = `${src}|${dw}x${dh}`;
    const cached = this.scaledImages.get(key);
    if (cached) return cached;

    const base = document.createElement("canvas");
    base.width = img.naturalWidth;
    base.height = img.naturalHeight;
    base.getContext("2d")!.drawImage(img, 0, 0);

    const out = resampleCanvas(base, dw, dh);
    this.scaledImages.set(key, out);
    return out;
  }

  /** Começa a carregar tudo logo no início, pra não aparecer "pop" no meio da fase. */
  static preload(srcs: { sheets?: string[]; images?: string[] }) {
    srcs.sheets?.forEach((s) => this.getSpriteSheet(s));
    srcs.images?.forEach((s) => this.getRawImage(s));
  }
}