// components/Game/engine/Renderer.ts

import { LevelConfig } from "../types/game.types";
import { Player } from "../entities/Player";
import { AssetManager } from "./AssetManager";
import { ParticleSystem } from "./ParticleSystem";

export class Renderer {
  // Mapa de pixels para desenhar corações em Pixel Art
  private static readonly HEART_PIXEL_MAP = [
    [0, 1, 1, 0, 0, 1, 1, 0],
    [1, 2, 2, 1, 1, 1, 1, 1],
    [1, 2, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 0, 0, 0],
  ];

  // Timer interno de animação caso o Player ainda não tenha animTimer
  private static internalTimer = 0;

  static draw(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    level: LevelConfig,
    player: Player,
    allCollected: boolean,
    particles?: ParticleSystem,
    time?: number
  ) {
    this.internalTimer += 0.12;
    const currentTime = time ?? this.internalTimer;

    // Mantém os pixels nítidos (sem borrado de anti-aliasing)
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Background (Se houver imagem de cenário da fase, usa ela; senão, usa o tema + montanhas pixel art)
    const bgSpritePath = (level as any).sprites?.background;
    const bgImg = bgSpritePath ? AssetManager.getSpriteSheet(bgSpritePath) : null;

    if (bgImg) {
      ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = level.theme.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      this.drawPixelMountains(ctx, canvas.width, canvas.height, level.theme.accent);
    }

    // Partículas de ambiente (se o ParticleSystem estiver ativo)
    if (particles) {
      for (const dot of particles.ambientDots) {
        ctx.fillStyle = `rgba(255, 255, 255, ${dot.alpha})`;
        ctx.fillRect(Math.floor(dot.x), Math.floor(dot.y), dot.size, dot.size);
      }
    }

    // 2. Plataformas em estilo Pixel Art
    for (const plat of level.platforms) {
      this.drawPixelPlatform(
        ctx,
        plat.x,
        plat.y,
        plat.w,
        plat.h,
        level.theme.platform,
        level.theme.accent
      );
    }

    // 3. Colecionáveis (Corações em Pixel Art com flutuação)
    for (const item of level.collectibles) {
      if (!item.collected) {
        const floatOffset = Math.sin(currentTime * 3 + item.x) * 3;
        this.drawPixelHeart(
          ctx,
          Math.floor(item.x - 12),
          Math.floor(item.y - 10 + floatOffset),
          3
        );
      }
    }

    // 4. Portal / Objetivo
    ctx.fillStyle = allCollected ? "#22c55e" : "#475569";
    ctx.fillRect(level.goal.x, level.goal.y, level.goal.w, level.goal.h);

    ctx.fillStyle = allCollected ? "#bbf7d0" : "#1e293b";
    ctx.fillRect(
      level.goal.x + 4,
      level.goal.y + 4,
      level.goal.w - 8,
      level.goal.h - 8
    );

    ctx.font = "16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      allCollected ? "✨" : "🔒",
      level.goal.x + level.goal.w / 2,
      level.goal.y - 10
    );

    // Partículas de pulo/pouso (se o ParticleSystem estiver ativo)
    if (particles) {
      for (const p of particles.particles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);
      }
      ctx.globalAlpha = 1;
    }

    // 5. Player (Desenha a Spritesheet da sua namorada em Pixel Art)
    this.drawPlayerSprite(ctx, player);

    // 6. HUD Interna (Contador de Corações em Pixel Art)
    const collectedCount = level.collectibles.filter((c) => c.collected).length;
    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.fillRect(14, 14, 96, 32);
    ctx.strokeStyle = level.theme.accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(14, 14, 96, 32);

    this.drawPixelHeart(ctx, 22, 23, 2);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 14px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`${collectedCount} / ${level.collectibles.length}`, 46, 31);
  }

  private static drawPlayerSprite(ctx: CanvasRenderingContext2D, player: Player) {
    const sheet = AssetManager.getSpriteSheet("/sprites/player_sheet.png");

    // Fallback: Enquanto a imagem carrega no primeiro frame, mostra o boneco padrão
    if (!sheet) {
      ctx.fillStyle = "#f8fafc";
      ctx.beginPath();
      ctx.roundRect(player.x, player.y, player.w, player.h, 6);
      ctx.fill();

      ctx.fillStyle = "#0f172a";
      const eyeOffsetX = player.facing === "right" ? player.x + 16 : player.x + 6;
      ctx.fillRect(eyeOffsetX, player.y + 10, 6, 6);
      return;
    }

    const totalFrames = 4;
    const frameWidth = Math.floor(sheet.width / totalFrames);
    const frameHeight = sheet.height;

    // Seleção do quadro da Spritesheet:
    // 0 = Parada (Idle) | 1 e 2 = Correndo | 3 = Pulando
    const animClock = (player as any).animTimer ?? this.internalTimer;
    let currentFrame = 0;

    if (!player.isGrounded) {
      currentFrame = 3;
    } else if (Math.abs(player.vx) > 10) {
      currentFrame = (Math.floor(animClock) % 2) + 1;
    }

    ctx.save();

    const bottomCenterX = Math.floor(player.x + player.w / 2);
    const bottomCenterY = Math.floor(player.y + player.h);

    ctx.translate(bottomCenterX, bottomCenterY);

    // Espelha horizontalmente quando ela anda para a esquerda + Squash & Stretch
    const dir = player.facing === "left" ? -1 : 1;
    const scaleX = (player as any).scaleX ?? 1;
    const scaleY = (player as any).scaleY ?? 1;
    ctx.scale(scaleX * dir, scaleY);

    // Dimensões visuais do sprite na tela
    const drawWidth = 54;
    const drawHeight = 54;

    ctx.drawImage(
      sheet,
      currentFrame * frameWidth,
      0,
      frameWidth,
      frameHeight,
      -drawWidth / 2,
      -drawHeight + 4,
      drawWidth,
      drawHeight
    );

    ctx.restore();
  }

  private static drawPixelPlatform(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    mainColor: string,
    topColor: string
  ) {
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(x, y, w, h);

    ctx.fillStyle = mainColor;
    ctx.fillRect(x, y, w, 6);
    ctx.fillRect(x, y, 4, h);
    ctx.fillRect(x + w - 4, y, 4, h);

    ctx.fillStyle = topColor;
    ctx.fillRect(x + 2, y, w - 4, 3);

    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    for (let bx = x + 8; bx < x + w - 12; bx += 16) {
      ctx.fillRect(bx, y + 8, 8, 4);
    }
  }

  private static drawPixelMountains(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    accent: string
  ) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
    const step = 16;
    for (let x = 0; x < w; x += step) {
      const mh =
        Math.floor((Math.sin(x * 0.008) * 70 + Math.cos(x * 0.02) * 35 + 130) / 8) * 8;
      ctx.fillRect(x, h - mh, step, mh);
    }

    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.12;
    for (let x = 0; x < w; x += step) {
      const mh =
        Math.floor((Math.sin(x * 0.008) * 70 + Math.cos(x * 0.02) * 35 + 130) / 8) * 8;
      ctx.fillRect(x, h - mh, step, 4);
    }
    ctx.globalAlpha = 1;
  }

  private static drawPixelHeart(
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    pixelSize: number
  ) {
    for (let row = 0; row < this.HEART_PIXEL_MAP.length; row++) {
      for (let col = 0; col < this.HEART_PIXEL_MAP[row].length; col++) {
        const val = this.HEART_PIXEL_MAP[row][col];
        if (val === 1) {
          ctx.fillStyle = "#f43f5e";
          ctx.fillRect(
            startX + col * pixelSize,
            startY + row * pixelSize,
            pixelSize,
            pixelSize
          );
        } else if (val === 2) {
          ctx.fillStyle = "#ffe4e6";
          ctx.fillRect(
            startX + col * pixelSize,
            startY + row * pixelSize,
            pixelSize,
            pixelSize
          );
        }
      }
    }
  }
}