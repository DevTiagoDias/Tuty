export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface Collectible {
  id: string;
  x: number;
  y: number;
  radius: number;
  collected: boolean;
}

export interface LevelConfig {
  id: number;
  title: string;
  subtitle: string;
  theme: {
    background: string;
    platform: string;
    accent: string;
  };
  spawn: Vector2D;
  goal: Rect;
  platforms: Rect[];
  collectibles: Collectible[];
  rewardImage: string;
  memoryText: string;
}