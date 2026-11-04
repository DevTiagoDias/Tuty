// components/Game/entities/Player.ts

import { Rect, Vector2D } from "../types/game.types";
import { InputHandler } from "../engine/InputHandler";
import { Physics } from "../engine/Physics";

export class Player implements Rect {
  public x: number;
  public y: number;
  public w = 28;
  public h = 38;

  public vx = 0;
  public vy = 0;
  public isGrounded = false;
  public facing: "left" | "right" = "right";

  private readonly speed = 260;            // pixels/s
  private readonly jumpForce = -620;       // pixels/s
  private readonly variableJumpCut = 0.45; // multiplicador ao soltar o botão de pulo cedo
  private coyoteTimer = 0;
  private readonly coyoteDuration = 0.08;  // 80ms de tolerância após sair da plataforma

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
    this.coyoteTimer = 0;
    this.facing = "right";
  }

  public update(
    dt: number,
    input: InputHandler,
    platforms: Rect[],
    worldWidth: number
  ) {
    // 1. Atualiza os timers internos de input (Jump Buffer)
    input.updateTimers(dt);

    // 2. Intenção de movimento horizontal e direção do olhar
    if (input.state.left) {
      this.vx = -this.speed;
      this.facing = "left";
    } else if (input.state.right) {
      this.vx = this.speed;
      this.facing = "right";
    } else {
      this.vx = 0;
    }

    // 3. Controle de Coyote Time
    if (this.isGrounded) {
      this.coyoteTimer = this.coyoteDuration;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
    }

    // 4. Pulo (Combina Jump Buffer + Coyote Time)
    if (input.state.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      this.vy = this.jumpForce;
      this.isGrounded = false;
      this.coyoteTimer = 0;
      input.consumeJumpBuffer();
    }

    // 5. Pulo de altura variável (corta a velocidade de subida se soltar o botão)
    if (!input.state.jump && this.vy < this.jumpForce * this.variableJumpCut) {
      this.vy = this.jumpForce * this.variableJumpCut;
    }

    // 6. Aplicar movimento no eixo X + Colisão Horizontal
    this.x += this.vx * dt;
    this.vx = Physics.resolveHorizontalCollisions(this, this.vx, platforms);

    // Limites laterais do mundo/fase
    if (this.x < 0) this.x = 0;
    if (this.x + this.w > worldWidth) this.x = worldWidth - this.w;

    // 7. Aplicar Gravidade no eixo Y + Colisão Vertical
    this.vy = Physics.applyGravity(this.vy, dt);
    this.y += this.vy * dt;

    const verticalResult = Physics.resolveVerticalCollisions(this, this.vy, platforms);
    this.vy = verticalResult.vy;
    this.isGrounded = verticalResult.isGrounded;
  }
}