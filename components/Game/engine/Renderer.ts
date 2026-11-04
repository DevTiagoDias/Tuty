import { LevelConfig } from "../types/game.types";
import { Player } from "../entities/Player";

export class Renderer {
  static draw(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    level: LevelConfig,
    player: Player,
    allCollected: boolean
  ) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Background
    ctx.fillStyle = level.theme.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Plataformas
    ctx.fillStyle = level.theme.platform;
    for (const plat of level.platforms) {
      ctx.beginPath();
      ctx.roundRect(plat.x, plat.y, plat.w, plat.h, 6);
      ctx.fill();
    }

    // 3. Colecionáveis (Corações)
    for (const item of level.collectibles) {
      if (!item.collected) {
        ctx.font = "20px serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("❤️", item.x, item.y);
      }
    }

    // 4. Portal / Objetivo
    ctx.fillStyle = allCollected ? "#22c55e" : "#475569";
    ctx.beginPath();
    ctx.roundRect(level.goal.x, level.goal.y, level.goal.w, level.goal.h, 6);
    ctx.fill();

    ctx.font = "16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      allCollected ? "✨" : "🔒",
      level.goal.x + level.goal.w / 2,
      level.goal.y - 10
    );

    // 5. Player (Corpo + Olhos indicando direção `facing`)
    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.roundRect(player.x, player.y, player.w, player.h, 6);
    ctx.fill();

    // Detalhe dos olhos acompanhando `player.facing`
    ctx.fillStyle = "#0f172a";
    const eyeOffsetX = player.facing === "right" ? player.x + 16 : player.x + 6;
    ctx.fillRect(eyeOffsetX, player.y + 10, 6, 6);

    // 6. HUD Interna (Contador de Corações)
    const collectedCount = level.collectibles.filter((c) => c.collected).length;
    ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
    ctx.beginPath();
    ctx.roundRect(14, 14, 90, 32, 8);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`❤️ ${collectedCount} / ${level.collectibles.length}`, 26, 30);
  }
}