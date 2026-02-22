export interface Vertex {
  id: number;
  x: number;
  y: number;
  active: boolean;
}

export interface Edge {
  id: number;
  a: number;
  b: number;
  orientation: "h" | "v";
  active: boolean;
}

export interface Face {
  id: number;
  leftX: number;
  topY: number;
  rightX: number;
  bottomY: number;
  active: boolean;
}

export interface InternalModel {
  size: number;
  faces: Face[];
  edges: Edge[];
  vertices: Vertex[];
}
