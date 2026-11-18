import { LevelConfig } from "../types/game.types";
import { Player } from "../entities/Player";
import { AssetManager, ProcessedSheet } from "./AssetManager";
import { Camera2D } from "./Camera2D";

export class Renderer {
  // Rosa detalhada em Pixel Art (11x10) para decorar o terreno e o jardim
  private static readonly ROSE_PIXEL_ART = [
    [0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0],
    [0, 0, 1, 2, 2, 1, 2, 1, 0, 0, 0],
    [0, 1, 2, 3, 3, 2, 1, 2, 1, 0, 0],
    [0, 1, 2, 3, 1, 1, 2, 2, 1, 0, 0],
    [0, 1, 1, 2, 2, 2, 1, 1, 1, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0],
    [0, 0, 0, 4, 5, 4, 0, 0, 0, 0, 0],
    [0, 0, 4, 4, 5, 0, 4, 4, 0, 0, 0],
    [0, 0, 0, 0, 5, 4, 4, 0, 0, 0, 0],
    [0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0],
  ];

  // Coração de Rubi / Cristal em Pixel Art (10x8)
  private static readonly HEART_CRYSTAL_MAP = [
    [0, 1, 1, 1, 0, 0, 1, 1, 1, 0],
    [1, 2, 3, 3, 1, 1, 2, 2, 4, 1],
    [1, 3, 3, 2, 2, 2, 2, 4, 4, 1],
    [1, 2, 2, 2, 2, 2, 4, 4, 4, 1],
    [0, 1, 2, 2, 2, 4, 4, 4, 1, 0],
    [0, 0, 1, 2, 4, 4, 4, 1, 0, 0],
    [0, 0, 0, 1, 4, 4, 1, 0, 0, 0],
    [0, 0, 0, 0, 1, 1, 0, 0, 0, 0],
  ];

  private static internalTimer = 0;

  // Carrega a folha de props independentemente de você ter salvo como partner_goal.png ou props_sheet.png
  private static getPropsSheet(): ProcessedSheet | null {
    return (
      AssetManager.getSpriteSheet("/sprites/partner_goal.png") ||
      AssetManager.getSpriteSheet("/sprites/props_sheet.png")
    );
  }

  static draw(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    level: LevelConfig,
    player: Player,
    allCollected: boolean,
    camera: Camera2D
  ) {
    this.internalTimer += 0.05;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. FUNDO PARALLAX SEAMLESS (Auto-completa espelhado sem linha de corte!)
    this.drawSeamlessSunsetParallax(ctx, canvas.width, canvas.height, camera.x);

    // 2. MUNDO DO JOGO
    ctx.save();
    ctx.translate(-Math.floor(camera.x), -Math.floor(camera.y));

    // Terreno e Plataformas em Pixel Art rica com pedras, musgo, raízes e rosas
    for (const plat of level.platforms) {
      this.drawPixelArtRoseTerrain(ctx, plat.x, plat.y, plat.w, plat.h);
    }

    // Corações colecionáveis
    for (const item of level.collectibles) {
      if (!item.collected) {
        const floatY = Math.sin(this.internalTimer * 2.5 + item.x * 0.05) * 4;
        this.drawCollectibleHeart(ctx, Math.floor(item.x), Math.floor(item.y + floatY));
      }
    }

    // Portão florido + Você esperando no final (corrige o bug de mostrar apenas o bloco)
    this.drawRoseArchGoal(ctx, level, allCollected);

    // Partículas de passos/pulo
    const dustList = (player as any).dust || [];
    for (const p of dustList) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);
    }
    ctx.globalAlpha = 1;

    // Rastro suave no ar
    for (const g of player.ghosts) {
      ctx.fillStyle = `rgba(251, 113, 133, ${g.alpha * 0.35})`;
      ctx.fillRect(Math.floor(g.x + 4), Math.floor(g.y + 4), player.w - 8, player.h - 4);
    }

    // Jogadora com recorte limpo entre os 8 frames
    this.drawPlayerSprite(ctx, player);

    ctx.restore();

    // 3. Pétalas e vaga-lumes no ar
    this.drawForegroundPetals(ctx, canvas.width, canvas.height, camera.x);

    // 4. HUD
    this.drawHUD(ctx, canvas.width, level, player);
  }

  private static drawSeamlessSunsetParallax(
    ctx: CanvasRenderingContext2D,
    viewW: number,
    viewH: number,
    camX: number
  ) {
    const bgImg = AssetManager.getRawImage("/sprites/bg_roses.png");

    if (bgImg) {
      // Técnica Mirrored Tiling: alterna blocos normais e espelhados horizontalmente
      // Assim a borda direita sempre casa 100% com a borda seguinte sem nenhum corte seco!
      const scroll = Math.floor(camX * 0.22);
      const startTile = Math.floor(scroll / viewW);
      const offsetX = -(scroll % viewW);

      for (let i = 0; i <= 1; i++) {
        const tileIndex = startTile + i;
        const drawX = offsetX + i * viewW;
        const isMirrored = Math.abs(tileIndex) % 2 === 1;

        ctx.save();
        if (isMirrored) {
          ctx.translate(drawX + viewW, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(bgImg, 0, 0, viewW, viewH);
        } else {
          ctx.drawImage(bgImg, drawX, 0, viewW, viewH);
        }
        ctx.restore();
      }
    } else {
      const bands = ["#1e1b4b", "#4c1d95", "#831843", "#be123c", "#ea580c", "#f59e0b", "#fde047"];
      const bandH = Math.ceil(viewH / bands.length);
      for (let i = 0; i < bands.length; i++) {
        ctx.fillStyle = bands[i];
        ctx.fillRect(0, i * bandH, viewW, bandH);
      }
    }

    // Silhueta suave de roseiras no rodapé em parallax intermediário (sem quadrados verdes chapados!)
    const midOffset = Math.floor(camX * 0.42);
    const propsSheet = this.getPropsSheet();

    for (let x = -(midOffset % 110) - 110; x < viewW + 110; x += 110) {
      if (propsSheet && propsSheet.frames.length >= 2) {
        const bushFrame = propsSheet.frames[1];
        const targetH = 54;
        const targetW = Math.round(targetH * (bushFrame.w / bushFrame.h));
        ctx.drawImage(
          propsSheet.canvas,
          bushFrame.x,
          bushFrame.y,
          bushFrame.w,
          bushFrame.h,
          x,
          viewH - targetH + 10,
          targetW,
          targetH
        );
      } else {
        this.drawDetailedPixelRose(ctx, x + 24, viewH - 28, 2);
        this.drawDetailedPixelRose(ctx, x + 68, viewH - 22, 2);
      }
    }
  }

  private static drawPixelArtRoseTerrain(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number
  ) {
    const propsSheet = this.getPropsSheet();

    // 1. Base de rocha e terra em Pixel Art orgânica (substitui aquela grade preta quadriculada)
    ctx.fillStyle = "#1c1317";
    ctx.fillRect(x, y + 4, w, h - 4);

    // Camadas de blocos de pedra esculpidos com variação natural
    const rowH = 14;
    for (let py = y + 8; py < y + h - 4; py += rowH) {
      const rowIdx = Math.floor((py - y) / rowH);
      const stagger = (rowIdx % 2) * 12;

      for (let px = x + 4 + stagger; px < x + w - 16; px += 28) {
        const blockW = 22;
        const blockH = Math.min(10, y + h - py - 2);
        if (blockH <= 2) continue;

        // Sombra do bloco
        ctx.fillStyle = "#120b0e";
        ctx.fillRect(px + 2, py + 2, blockW, blockH);

        // Corpo de pedra aquecido pelo pôr do sol
        ctx.fillStyle = (px + py) % 3 === 0 ? "#3b2830" : "#2e1f26";
        ctx.fillRect(px, py, blockW, blockH);

        // Brilho superior da pedra
        ctx.fillStyle = "#523842";
        ctx.fillRect(px + 2, py, blockW - 4, 2);
      }
    }

    // Bordas laterais de pedra antiga
    ctx.fillStyle = "#2b1d23";
    ctx.fillRect(x, y + 6, 4, h - 6);
    ctx.fillRect(x + w - 4, y + 6, 4, h - 6);

    // 2. Tapete de grama/musgo exuberante no topo da plataforma com luz dourada do pôr do sol
    ctx.fillStyle = "#052e16";
    ctx.fillRect(x, y + 4, w, 6);

    ctx.fillStyle = "#15803d";
    ctx.fillRect(x, y + 1, w, 5);

    // Luz alaranjada/dourada do sol batendo na relva superior
    ctx.fillStyle = "#4ade80";
    for (let gx = x + 2; gx < x + w - 4; gx += 6) {
      ctx.fillRect(gx, y, 4, 2);
    }

    // 3. Vinhas floridas penduradas pela borda da plataforma
    for (let vx = x + 6; vx < x + w - 10; vx += 18) {
      const seed = (vx * 13 + y * 7) % 5;
      const vineH = 8 + seed * 3;

      ctx.fillStyle = "#14532d";
      ctx.fillRect(vx, y + 5, 4, vineH);
      ctx.fillStyle = "#22c55e";
      ctx.fillRect(vx + 1, y + 5, 2, vineH - 2);

      // Pequenos botões de rosa pendurados nas vinhas
      if (seed % 2 === 0) {
        ctx.fillStyle = "#e11d48";
        ctx.fillRect(vx - 1, y + 5 + vineH - 3, 5, 4);
        ctx.fillStyle = "#fda4af";
        ctx.fillRect(vx, y + 5 + vineH - 2, 2, 2);
      }
    }

    // 4. Moitas de Rosas em Pixel Art decorando o topo das plataformas e do chão
    if (propsSheet && propsSheet.frames.length >= 2) {
      const bushFrame = propsSheet.frames[1];
      const flowerH = 24;
      const flowerW = Math.round(flowerH * (bushFrame.w / bushFrame.h));

      for (let rx = x + 10; rx < x + w - flowerW - 6; rx += 54) {
        ctx.drawImage(
          propsSheet.canvas,
          bushFrame.x,
          bushFrame.y,
          bushFrame.w,
          bushFrame.h,
          rx,
          y - flowerH + 8,
          flowerW,
          flowerH
        );
      }
    }

    // Intercala rosas pixel art individuais entre as moitas para ficar super vivo
    for (let rx = x + 14; rx < x + w - 22; rx += 32) {
      this.drawDetailedPixelRose(ctx, rx, y - 14, 2);
    }
  }

  private static drawCollectibleHeart(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number
  ) {
    const propsSheet = this.getPropsSheet();

    // Brilho suave ao redor do coração
    ctx.fillStyle = "rgba(251, 113, 133, 0.25)";
    ctx.fillRect(centerX - 12, centerY - 12, 24, 24);

    if (propsSheet && propsSheet.frames.length >= 3) {
      const heartFrame = propsSheet.frames[2];
      const size = 28;
      ctx.drawImage(
        propsSheet.canvas,
        heartFrame.x,
        heartFrame.y,
        heartFrame.w,
        heartFrame.h,
        centerX - size / 2,
        centerY - size / 2,
        size,
        size
      );
    } else {
      this.drawCrystalHeartMap(ctx, centerX - 15, centerY - 12, 3);
    }
  }

  private static drawRoseArchGoal(
    ctx: CanvasRenderingContext2D,
    level: LevelConfig,
    allCollected: boolean
  ) {
    const propsSheet = this.getPropsSheet();
    const centerX = level.goal.x + level.goal.w / 2;
    const bottomY = level.goal.y + level.goal.h;

    if (allCollected) {
      ctx.fillStyle = "rgba(253, 224, 71, 0.18)";
      ctx.fillRect(centerX - 28, 0, 56, bottomY);
    }

    if (propsSheet && propsSheet.frames.length > 0) {
      // Se a imagem tiver 4 itens (bloco, flores, coração, arco+parceiro), pega SEMPRE o último item (arco+parceiro)
      // Se for uma imagem de 1 único frame (apenas o parceiro), pega o índice 0
      const goalFrame = propsSheet.frames[propsSheet.frames.length - 1];
      const targetH = propsSheet.frames.length >= 3 ? 88 : 56;
      const targetW = Math.round(targetH * (goalFrame.w / goalFrame.h));

      ctx.drawImage(
        propsSheet.canvas,
        goalFrame.x,
        goalFrame.y,
        goalFrame.w,
        goalFrame.h,
        Math.floor(centerX - targetW / 2),
        Math.floor(bottomY - targetH + 4),
        targetW,
        targetH
      );
    } else {
      // Fallback caso a imagem ainda esteja carregando
      ctx.fillStyle = allCollected ? "#f43f5e" : "#475569";
      ctx.fillRect(level.goal.x, level.goal.y, level.goal.w, level.goal.h);
    }

    const bounce = Math.sin(this.internalTimer * 3) * 3;
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = allCollected ? "#fef08a" : "#fde68a";
    ctx.fillText(
      allCollected ? "🌹 ENCONTRAR 🌹" : "🔒 COLETE OS CORAÇÕES",
      centerX,
      level.goal.y - 34 + bounce
    );
  }

  private static drawPlayerSprite(ctx: CanvasRenderingContext2D, player: Player) {
    const sheet = AssetManager.getSpriteSheet("/sprites/player_sheet.png");

    if (!sheet || sheet.frames.length === 0) {
      ctx.fillStyle = "#f43f5e";
      ctx.fillRect(player.x, player.y, player.w, player.h);
      return;
    }

    const total = sheet.frames.length;
    const runTimer = (player as any).runCycleTimer ?? this.internalTimer * 2;
    let frameIndex = 0;

    if (!player.isGrounded) {
      if (total >= 7) {
        frameIndex = player.vy < 0 ? total - 2 : total - 1;
      } else {
        frameIndex = total - 1;
      }
    } else if (Math.abs(player.vx) > 20) {
      const runStart = 1;
      const runFramesCount = total >= 7 ? total - 3 : Math.max(1, total - 2);
      frameIndex = runStart + (Math.floor(runTimer) % runFramesCount);
    } else {
      frameIndex = 0;
    }

    const safeIndex = Math.min(frameIndex, total - 1);
    const frame = sheet.frames[safeIndex];

    // Margem interna de 2px (inset) para garantir que NUNCA vaze nenhum pixel do frame vizinho
    const sx = frame.x + 2;
    const sy = frame.y;
    const sw = Math.max(8, frame.w - 4);
    const sh = frame.h;

    ctx.save();
    const bottomCenterX = Math.floor(player.x + player.w / 2);
    const bottomCenterY = Math.floor(player.y + player.h);

    ctx.translate(bottomCenterX, bottomCenterY);

    const dir = player.facing === "left" ? -1 : 1;
    ctx.scale(player.scaleX * dir, player.scaleY);

    const targetHeight = 52;
    const aspect = sw / sh;
    const targetWidth = Math.round(targetHeight * aspect);

    ctx.drawImage(
      sheet.canvas,
      sx,
      sy,
      sw,
      sh,
      -Math.floor(targetWidth / 2),
      -targetHeight + 3,
      targetWidth,
      targetHeight
    );

    ctx.restore();
  }

  private static drawForegroundPetals(
    ctx: CanvasRenderingContext2D,
    viewW: number,
    viewH: number,
    camX: number
  ) {
    for (let i = 0; i < 20; i++) {
      const seed = i * 97;
      const px =
        ((seed * 13 - Math.floor(this.internalTimer * 22) - Math.floor(camX * 0.6)) %
          viewW +
          viewW) %
        viewW;
      const py =
        ((seed * 7 + Math.floor(this.internalTimer * 18)) % viewH + viewH) % viewH;

      ctx.fillStyle = i % 3 === 0 ? "#fde047" : "#fb7185";
      ctx.fillRect(px, py, 3, 3);
    }
  }

  private static drawHUD(
    ctx: CanvasRenderingContext2D,
    viewW: number,
    level: LevelConfig,
    player: Player
  ) {
    const collectedCount = level.collectibles.filter((c) => c.collected).length;
    ctx.fillStyle = "rgba(28, 25, 23, 0.85)";
    ctx.fillRect(14, 14, 110, 34);
    ctx.strokeStyle = "#fb923c";
    ctx.lineWidth = 2;
    ctx.strokeRect(14, 14, 110, 34);

    this.drawCrystalHeartMap(ctx, 22, 22, 2);

    ctx.fillStyle = "#fef3c7";
    ctx.font = "bold 14px monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`${collectedCount} / ${level.collectibles.length}`, 50, 31);

    const barW = 170;
    const barX = viewW - barW - 16;
    const barY = 25;
    const progress = Math.min(1, Math.max(0, player.x / level.goal.x));

    ctx.fillStyle = "rgba(28, 25, 23, 0.85)";
    ctx.fillRect(barX, barY, barW, 10);
    ctx.fillStyle = "#f43f5e";
    ctx.fillRect(barX, barY, Math.floor(barW * progress), 10);
    ctx.strokeStyle = "#fb923c";
    ctx.strokeRect(barX, barY, barW, 10);
  }

  private static drawDetailedPixelRose(
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    pixelSize: number
  ) {
    const palette: Record<number, string> = {
      1: "#9f1239",
      2: "#e11d48",
      3: "#fda4af",
      4: "#15803d",
      5: "#14532d",
    };

    for (let r = 0; r < this.ROSE_PIXEL_ART.length; r++) {
      for (let c = 0; c < this.ROSE_PIXEL_ART[r].length; c++) {
        const code = this.ROSE_PIXEL_ART[r][c];
        if (code !== 0) {
          ctx.fillStyle = palette[code];
          ctx.fillRect(
            startX + c * pixelSize,
            startY + r * pixelSize,
            pixelSize,
            pixelSize
          );
        }
      }
    }
  }

  private static drawCrystalHeartMap(
    ctx: CanvasRenderingContext2D,
    startX: number,
    startY: number,
    pixelSize: number
  ) {
    const palette: Record<number, string> = {
      1: "#881337",
      2: "#f43f5e",
      3: "#ffe4e6",
      4: "#be123c",
    };

    for (let r = 0; r < this.HEART_CRYSTAL_MAP.length; r++) {
      for (let c = 0; c < this.HEART_CRYSTAL_MAP[r].length; c++) {
        const code = this.HEART_CRYSTAL_MAP[r][c];
        if (code !== 0) {
          ctx.fillStyle = palette[code];
          ctx.fillRect(
            startX + c * pixelSize,
            startY + r * pixelSize,
            pixelSize,
            pixelSize
          );
        }
      }
    }
  }
}
