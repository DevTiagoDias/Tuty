import { Rect, Vector2D } from "../types/game.types";
import { InputHandler } from "../engine/InputHandler";
import { Physics } from "../engine/Physics";

export interface AfterimageGhost {
  x: number;
  y: number;
  facing: "left" | "right";
  alpha: number;
}

export class Player implements Rect {
  public x: number;
  public y: number;
  public w = 26;
  public h = 38;

  public vx = 0;
  public vy = 0;
  public isGrounded = false;
  public facing: "left" | "right" = "right";

  public scaleX = 1;
  public scaleY = 1;
  public animTimer = 0;
  public ghosts: AfterimageGhost[] = [];

  private wasGrounded = false;
  private ghostSpawnTimer = 0;

  private readonly speed = 275;
  private readonly jumpForce = -630;
  private readonly variableJumpCut = 0.45;
  private coyoteTimer = 0;
  private readonly coyoteDuration = 0.09;

  constructor(spawn: Vector2D) {
    this.x = spawn.x;
    this.y = spawn.y;
  }

  public reset(spawn: Vector2D) {
    this.x = spawn.x;
    this.y = spawn.y;
    this.vx = 0;
    this.vy = 0;
    this.isGrounded = false;
    this.wasGrounded = false;
    this.coyoteTimer = 0;
    this.scaleX = 1;
    this.scaleY = 1;
    this.facing = "right";
    this.ghosts = [];
  }

  public update(
    dt: number,
    input: InputHandler,
    platforms: Rect[],
    worldWidth: number
  ) {
    input.updateTimers(dt);
    this.wasGrounded = this.isGrounded;

    if (input.state.left) {
      this.vx = -this.speed;
      this.facing = "left";
    } else if (input.state.right) {
      this.vx = this.speed;
      this.facing = "right";
    } else {
      this.vx = 0;
    }

    if (this.isGrounded) {
      this.coyoteTimer = this.coyoteDuration;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
    }

    if (input.state.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      this.vy = this.jumpForce;
      this.isGrounded = false;
      this.coyoteTimer = 0;
      input.consumeJumpBuffer();
      this.scaleX = 0.78;
      this.scaleY = 1.26;
    }

    if (!input.state.jump && this.vy < this.jumpForce * this.variableJumpCut) {
      this.vy = this.jumpForce * this.variableJumpCut;
    }

    this.x += this.vx * dt;
    this.vx = Physics.resolveHorizontalCollisions(this, this.vx, platforms);

    if (this.x < 0) this.x = 0;
    if (this.x + this.w > worldWidth) this.x = worldWidth - this.w;

    this.vy = Physics.applyGravity(this.vy, dt);
    this.y += this.vy * dt;

    const verticalResult = Physics.resolveVerticalCollisions(this, this.vy, platforms);
    this.vy = verticalResult.vy;
    this.isGrounded = verticalResult.isGrounded;

    if (!this.wasGrounded && this.isGrounded) {
      this.scaleX = 1.28;
      this.scaleY = 0.74;
    }

    if (this.isGrounded && Math.abs(this.vx) > 10) {
      this.animTimer += dt * 10;
    } else {
      this.animTimer = 0;
    }

    const lerp = Math.min(1, 14 * dt);
    this.scaleX += (1 - this.scaleX) * lerp;
    this.scaleY += (1 - this.scaleY) * lerp;

    if (!this.isGrounded || Math.abs(this.vx) > 200) {
      this.ghostSpawnTimer -= dt;
      if (this.ghostSpawnTimer <= 0) {
        this.ghosts.push({
          x: this.x,
          y: this.y,
          facing: this.facing,
          alpha: 0.45,
        });
        this.ghostSpawnTimer = 0.055;
      }
    }

    for (let i = this.ghosts.length - 1; i >= 0; i--) {
      this.ghosts[i].alpha -= dt * 1.8;
      if (this.ghosts[i].alpha <= 0) {
        this.ghosts.splice(i, 1);
      }
    }
  }
}
