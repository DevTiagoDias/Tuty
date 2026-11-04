import { Rect } from "../types/game.types";

export const PHYSICS_CONFIG = {
  GRAVITY: 1800,       // pixels/s²
  MAX_FALL_SPEED: 750, // velocidade terminal
  FRICTION: 0.85,
};

export class Physics {
  static applyGravity(vy: number, dt: number): number {
    return Math.min(
      vy + PHYSICS_CONFIG.GRAVITY * dt,
      PHYSICS_CONFIG.MAX_FALL_SPEED
    );
  }

  static checkAABB(a: Rect, b: Rect): boolean {
    return (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y
    );
  }

  static resolveHorizontalCollisions(entity: Rect, vx: number, platforms: Rect[]): number {
    for (const plat of platforms) {
      if (this.checkAABB(entity, plat)) {
        if (vx > 0) {
          entity.x = plat.x - entity.w;
        } else if (vx < 0) {
          entity.x = plat.x + plat.w;
        }
        return 0; // Zera velocidade horizontal ao colidir na parede
      }
    }
    return vx;
  }

  static resolveVerticalCollisions(
    entity: Rect,
    vy: number,
    platforms: Rect[]
  ): { vy: number; isGrounded: boolean } {
    let isGrounded = false;

    for (const plat of platforms) {
      if (this.checkAABB(entity, plat)) {
        if (vy > 0) {
          // Caindo sobre a plataforma
          entity.y = plat.y - entity.h;
          isGrounded = true;
        } else if (vy < 0) {
          // Batendo a cabeça embaixo da plataforma
          entity.y = plat.y + plat.h;
        }
        vy = 0;
      }
    }

    return { vy, isGrounded };
  }
}