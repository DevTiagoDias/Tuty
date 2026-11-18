import { Rect } from "../types/game.types";

export class Camera2D {
  public x = 0;
  public y = 0;

  constructor(
    public viewportWidth: number,
    public viewportHeight: number
  ) {}

  public follow(target: Rect, worldWidth: number, dt: number) {
    const targetX = target.x + target.w / 2 - this.viewportWidth * 0.35;
    const clampedTargetX = Math.max(
      0,
      Math.min(targetX, Math.max(0, worldWidth - this.viewportWidth))
    );

    const smoothSpeed = 8;
    this.x += (clampedTargetX - this.x) * Math.min(1, smoothSpeed * dt);
  }

  public reset() {
    this.x = 0;
    this.y = 0;
  }
}
