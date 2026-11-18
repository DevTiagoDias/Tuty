// components/Game/engine/Renderer.ts

import { LevelConfig, Rect } from "../types/game.types";
import { Player } from "../entities/Player";
import { AssetManager } from "./AssetManager";
import { Camera2D } from "./Camera2D";

/** Tamanho "lógico" da tela do jogo. O canvas pode ter mais pixels (ex.: 1600x800) para ficar nítido. */
export const GAME_VIEW = { width: 800, height: 400 } as const;

const PLAYER_SRC = "/sprites/player_sheet.png";
const PROPS_SRC = "/sprites/partner_goal.png";
const BG_SRC = "/sprites/bg_roses.png";

/** Ordem dos objetos em partner_goal.png (da esquerda para a direita). */
const PROP = { BLOCK: 0, BUSH: 1, HEART: 2, ARCH: 3 } as const;

/** Altura (px lógicos) da personagem parada. As outras poses usam a mesma escala. */
const PLAYER_HEIGHT = 52;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
  gravity: number;
}

interface Ambient {
  baseX: number;
  baseY: number;
  par: number;
  speed: number;
  phase: number;
  size: number;
  kind: "petal" | "fly";
  color: string;
}

export class Renderer {
  private static time = 0;
  private static lastNow = 0;
  private static rs = 1; // pixels reais por pixel lógico

  // Estado de efeitos
  private static levelRef: LevelConfig | null = null;
  private static seenCollected = new Set<string>();
  private static particles: Particle[] = [];
  private static stepTimer = 0;
  private static prevGrounded = false;
  private static airVy = 0;
  private static lastPlayerX = 0;
  private static prevAllCollected = false;
  private static hudPulse = 0;
  private static toastTimer = 0;

  // Caches
  private static platformCache = new Map<string, HTMLCanvasElement>();
  private static tintedBush = new WeakMap<HTMLCanvasElement, HTMLCanvasElement>();
  private static silhouettes = new WeakMap<HTMLCanvasElement, HTMLCanvasElement>();
  private static outlines = new WeakMap<HTMLCanvasElement, HTMLCanvasElement>();
  private static ambient: Ambient[] | null = null;
  private static frontPetals: Ambient[] | null = null;

  /** Opcional: chame ao trocar de fase para limpar partículas. */
  static reset() {
    this.levelRef = null;
    this.seenCollected.clear();
    this.particles = [];
    this.prevAllCollected = false;
    this.toastTimer = 0;
    this.hudPulse = 0;
  }

  static draw(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    level: LevelConfig,
    player: Player,
    allCollected: boolean,
    camera?: Camera2D
  ) {
    // ---- tempo (independe do FPS) ----
    const now = performance.now();
    const dt = this.lastNow === 0 ? 0.016 : Math.min(0.05, (now - this.lastNow) / 1000);
    this.lastNow = now;
    this.time += dt;

    AssetManager.preload({ sheets: [PLAYER_SRC, PROPS_SRC], images: [BG_SRC] });

    // ---- escala: o jogo sempre pensa em 800x400, o canvas pode ter mais pixels ----
    const rs = canvas.width / GAME_VIEW.width;
    this.rs = rs;
    ctx.setTransform(rs, 0, 0, rs, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, GAME_VIEW.width, GAME_VIEW.height);

    if (this.levelRef !== level) {
      this.reset();
      this.levelRef = level;
      this.prevGrounded = player.isGrounded;
      this.lastPlayerX = player.x;
    }

    const camX = camera ? Math.round(camera.x * rs) / rs : 0;
    const accent = level.theme.accent;

    this.updateEffects(dt, level, player, allCollected);

    // 1. Cenário (fundo)
    this.drawBackground(ctx, camX);
    this.drawMidground(ctx, camX);
    this.drawAmbient(ctx, camX, this.ambient ?? (this.ambient = this.makeAmbient(30)), 1);

    // 2. Mundo
    ctx.save();
    ctx.translate(-camX, 0);

    const left = camX - 80;
    const right = camX + GAME_VIEW.width + 80;

    for (const plat of level.platforms) {
      if (plat.x + plat.w < left || plat.x > right) continue;
      this.drawPlatform(ctx, plat, accent);
    }

    for (const item of level.collectibles) {
      if (item.collected || item.x < left || item.x > right) continue;
      const floatY = Math.sin(this.time * 2.5 + item.x * 0.03) * 4;
      this.drawCollectible(ctx, item.x, item.y + floatY, accent);
    }

    this.drawGoal(ctx, level, allCollected, accent);

    this.drawPlayerShadow(ctx, player, level.platforms);
    this.drawGhosts(ctx, player);
    this.drawPlayer(ctx, player);
    this.drawParticles(ctx, this.particles);

    ctx.restore();

    // 3. Pétalas em primeiro plano + vinheta
    this.drawAmbient(ctx, camX, this.frontPetals ?? (this.frontPetals = this.makeFront(9)), 0.7);
    this.drawVignette(ctx);

    // 4. Interface
    this.drawHUD(ctx, level, player, allCollected, accent);
  }

  /* ================================================================ */
  /*  Utilidades                                                       */
  /* ================================================================ */

  private static hash(a: number, b = 0, c = 0): number {
    let h = Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(c | 0, 1274126177);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  }

  private static mod(a: number, m: number) {
    return ((a % m) + m) % m;
  }

  private static snap(v: number) {
    return Math.round(v * this.rs) / this.rs;
  }

  private static roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  /** Desenha um quadro de uma folha com altura lógica `targetH` e a base no ponto (cx, bottom). */
  private static drawProp(
    ctx: CanvasRenderingContext2D,
    frameIndex: number,
    centerX: number,
    bottomY: number,
    targetH: number,
    flip = false
  ): { w: number; h: number } | null {
    const sheet = AssetManager.getSpriteSheet(PROPS_SRC);
    const frame = sheet?.frames[frameIndex];
    if (!sheet || !frame) return null;
    const baked = AssetManager.getScaledFrame(PROPS_SRC, frameIndex, (targetH * this.rs) / frame.h);
    if (!baked) return null;

    const w = baked.width / this.rs;
    const h = baked.height / this.rs;
    ctx.save();
    ctx.translate(this.snap(centerX), this.snap(bottomY));
    if (flip) ctx.scale(-1, 1);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(baked, -w / 2, -h, w, h);
    ctx.restore();
    return { w, h };
  }

  /* ================================================================ */
  /*  Efeitos (poeira, brilho ao coletar, avisos)                       */
  /* ================================================================ */

  private static spawn(p: Partial<Particle> & { x: number; y: number }) {
    this.particles.push({
      vx: 0,
      vy: 0,
      size: 2,
      life: 0.5,
      maxLife: 0.5,
      color: "#e9d5ff",
      gravity: 0,
      ...p,
    });
  }

  private static updateEffects(
    dt: number,
    level: LevelConfig,
    player: Player,
    allCollected: boolean
  ) {
    // Respawn (teleporte): limpa o rastro
    if (Math.abs(player.x - this.lastPlayerX) > 250) {
      this.particles = [];
      this.prevGrounded = player.isGrounded;
    }
    this.lastPlayerX = player.x;

    const feetX = player.x + player.w / 2;
    const feetY = player.y + player.h;
    const dir = player.facing === "left" ? -1 : 1;

    // Passos
    if (player.isGrounded && Math.abs(player.vx) > 60) {
      this.stepTimer -= dt;
      if (this.stepTimer <= 0) {
        this.stepTimer = 0.11;
        this.spawn({
          x: feetX - dir * 7 + (this.hash(this.time * 1000) - 0.5) * 4,
          y: feetY - 1,
          vx: -dir * (14 + this.hash(this.time * 777) * 16),
          vy: -(10 + this.hash(this.time * 555) * 18),
          size: 2 + Math.floor(this.hash(this.time * 333) * 2),
          life: 0.38,
          maxLife: 0.38,
          color: "#ead9ff",
          gravity: 30,
        });
      }
    } else {
      this.stepTimer = 0;
    }

    // Pulo e aterrissagem
    if (this.prevGrounded && !player.isGrounded && player.vy < 0) {
      for (let i = 0; i < 6; i++) {
        this.spawn({
          x: feetX + (i - 2.5) * 3,
          y: feetY - 1,
          vx: (i - 2.5) * 16,
          vy: -(10 + this.hash(i, 3) * 20),
          size: 2,
          life: 0.4,
          maxLife: 0.4,
          color: "#ead9ff",
          gravity: 40,
        });
      }
    }
    if (!this.prevGrounded && player.isGrounded) {
      const power = Math.min(1, Math.max(0.35, this.airVy / 650));
      const n = Math.round(6 + power * 8);
      for (let i = 0; i < n; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        this.spawn({
          x: feetX + side * (3 + this.hash(i, 5) * 8),
          y: feetY - 1,
          vx: side * (30 + this.hash(i, 6) * 70 * power),
          vy: -(14 + this.hash(i, 7) * 40 * power),
          size: 2 + Math.floor(this.hash(i, 8) * 2),
          life: 0.5,
          maxLife: 0.5,
          color: "#ead9ff",
          gravity: 90,
        });
      }
    }
    this.airVy = player.isGrounded ? 0 : Math.max(this.airVy, player.vy);
    this.prevGrounded = player.isGrounded;

    // Coleta de coração: explosão de brilhos + pulso no HUD
    for (const item of level.collectibles) {
      if (item.collected && !this.seenCollected.has(item.id)) {
        this.seenCollected.add(item.id);
        this.hudPulse = 1;
        const colors = ["#fb7185", "#fde68a", "#ffffff", "#f43f5e"];
        for (let i = 0; i < 16; i++) {
          const a = (i / 16) * Math.PI * 2 + this.hash(i, 1) * 0.4;
          const sp = 50 + this.hash(i, 2) * 90;
          this.spawn({
            x: item.x,
            y: item.y,
            vx: Math.cos(a) * sp,
            vy: Math.sin(a) * sp - 20,
            size: 2 + Math.floor(this.hash(i, 3) * 2),
            life: 0.7,
            maxLife: 0.7,
            color: colors[i % colors.length],
            gravity: 120,
          });
        }
      }
    }

    // Aviso quando o arco é liberado
    if (allCollected && !this.prevAllCollected) this.toastTimer = 3.2;
    this.prevAllCollected = allCollected;
    this.toastTimer = Math.max(0, this.toastTimer - dt);
    this.hudPulse = Math.max(0, this.hudPulse - dt * 3);

    // Atualiza partículas
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  private static drawParticles(ctx: CanvasRenderingContext2D, list: Particle[]) {
    for (const p of list) {
      const k = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = k * 0.9;
      ctx.fillStyle = p.color;
      const s = Math.max(1, p.size * (0.5 + k * 0.5));
      ctx.fillRect(this.snap(p.x - s / 2), this.snap(p.y - s / 2), s, s);
    }
    ctx.globalAlpha = 1;
  }

  /* ================================================================ */
  /*  Cenário                                                          */
  /* ================================================================ */

  private static drawBackground(ctx: CanvasRenderingContext2D, camX: number) {
    const W = GAME_VIEW.width;
    const H = GAME_VIEW.height;
    const img = AssetManager.getRawImage(BG_SRC);

    if (!img) {
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "#2e1065");
      grad.addColorStop(0.55, "#be185d");
      grad.addColorStop(1, "#f97316");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      return;
    }

    // Mantém a proporção original (antes a imagem era esticada para 2:1)
    const tileH = H;
    const tileW = Math.round(H * (img.naturalWidth / img.naturalHeight));
    const baked = AssetManager.getScaledImage(BG_SRC, tileW * this.rs, tileH * this.rs);
    if (!baked) return;

    const scroll = camX * 0.2;
    const first = Math.floor(scroll / tileW);
    const count = Math.ceil(W / tileW) + 2;

    for (let i = 0; i < count; i++) {
      const tileIndex = first + i;
      const x = Math.floor((tileIndex * tileW - scroll) * this.rs) / this.rs;
      const mirrored = Math.abs(tileIndex) % 2 === 1;
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      if (mirrored) {
        ctx.translate(x + tileW + 0.5, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(baked, 0, 0, tileW + 1, tileH);
      } else {
        ctx.drawImage(baked, x, 0, tileW + 1, tileH);
      }
      ctx.restore();
    }

    // Véu: escurece levemente a parte de baixo, onde ficam plataformas e personagem
    const veil = ctx.createLinearGradient(0, 0, 0, H);
    veil.addColorStop(0, "rgba(20, 8, 40, 0.05)");
    veil.addColorStop(0.55, "rgba(20, 8, 40, 0.18)");
    veil.addColorStop(1, "rgba(14, 4, 28, 0.42)");
    ctx.fillStyle = veil;
    ctx.fillRect(0, 0, W, H);
  }

  /** Fileira de moitas escuras com parallax entre o fundo e as plataformas (dá profundidade nos buracos). */
  private static drawMidground(ctx: CanvasRenderingContext2D, camX: number) {
    const sheet = AssetManager.getSpriteSheet(PROPS_SRC);
    const frame = sheet?.frames[PROP.BUSH];
    if (!sheet || !frame) return;

    const slot = 120;
    const scroll = camX * 0.55;
    const first = Math.floor((scroll - 120) / slot);
    const last = Math.ceil((scroll + GAME_VIEW.width + 120) / slot);
    const sizes = [44, 56, 70];

    for (let k = first; k <= last; k++) {
      const size = sizes[Math.floor(this.hash(k, 1) * sizes.length)];
      const x = k * slot + this.hash(k, 2) * 60 - scroll;
      const baked = AssetManager.getScaledFrame(PROPS_SRC, PROP.BUSH, (size * this.rs) / frame.h);
      if (!baked) continue;

      let tinted = this.tintedBush.get(baked);
      if (!tinted) {
        tinted = document.createElement("canvas");
        tinted.width = baked.width;
        tinted.height = baked.height;
        const t = tinted.getContext("2d")!;
        t.drawImage(baked, 0, 0);
        t.globalCompositeOperation = "source-atop";
        t.fillStyle = "rgba(34, 10, 54, 0.6)";
        t.fillRect(0, 0, tinted.width, tinted.height);
        this.tintedBush.set(baked, tinted);
      }

      const w = tinted.width / this.rs;
      const h = tinted.height / this.rs;
      ctx.save();
      ctx.translate(this.snap(x), GAME_VIEW.height + 6);
      if (this.hash(k, 3) > 0.5) ctx.scale(-1, 1);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(tinted, -w / 2, -h, w, h);
      ctx.restore();
    }
  }

  private static makeAmbient(count: number): Ambient[] {
    const petals = ["#fb7185", "#f43f5e", "#fda4af"];
    return Array.from({ length: count }, (_, i) => {
      const fly = i % 3 === 0;
      return {
        baseX: this.hash(i, 1) * 1400,
        baseY: this.hash(i, 2) * GAME_VIEW.height,
        par: 0.25 + this.hash(i, 3) * 0.7,
        speed: 0.4 + this.hash(i, 4),
        phase: this.hash(i, 5) * Math.PI * 2,
        size: fly ? 1.5 : 2 + this.hash(i, 6) * 1.5,
        kind: fly ? "fly" : "petal",
        color: fly ? "#fde68a" : petals[i % petals.length],
      };
    });
  }

  private static makeFront(count: number): Ambient[] {
    return Array.from({ length: count }, (_, i) => ({
      baseX: this.hash(i + 100, 1) * 1400,
      baseY: this.hash(i + 100, 2) * GAME_VIEW.height,
      par: 1.3 + this.hash(i + 100, 3) * 0.5,
      speed: 0.7 + this.hash(i + 100, 4),
      phase: this.hash(i + 100, 5) * Math.PI * 2,
      size: 3.5,
      kind: "petal" as const,
      color: i % 2 === 0 ? "#fb7185" : "#fda4af",
    }));
  }

  private static drawAmbient(
    ctx: CanvasRenderingContext2D,
    camX: number,
    list: Ambient[],
    alpha: number
  ) {
    const span = GAME_VIEW.width + 80;
    const t = this.time;

    for (const a of list) {
      if (a.kind === "petal") {
        const x = this.mod(a.baseX - camX * a.par - t * (10 + a.speed * 12), span) - 40;
        const y =
          this.mod(a.baseY + t * (12 + a.speed * 14), GAME_VIEW.height + 30) -
          15 +
          Math.sin(t * 1.3 + a.phase) * 8;
        ctx.save();
        ctx.globalAlpha = 0.85 * alpha;
        ctx.translate(this.snap(x), this.snap(y));
        ctx.rotate(t * a.speed + a.phase);
        ctx.fillStyle = a.color;
        ctx.fillRect(-a.size, -a.size / 2, a.size * 2, a.size);
        ctx.restore();
      } else {
        const x = this.mod(a.baseX - camX * a.par + Math.sin(t * 0.5 + a.phase) * 18, span) - 40;
        const y = a.baseY * 0.9 + 30 + Math.sin(t * 0.8 + a.phase * 2) * 14;
        const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 2.2 + a.phase));
        ctx.globalAlpha = tw * 0.28 * alpha;
        ctx.fillStyle = a.color;
        ctx.beginPath();
        ctx.arc(x, y, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = tw * alpha;
        ctx.fillRect(this.snap(x - 1), this.snap(y - 1), 2, 2);
        ctx.globalAlpha = 1;
      }
    }
    ctx.globalAlpha = 1;
  }

  private static drawVignette(ctx: CanvasRenderingContext2D) {
    const W = GAME_VIEW.width;
    const H = GAME_VIEW.height;
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.55, W / 2, H / 2, W * 0.62);
    g.addColorStop(0, "rgba(10, 2, 20, 0)");
    g.addColorStop(1, "rgba(10, 2, 20, 0.5)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  /* ================================================================ */
  /*  Plataformas                                                      */
  /* ================================================================ */

  private static readonly PLAT_PAD = { x: 6, top: 14, bottom: 28 };

  private static drawPlatform(ctx: CanvasRenderingContext2D, plat: Rect, accent: string) {
    const bmp = this.getPlatformBitmap(plat, accent);
    const pad = this.PLAT_PAD;
    ctx.drawImage(
      bmp,
      plat.x - pad.x,
      plat.y - pad.top,
      bmp.width / this.rs,
      bmp.height / this.rs
    );
    this.drawPlatformBushes(ctx, plat);
  }

  private static drawPlatformBushes(ctx: CanvasRenderingContext2D, plat: Rect) {
    if (plat.w < 100) return;
    const sheet = AssetManager.getSpriteSheet(PROPS_SRC);
    const frame = sheet?.frames[PROP.BUSH];
    if (!sheet || !frame) return;

    const count = plat.w >= 300 ? 3 : plat.w >= 190 ? 2 : 1;
    const sizes = [18, 22, 26];
    const aspect = frame.w / frame.h;

    for (let k = 0; k < count; k++) {
      const size = sizes[Math.floor(this.hash(plat.x, k, 11) * sizes.length)];
      const bw = size * aspect;
      const slotW = (plat.w - 16) / count;
      const cx = plat.x + 8 + slotW * k + bw / 2 + this.hash(plat.x, k, 12) * Math.max(0, slotW - bw);
      this.drawProp(ctx, PROP.BUSH, cx, plat.y + 5, size, this.hash(plat.x, k, 13) > 0.5);
    }
  }

  private static getPlatformBitmap(plat: Rect, accent: string): HTMLCanvasElement {
    const key = `${plat.x}|${plat.y}|${plat.w}|${plat.h}|${accent}|${this.rs}`;
    const cached = this.platformCache.get(key);
    if (cached) return cached;

    const pad = this.PLAT_PAD;
    const w = Math.floor(plat.w);
    const h = Math.floor(plat.h);
    const seed = Math.floor(plat.x * 7 + plat.y * 13);

    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil((w + pad.x * 2) * this.rs);
    canvas.height = Math.ceil((h + pad.top + pad.bottom) * this.rs);
    const c = canvas.getContext("2d")!;
    c.scale(this.rs, this.rs);
    c.translate(pad.x, pad.top);

    // Sombra projetada
    c.fillStyle = "rgba(8, 2, 16, 0.32)";
    c.fillRect(3, 5, w, h);

    // Pedra
    const stone = c.createLinearGradient(0, 0, 0, h);
    stone.addColorStop(0, "#463562");
    stone.addColorStop(1, "#1a1128");
    c.fillStyle = stone;
    c.fillRect(0, 0, w, h);

    // Tijolos
    const rowH = 9;
    const brickW = 20;
    for (let r = 0; r * rowH < h; r++) {
      const y0 = r * rowH;
      const bh = Math.min(rowH, h - y0);
      const off = (r % 2) * (brickW / 2);
      for (let bx = -off; bx < w; bx += brickW) {
        const x0 = Math.max(0, bx);
        const x1 = Math.min(w, bx + brickW);
        if (x1 <= x0) continue;
        const v = this.hash(seed, r, Math.floor(bx));
        if (v > 0.68) {
          c.fillStyle = "rgba(255, 225, 255, 0.07)";
          c.fillRect(x0, y0, x1 - x0, bh);
        } else if (v < 0.24) {
          c.fillStyle = "rgba(0, 0, 0, 0.16)";
          c.fillRect(x0, y0, x1 - x0, bh);
        }
        c.fillStyle = "rgba(10, 4, 20, 0.5)";
        c.fillRect(x0, y0 + bh - 1, x1 - x0, 1);
        if (bx >= 0) c.fillRect(bx, y0, 1, bh);
      }
    }

    // Luz na esquerda, sombra na direita e embaixo
    c.fillStyle = "rgba(255, 255, 255, 0.07)";
    c.fillRect(0, 0, 1, h);
    c.fillStyle = "rgba(0, 0, 0, 0.3)";
    c.fillRect(w - 2, 0, 2, h);
    c.fillRect(0, h - 2, w, 2);

    // Musgo no topo (com pontinhas de grama e "pingos" na borda)
    c.fillStyle = "#1f5a35";
    c.fillRect(0, 0, w, 6);
    c.fillStyle = "#2f8a4a";
    c.fillRect(0, 0, w, 3);
    c.fillStyle = "#86e093";
    c.fillRect(0, 0, w, 1);

    for (let x = 0; x < w; x += 3) {
      const v = this.hash(seed, x, 1);
      if (v > 0.55) {
        c.fillStyle = "#1f5a35";
        c.fillRect(x, 6, 3, v > 0.85 ? 6 : 3);
      }
      const tv = this.hash(seed, x, 2);
      if (tv > 0.55) {
        const t = 1 + Math.floor((tv - 0.55) * 6.5);
        c.fillStyle = tv > 0.85 ? "#86e093" : "#3fa05a";
        c.fillRect(x, -t, 3, t);
      }
    }

    // Brilho quente do pôr do sol na quina
    c.fillStyle = "rgba(253, 224, 71, 0.35)";
    c.fillRect(0, 0, Math.min(w, 14), 1);

    // Vinhas com rosinhas
    const vines = Math.max(1, Math.floor(w / 40));
    for (let i = 0; i < vines; i++) {
      const vx = Math.floor(6 + this.hash(seed, i, 3) * (w - 12));
      const len = 8 + Math.floor(this.hash(seed, i, 4) * 18);
      for (let yy = 4; yy < 4 + len; yy++) {
        const sway = yy % 6 < 3 ? 0 : 1;
        c.fillStyle = "#2a7a43";
        c.fillRect(vx + sway, yy, 2, 1);
        if (yy % 4 === 0) {
          c.fillStyle = "#4cc468";
          c.fillRect(vx + sway + (yy % 8 === 0 ? -2 : 2), yy, 2, 2);
        }
      }
      if (len > 12) {
        const ry = 4 + Math.floor(len * 0.7);
        const useAccent = this.hash(seed, i, 5) > 0.66;
        c.fillStyle = useAccent ? accent : "#e11d48";
        c.fillRect(vx - 1, ry, 4, 3);
        c.fillStyle = "rgba(255, 255, 255, 0.55)";
        c.fillRect(vx, ry, 1, 1);
      }
    }

    this.platformCache.set(key, canvas);
    return canvas;
  }

  /* ================================================================ */
  /*  Itens e portão                                                   */
  /* ================================================================ */

  private static drawCollectible(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    accent: string
  ) {
    const t = this.time;

    // Halo pulsante
    const r = 20 + Math.sin(t * 4) * 2.5;
    const glow = ctx.createRadialGradient(x, y, 2, x, y, r);
    glow.addColorStop(0, "rgba(251, 113, 133, 0.5)");
    glow.addColorStop(1, "rgba(251, 113, 133, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);

    const drawn = this.drawProp(ctx, PROP.HEART, x, y + 14, 32);
    if (!drawn) {
      ctx.fillStyle = "#f43f5e";
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Brilhinhos orbitando
    ctx.fillStyle = accent;
    for (let i = 0; i < 2; i++) {
      const a = t * 1.8 + i * Math.PI;
      const tw = 0.5 + 0.5 * Math.sin(t * 5 + i * 2);
      ctx.globalAlpha = 0.35 + tw * 0.65;
      const sx = this.snap(x + Math.cos(a) * 15);
      const sy = this.snap(y + Math.sin(a) * 10 - 2);
      ctx.fillRect(sx - 1, sy, 3, 1);
      ctx.fillRect(sx, sy - 1, 1, 3);
    }
    ctx.globalAlpha = 1;
  }

  private static drawGoal(
    ctx: CanvasRenderingContext2D,
    level: LevelConfig,
    unlocked: boolean,
    accent: string
  ) {
    const goal = level.goal;
    const centerX = Math.floor(goal.x + goal.w / 2);
    const bottomY = Math.floor(goal.y + goal.h);
    const t = this.time;

    if (unlocked) {
      const beam = ctx.createLinearGradient(0, 0, 0, bottomY);
      beam.addColorStop(0, "rgba(251, 191, 36, 0)");
      beam.addColorStop(1, "rgba(251, 113, 133, 0.3)");
      ctx.fillStyle = beam;
      ctx.fillRect(centerX - 28, 0, 56, bottomY);

      const pulse = 46 + Math.sin(t * 3) * 4;
      const halo = ctx.createRadialGradient(centerX, bottomY - 40, 4, centerX, bottomY - 40, pulse);
      halo.addColorStop(0, "rgba(253, 224, 71, 0.38)");
      halo.addColorStop(1, "rgba(253, 224, 71, 0)");
      ctx.fillStyle = halo;
      ctx.fillRect(centerX - pulse, bottomY - 40 - pulse, pulse * 2, pulse * 2);
    }

    ctx.globalAlpha = unlocked ? 1 : 0.72;
    this.drawProp(ctx, PROP.ARCH, centerX, bottomY + 2, 88);
    ctx.globalAlpha = 1;

    if (unlocked) {
      for (let i = 0; i < 5; i++) {
        const ph = t * 1.2 + i * 1.7;
        const tw = 0.5 + 0.5 * Math.sin(ph * 2.3);
        const sx = this.snap(centerX + Math.sin(ph) * 30);
        const sy = this.snap(bottomY - 20 - this.mod(ph * 14, 70));
        ctx.globalAlpha = tw;
        ctx.fillStyle = "#fde68a";
        ctx.fillRect(sx - 1, sy, 3, 1);
        ctx.fillRect(sx, sy - 1, 1, 3);
      }
      ctx.globalAlpha = 1;
    }

    // Plaquinha flutuante
    const remaining = level.collectibles.filter((c) => !c.collected).length;
    const label = unlocked ? "♥ ENCONTRO ♥" : `FALTAM ${remaining} ♥`;
    const floatY = Math.sin(t * 3) * 2;
    ctx.font = "bold 11px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const tw = ctx.measureText(label).width + 16;
    const ly = goal.y - 34 + floatY;
    this.roundRect(ctx, centerX - tw / 2, ly - 10, tw, 20, 10);
    ctx.fillStyle = "rgba(18, 8, 32, 0.78)";
    ctx.fill();
    ctx.strokeStyle = unlocked ? "#fde047" : accent;
    ctx.globalAlpha = unlocked ? 1 : 0.6;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = unlocked ? "#fde047" : "#e2e8f0";
    ctx.fillText(label, centerX, ly + 0.5);
  }

  /* ================================================================ */
  /*  Personagem                                                       */
  /* ================================================================ */

  /** Descobre quais quadros são parado / corrida / pulo / queda (a folha atual tem 8). */
  private static getAnim(total: number) {
    const fall = Math.max(0, total - 1);
    const jump = Math.max(0, total - 2);
    const run: number[] = [];
    for (let i = 1; i < jump; i++) run.push(i);
    if (run.length === 0) run.push(0);
    return { idle: 0, run, jump, fall };
  }

  private static pickPlayerFrame(player: Player, total: number): number {
    const anim = this.getAnim(total);
    if (!player.isGrounded) {
      return player.vy < 60 ? anim.jump : anim.fall;
    }
    if (Math.abs(player.vx) > 15) {
      // animTimer vem do Player e só avança quando ela realmente anda
      const step = Math.floor(player.animTimer * 1.15);
      return anim.run[step % anim.run.length];
    }
    return anim.idle;
  }

  private static getBakedPlayerFrame(frameIndex: number) {
    const sheet = AssetManager.getSpriteSheet(PLAYER_SRC);
    if (!sheet || sheet.frames.length === 0) return null;
    const idle = sheet.frames[0];
    const scale = (PLAYER_HEIGHT * this.rs) / idle.h;
    const frame = sheet.frames[frameIndex];
    const baked = AssetManager.getScaledFrame(PLAYER_SRC, frameIndex, scale);
    if (!frame || !baked) return null;
    return {
      baked,
      w: baked.width / this.rs,
      h: baked.height / this.rs,
      cx: ((frame.cx ?? frame.w / 2) * baked.width) / frame.w / this.rs,
    };
  }

  private static drawPlayerShadow(
    ctx: CanvasRenderingContext2D,
    player: Player,
    platforms: Rect[]
  ) {
    const feetY = player.y + player.h;
    const cx = player.x + player.w / 2;
    let groundY = Infinity;
    for (const p of platforms) {
      if (cx > p.x + 2 && cx < p.x + p.w - 2 && p.y >= feetY - 2 && p.y < groundY) {
        groundY = p.y;
      }
    }
    if (!isFinite(groundY)) return;

    const dist = Math.max(0, groundY - feetY);
    const alpha = Math.max(0, 0.4 - dist / 320);
    if (alpha <= 0.01) return;
    const rx = Math.max(6, 13 - dist / 22);
    ctx.fillStyle = `rgba(8, 2, 16, ${alpha})`;
    ctx.beginPath();
    ctx.ellipse(this.snap(cx), groundY + 1, rx, 2.6, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  /** Cópia do quadro pintada de uma cor só (usada no rastro e no contorno). */
  private static getSilhouette(
    baked: HTMLCanvasElement,
    color: string,
    store: WeakMap<HTMLCanvasElement, HTMLCanvasElement>
  ): HTMLCanvasElement {
    let sil = store.get(baked);
    if (!sil) {
      sil = document.createElement("canvas");
      sil.width = baked.width;
      sil.height = baked.height;
      const s = sil.getContext("2d")!;
      s.drawImage(baked, 0, 0);
      s.globalCompositeOperation = "source-in";
      s.fillStyle = color;
      s.fillRect(0, 0, sil.width, sil.height);
      store.set(baked, sil);
    }
    return sil;
  }

  private static drawGhosts(ctx: CanvasRenderingContext2D, player: Player) {
    if (!player.ghosts || player.ghosts.length === 0) return;
    const sheet = AssetManager.getSpriteSheet(PLAYER_SRC);
    if (!sheet) return;
    const info = this.getBakedPlayerFrame(this.pickPlayerFrame(player, sheet.frames.length));
    if (!info) return;

    const sil = this.getSilhouette(info.baked, "#fb7185", this.silhouettes);

    for (const g of player.ghosts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, g.alpha) * 0.5;
      ctx.translate(this.snap(g.x + player.w / 2), this.snap(g.y + player.h + 1));
      ctx.scale(g.facing === "left" ? -1 : 1, 1);
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(sil, -info.cx, -info.h, info.w, info.h);
      ctx.restore();
    }
  }

  private static drawPlayer(ctx: CanvasRenderingContext2D, player: Player) {
    const sheet = AssetManager.getSpriteSheet(PLAYER_SRC);
    const info = sheet
      ? this.getBakedPlayerFrame(this.pickPlayerFrame(player, sheet.frames.length))
      : null;

    if (!info) {
      // Ainda carregando: marcador discreto no lugar da personagem
      ctx.fillStyle = "rgba(244, 63, 94, 0.55)";
      ctx.fillRect(player.x, player.y, player.w, player.h);
      return;
    }

    ctx.save();
    ctx.translate(this.snap(player.x + player.w / 2), this.snap(player.y + player.h + 1));
    ctx.scale((player.facing === "left" ? -1 : 1) * (player.scaleX ?? 1), player.scaleY ?? 1);
    ctx.imageSmoothingEnabled = true; // o quadro já foi reduzido para o tamanho final

    // Contorno claro bem fino: separa a personagem do fundo cheio de rosas
    const outline = this.getSilhouette(info.baked, "#ffe4e6", this.outlines);
    const o = 1 / this.rs;
    ctx.globalAlpha = 0.5;
    for (const [ox, oy] of [[-o, 0], [o, 0], [0, -o], [0, o]]) {
      ctx.drawImage(outline, -info.cx + ox, -info.h + oy, info.w, info.h);
    }
    ctx.globalAlpha = 1;

    ctx.drawImage(info.baked, -info.cx, -info.h, info.w, info.h);
    ctx.restore();
  }

  /* ================================================================ */
  /*  HUD                                                              */
  /* ================================================================ */

  private static drawHUD(
    ctx: CanvasRenderingContext2D,
    level: LevelConfig,
    player: Player,
    allCollected: boolean,
    accent: string
  ) {
    const W = GAME_VIEW.width;
    const total = level.collectibles.length;
    const collected = level.collectibles.filter((c) => c.collected).length;
    const pulse = this.hudPulse;

    // Contador de corações
    const px = 14;
    const py = 12;
    const pw = 22 + 24 + 46;
    this.roundRect(ctx, px, py, pw, 34, 12);
    ctx.fillStyle = "rgba(18, 8, 32, 0.74)";
    ctx.fill();
    ctx.strokeStyle = pulse > 0 ? "#fde68a" : accent;
    ctx.globalAlpha = pulse > 0 ? 1 : 0.65;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.globalAlpha = 1;

    const iconScale = 1 + pulse * 0.35;
    ctx.save();
    ctx.translate(px + 24, py + 17);
    ctx.scale(iconScale, iconScale);
    const heart = this.drawProp(ctx, PROP.HEART, 0, 11, 24);
    if (!heart) {
      ctx.fillStyle = "#fb7185";
      ctx.fillRect(-6, -6, 12, 12);
    }
    ctx.restore();

    ctx.font = "bold 15px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillText(`${collected}/${total}`, px + 44, py + 18.5);
    ctx.fillStyle = allCollected ? "#fde047" : "#ffe4e6";
    ctx.fillText(`${collected}/${total}`, px + 44, py + 17.5);

    // Barra de progresso com a personagenzinha
    const barW = 150;
    const barH = 8;
    const barX = W - barW - 34;
    const barY = 24;
    const progress = Math.min(1, Math.max(0, player.x / Math.max(1, level.worldWidth - 100)));

    this.roundRect(ctx, barX - 8, barY - 8, barW + 36, barH + 16, 10);
    ctx.fillStyle = "rgba(18, 8, 32, 0.6)";
    ctx.fill();

    this.roundRect(ctx, barX, barY, barW, barH, 4);
    ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
    ctx.fill();

    if (progress > 0.01) {
      const fillW = Math.max(barH, barW * progress);
      const fillGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
      fillGrad.addColorStop(0, accent);
      fillGrad.addColorStop(1, "#fde68a");
      this.roundRect(ctx, barX, barY, fillW, barH, 4);
      ctx.fillStyle = fillGrad;
      ctx.fill();
    }

    // Marcador: mini personagem no progresso e arco no fim
    const markX = barX + barW * progress;
    const sheet = AssetManager.getSpriteSheet(PLAYER_SRC);
    const idle = sheet?.frames[0];
    const baked = idle
      ? AssetManager.getScaledFrame(PLAYER_SRC, 0, (18 * this.rs) / idle.h)
      : null;
    if (baked) {
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(
        baked,
        this.snap(markX - baked.width / this.rs / 2),
        barY + barH + 3 - baked.height / this.rs,
        baked.width / this.rs,
        baked.height / this.rs
      );
    } else {
      ctx.fillStyle = "#fff";
      ctx.fillRect(markX - 2, barY - 3, 4, barH + 6);
    }
    ctx.fillStyle = allCollected ? "#fde047" : "rgba(255, 255, 255, 0.55)";
    ctx.font = "bold 12px ui-monospace, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("♥", barX + barW + 15, barY + barH / 2 + 0.5);

    // Aviso: arco liberado
    if (this.toastTimer > 0) {
      const a = Math.min(1, this.toastTimer / 0.6, (3.2 - this.toastTimer) / 0.25 + 0.01);
      const text = "Arco liberado! Corra até o encontro ♥";
      ctx.font = "bold 12px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
      ctx.textAlign = "center";
      const tw = ctx.measureText(text).width + 28;
      const ty = 72 - (1 - a) * 8;
      ctx.globalAlpha = Math.max(0, a);
      this.roundRect(ctx, W / 2 - tw / 2, ty - 13, tw, 26, 13);
      ctx.fillStyle = "rgba(18, 8, 32, 0.82)";
      ctx.fill();
      ctx.strokeStyle = "#fde047";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = "#fde68a";
      ctx.fillText(text, W / 2, ty + 0.5);
      ctx.globalAlpha = 1;
    }

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }
}