// components/Game/engine/InputHandler.ts

export type InputAction = "left" | "right" | "jump";

export interface InputState {
  left: boolean;
  right: boolean;
  jump: boolean;
  jumpBufferTimer: number; // Tempo restante do buffer de pulo em segundos
}

export class InputHandler {
  public state: InputState = {
    left: false,
    right: false,
    jump: false,
    jumpBufferTimer: 0,
  };

  private readonly JUMP_BUFFER_DURATION = 0.12; // 120ms de tolerância

  // Define o estado vindo tanto do Teclado quanto do Touch
  public setAction(action: InputAction, isPressed: boolean) {
    this.state[action] = isPressed;

    if (action === "jump" && isPressed) {
      this.state.jumpBufferTimer = this.JUMP_BUFFER_DURATION;
    }
  }

  public updateTimers(dt: number) {
    if (this.state.jumpBufferTimer > 0) {
      this.state.jumpBufferTimer = Math.max(0, this.state.jumpBufferTimer - dt);
    }
  }

  public consumeJumpBuffer() {
    this.state.jumpBufferTimer = 0;
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.repeat) return;
    switch (e.code) {
      case "KeyA":
      case "ArrowLeft":
        this.setAction("left", true);
        break;
      case "KeyD":
      case "ArrowRight":
        this.setAction("right", true);
        break;
      case "KeyW":
      case "ArrowUp":
      case "Space":
        e.preventDefault();
        this.setAction("jump", true);
        break;
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    switch (e.code) {
      case "KeyA":
      case "ArrowLeft":
        this.setAction("left", false);
        break;
      case "KeyD":
      case "ArrowRight":
        this.setAction("right", false);
        break;
      case "KeyW":
      case "ArrowUp":
      case "Space":
        this.setAction("jump", false);
        break;
    }
  };

  private onWindowBlur = () => {
    // Evita que o personagem continue andando sozinho se trocar de aba ou receber notificação no celular
    this.state.left = false;
    this.state.right = false;
    this.state.jump = false;
    this.state.jumpBufferTimer = 0;
  };

  public attach() {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.onWindowBlur);
  }

  public detach() {
    window.removeEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.onWindowBlur);
  }
}