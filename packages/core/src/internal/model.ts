export interface Vertex {
  id: number;
  x: number;
  y: number;
  active: boolean;
  up: number | null;
  down: number | null;
  left: number | null;
  right: number | null;
}

export interface Edge {
  id: number;
  a: number;
  b: number;
  ori: "h" | "v";
  active: boolean;
  topFace: number;
  bottomFace: number;
  leftFace: number;
  rightFace: number;
}

export interface Face {
  id: number;
  active: boolean;
  leftX: number;
  rightX: number;
  topY: number;
  bottomY: number;
  top: number[];
  bottom: number[];
  left: number[];
  right: number[];
}
