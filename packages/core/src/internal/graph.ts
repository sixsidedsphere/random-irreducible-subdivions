import type { Vertex, Edge, Face } from "./model";

type Side = "top" | "bottom" | "left" | "right";
type Dir = "up" | "down" | "left" | "right";

function pairKey(a: number, b: number): string {
  return a < b ? a + "," + b : b + "," + a;
}

function lowerBound(arr: number[], value: number, coordFn: (vid: number) => number): number {
  let lo = 0, hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (coordFn(arr[mid]) < value) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

export interface SplitFaceResult {
  cutEdgeId: number;
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
}

export interface PushResult {
  mergedFaceId: number;
  createdEdgeIds: number[];
}

export class Graph {
  readonly N: number;
  vertices: Vertex[] = [];
  edges: Edge[] = [];
  faces: Face[] = [];
  coordToVid = new Map<string, number>();
  pairToEdge = new Map<string, number>();

  constructor(N: number) { this.N = N; }

  private _vKey(x: number, y: number): string { return x + "," + y; }
  v(id: number): Vertex { return this.vertices[id]; }
  e(id: number): Edge { return this.edges[id]; }
  f(id: number): Face { return this.faces[id]; }

  hasVertexAt(x: number, y: number): boolean {
    const id = this.coordToVid.get(this._vKey(x, y));
    return id !== undefined && this.v(id).active;
  }

  vertexIdAt(x: number, y: number): number | null {
    const id = this.coordToVid.get(this._vKey(x, y));
    if (id === undefined || !this.v(id).active) return null;
    return id;
  }

  getOrCreateVertex(x: number, y: number): number {
    const k = this._vKey(x, y);
    const existing = this.coordToVid.get(k);
    if (existing !== undefined) {
      if (!this.v(existing).active) throw new Error("Inactive vertex in coord map");
      return existing;
    }
    const id = this.vertices.length;
    this.vertices.push({ id, x, y, active: true, up: null, down: null, left: null, right: null });
    this.coordToVid.set(k, id);
    return id;
  }

  private _setNeighbor(a: number, dir: Dir, b: number): void {
    const va = this.v(a);
    if (va[dir] !== null && va[dir] !== b) throw new Error("Neighbor conflict");
    va[dir] = b;
  }

  private _clearNeighborIf(a: number, dir: Dir, b: number): void {
    if (this.v(a)[dir] === b) this.v(a)[dir] = null;
  }

  addEdge(v1: number, v2: number, ori: "h" | "v", facesInfo: {
    topFace?: number; bottomFace?: number; leftFace?: number; rightFace?: number;
  }): number {
    const aV = this.v(v1), bV = this.v(v2);
    let a = v1, b = v2;
    if (ori === "h") {
      if (aV.y !== bV.y) throw new Error("H edge requires same y");
      if (aV.x === bV.x) throw new Error("Zero-length edge");
      if (aV.x > bV.x) { a = v2; b = v1; }
    } else {
      if (aV.x !== bV.x) throw new Error("V edge requires same x");
      if (aV.y === bV.y) throw new Error("Zero-length edge");
      if (aV.y > bV.y) { a = v2; b = v1; }
    }

    const key = pairKey(a, b);
    if (this.pairToEdge.has(key)) throw new Error("Edge already exists: " + key);

    const id = this.edges.length;
    const ee: Edge = {
      id, a, b, ori, active: true,
      topFace: ori === "h" ? (facesInfo.topFace ?? -1) : -1,
      bottomFace: ori === "h" ? (facesInfo.bottomFace ?? -1) : -1,
      leftFace: ori === "v" ? (facesInfo.leftFace ?? -1) : -1,
      rightFace: ori === "v" ? (facesInfo.rightFace ?? -1) : -1,
    };

    if (ori === "h") {
      this._setNeighbor(a, "right", b);
      this._setNeighbor(b, "left", a);
    } else {
      this._setNeighbor(a, "down", b);
      this._setNeighbor(b, "up", a);
    }

    this.edges.push(ee);
    this.pairToEdge.set(key, id);
    return id;
  }

  getEdgeBetween(v1: number, v2: number): number | null {
    const id = this.pairToEdge.get(pairKey(v1, v2));
    return id === undefined ? null : id;
  }

  deactivateEdge(edgeId: number): void {
    const ee = this.e(edgeId);
    if (!ee.active) return;
    ee.active = false;
    this.pairToEdge.delete(pairKey(ee.a, ee.b));
    if (ee.ori === "h") {
      this._clearNeighborIf(ee.a, "right", ee.b);
      this._clearNeighborIf(ee.b, "left", ee.a);
    } else {
      this._clearNeighborIf(ee.a, "down", ee.b);
      this._clearNeighborIf(ee.b, "up", ee.a);
    }
  }

  replaceFaceOnEdge(edgeId: number, oldFaceId: number, newFaceId: number): void {
    const ee = this.e(edgeId);
    if (!ee.active) return;
    if (ee.ori === "h") {
      if (ee.topFace === oldFaceId) ee.topFace = newFaceId;
      if (ee.bottomFace === oldFaceId) ee.bottomFace = newFaceId;
    } else {
      if (ee.leftFace === oldFaceId) ee.leftFace = newFaceId;
      if (ee.rightFace === oldFaceId) ee.rightFace = newFaceId;
    }
  }

  private _insertVertexIntoFaceChain(faceId: number, side: Side, vId: number): void {
    if (faceId === -1) return;
    const ff = this.f(faceId);
    if (!ff?.active) return;
    const vv = this.v(vId);
    const chain = ff[side];
    const coordFn = (side === "top" || side === "bottom")
      ? (vid: number) => this.v(vid).x
      : (vid: number) => this.v(vid).y;
    const value = (side === "top" || side === "bottom") ? vv.x : vv.y;
    const idx = lowerBound(chain, value, coordFn);
    if (idx < chain.length && coordFn(chain[idx]) === value) return;
    chain.splice(idx, 0, vId);
  }

  splitEdgeAt(edgeId: number, newVertexId: number): void {
    const ee = this.e(edgeId);
    if (!ee.active) throw new Error("Cannot split inactive edge");
    const { ori, a, b, topFace, bottomFace, leftFace, rightFace } = ee;
    this.deactivateEdge(edgeId);

    if (ori === "h") {
      this.addEdge(a, newVertexId, "h", { topFace, bottomFace });
      this.addEdge(newVertexId, b, "h", { topFace, bottomFace });
      if (bottomFace !== -1) this._insertVertexIntoFaceChain(bottomFace, "top", newVertexId);
      if (topFace !== -1) this._insertVertexIntoFaceChain(topFace, "bottom", newVertexId);
    } else {
      this.addEdge(a, newVertexId, "v", { leftFace, rightFace });
      this.addEdge(newVertexId, b, "v", { leftFace, rightFace });
      if (leftFace !== -1) this._insertVertexIntoFaceChain(leftFace, "right", newVertexId);
      if (rightFace !== -1) this._insertVertexIntoFaceChain(rightFace, "left", newVertexId);
    }
  }

  getOrCreateVertexOnFaceSide(faceId: number, side: Side, value: number): number {
    const ff = this.f(faceId);
    if (!ff.active) throw new Error("Face inactive");
    const coordFn = (side === "top" || side === "bottom")
      ? (vid: number) => this.v(vid).x
      : (vid: number) => this.v(vid).y;
    const chain = ff[side];

    const idx0 = lowerBound(chain, value, coordFn);
    if (idx0 < chain.length && coordFn(chain[idx0]) === value) return chain[idx0];

    let x: number, y: number;
    if (side === "top") { x = value; y = ff.topY; }
    else if (side === "bottom") { x = value; y = ff.bottomY; }
    else if (side === "left") { x = ff.leftX; y = value; }
    else { x = ff.rightX; y = value; }

    const vNew = this.getOrCreateVertex(x, y);
    const idx = lowerBound(chain, value, coordFn);
    if (idx === 0 || idx === chain.length) throw new Error("Value not within chain span");
    const vA = chain[idx - 1], vB = chain[idx];
    const eid = this.getEdgeBetween(vA, vB);
    if (eid === null) throw new Error("Missing boundary edge between chain vertices");
    this.splitEdgeAt(eid, vNew);
    return vNew;
  }

  private _reassignEdgesOnChain(oldFaceId: number, newFaceId: number, chain: number[]): void {
    for (let i = 0; i + 1 < chain.length; i++) {
      const eid = this.getEdgeBetween(chain[i], chain[i + 1]);
      if (eid === null) throw new Error("Missing edge on chain");
      this.replaceFaceOnEdge(eid, oldFaceId, newFaceId);
    }
  }

  private _reassignEdgesOnFaceBoundaryChains(oldFaceId: number, newFaceId: number): void {
    const nf = this.f(newFaceId);
    this._reassignEdgesOnChain(oldFaceId, newFaceId, nf.top);
    this._reassignEdgesOnChain(oldFaceId, newFaceId, nf.bottom);
    this._reassignEdgesOnChain(oldFaceId, newFaceId, nf.left);
    this._reassignEdgesOnChain(oldFaceId, newFaceId, nf.right);
  }

  splitFace(faceId: number, ori: "h" | "v", coord: number): SplitFaceResult {
    const ff = this.f(faceId);
    if (!ff.active) throw new Error("Face inactive");

    if (ori === "v") {
      const xSplit = coord;
      if (!(xSplit > ff.leftX && xSplit < ff.rightX)) throw new Error("Invalid vertical split coord");

      const vTop = this.getOrCreateVertexOnFaceSide(faceId, "top", xSplit);
      const vBottom = this.getOrCreateVertexOnFaceSide(faceId, "bottom", xSplit);

      const oldTop = ff.top.slice(), oldBottom = ff.bottom.slice();
      const oldLeft = ff.left.slice(), oldRight = ff.right.slice();

      const xCoord = (vid: number) => this.v(vid).x;
      const idxTop = lowerBound(oldTop, xSplit, xCoord);
      const idxBot = lowerBound(oldBottom, xSplit, xCoord);

      const leftFaceId = this.faces.length;
      const rightFaceId = this.faces.length + 1;

      const fL: Face = {
        id: leftFaceId, active: true,
        leftX: ff.leftX, rightX: xSplit, topY: ff.topY, bottomY: ff.bottomY,
        top: oldTop.slice(0, idxTop + 1),
        bottom: oldBottom.slice(0, idxBot + 1),
        left: oldLeft.slice(),
        right: [vTop, vBottom],
      };
      const fR: Face = {
        id: rightFaceId, active: true,
        leftX: xSplit, rightX: ff.rightX, topY: ff.topY, bottomY: ff.bottomY,
        top: oldTop.slice(idxTop),
        bottom: oldBottom.slice(idxBot),
        left: [vTop, vBottom],
        right: oldRight.slice(),
      };

      this.faces.push(fL, fR);
      const cutEdgeId = this.addEdge(vTop, vBottom, "v", { leftFace: leftFaceId, rightFace: rightFaceId });
      this._reassignEdgesOnFaceBoundaryChains(faceId, leftFaceId);
      this._reassignEdgesOnFaceBoundaryChains(faceId, rightFaceId);
      ff.active = false;
      return { left: leftFaceId, right: rightFaceId, cutEdgeId };
    } else {
      const ySplit = coord;
      if (!(ySplit > ff.topY && ySplit < ff.bottomY)) throw new Error("Invalid horizontal split coord");

      const vLeft = this.getOrCreateVertexOnFaceSide(faceId, "left", ySplit);
      const vRight = this.getOrCreateVertexOnFaceSide(faceId, "right", ySplit);

      const oldTop = ff.top.slice(), oldBottom = ff.bottom.slice();
      const oldLeft = ff.left.slice(), oldRight = ff.right.slice();

      const yCoord = (vid: number) => this.v(vid).y;
      const idxLeft = lowerBound(oldLeft, ySplit, yCoord);
      const idxRight = lowerBound(oldRight, ySplit, yCoord);

      const topFaceId = this.faces.length;
      const bottomFaceId = this.faces.length + 1;

      const fT: Face = {
        id: topFaceId, active: true,
        leftX: ff.leftX, rightX: ff.rightX, topY: ff.topY, bottomY: ySplit,
        top: oldTop.slice(),
        bottom: [vLeft, vRight],
        left: oldLeft.slice(0, idxLeft + 1),
        right: oldRight.slice(0, idxRight + 1),
      };
      const fB: Face = {
        id: bottomFaceId, active: true,
        leftX: ff.leftX, rightX: ff.rightX, topY: ySplit, bottomY: ff.bottomY,
        top: [vLeft, vRight],
        bottom: oldBottom.slice(),
        left: oldLeft.slice(idxLeft),
        right: oldRight.slice(idxRight),
      };

      this.faces.push(fT, fB);
      const cutEdgeId = this.addEdge(vLeft, vRight, "h", { topFace: topFaceId, bottomFace: bottomFaceId });
      this._reassignEdgesOnFaceBoundaryChains(faceId, topFaceId);
      this._reassignEdgesOnFaceBoundaryChains(faceId, bottomFaceId);
      ff.active = false;
      return { top: topFaceId, bottom: bottomFaceId, cutEdgeId };
    }
  }

  mergeFacesVertical(leftFaceId: number, rightFaceId: number): number {
    const L = this.f(leftFaceId), R = this.f(rightFaceId);
    if (!L?.active || !R?.active) throw new Error("Cannot merge inactive faces");
    if (L.rightX !== R.leftX) throw new Error("V merge: no shared boundary");
    if (L.topY !== R.topY || L.bottomY !== R.bottomY) throw new Error("V merge: different spans");

    const shared = L.right;
    if (shared.length !== R.left.length) throw new Error("Shared chain mismatch");
    for (let i = 0; i < shared.length; i++) {
      if (shared[i] !== R.left[i]) throw new Error("Shared vertex mismatch");
    }
    for (let i = 0; i + 1 < shared.length; i++) {
      const eid = this.getEdgeBetween(shared[i], shared[i + 1]);
      if (eid === null) throw new Error("Missing shared edge");
      this.deactivateEdge(eid);
    }

    const newId = this.faces.length;
    const F: Face = {
      id: newId, active: true,
      leftX: L.leftX, rightX: R.rightX, topY: L.topY, bottomY: L.bottomY,
      left: L.left.slice(),
      right: R.right.slice(),
      top: L.top.slice(),
      bottom: L.bottom.slice(),
    };
    for (let i = 1; i < R.top.length; i++) F.top.push(R.top[i]);
    for (let i = 1; i < R.bottom.length; i++) F.bottom.push(R.bottom[i]);
    this.faces.push(F);

    for (const side of ["top", "bottom", "left", "right"] as Side[]) {
      const chain = F[side];
      for (let i = 0; i + 1 < chain.length; i++) {
        const eid = this.getEdgeBetween(chain[i], chain[i + 1]);
        if (eid === null) throw new Error("Missing boundary edge on merged face");
        this.replaceFaceOnEdge(eid, leftFaceId, newId);
        this.replaceFaceOnEdge(eid, rightFaceId, newId);
      }
    }

    L.active = false;
    R.active = false;
    return newId;
  }

  mergeFacesHorizontal(topFaceId: number, bottomFaceId: number): number {
    const T = this.f(topFaceId), B = this.f(bottomFaceId);
    if (!T?.active || !B?.active) throw new Error("Cannot merge inactive faces");
    if (T.bottomY !== B.topY) throw new Error("H merge: no shared boundary");
    if (T.leftX !== B.leftX || T.rightX !== B.rightX) throw new Error("H merge: different spans");

    const shared = T.bottom;
    if (shared.length !== B.top.length) throw new Error("Shared chain mismatch");
    for (let i = 0; i < shared.length; i++) {
      if (shared[i] !== B.top[i]) throw new Error("Shared vertex mismatch");
    }
    for (let i = 0; i + 1 < shared.length; i++) {
      const eid = this.getEdgeBetween(shared[i], shared[i + 1]);
      if (eid === null) throw new Error("Missing shared edge");
      this.deactivateEdge(eid);
    }

    const newId = this.faces.length;
    const F: Face = {
      id: newId, active: true,
      leftX: T.leftX, rightX: T.rightX, topY: T.topY, bottomY: B.bottomY,
      top: T.top.slice(),
      bottom: B.bottom.slice(),
      left: T.left.slice(),
      right: T.right.slice(),
    };
    for (let i = 1; i < B.left.length; i++) F.left.push(B.left[i]);
    for (let i = 1; i < B.right.length; i++) F.right.push(B.right[i]);
    this.faces.push(F);

    for (const side of ["top", "bottom", "left", "right"] as Side[]) {
      const chain = F[side];
      for (let i = 0; i + 1 < chain.length; i++) {
        const eid = this.getEdgeBetween(chain[i], chain[i + 1]);
        if (eid === null) throw new Error("Missing boundary edge on merged face");
        this.replaceFaceOnEdge(eid, topFaceId, newId);
        this.replaceFaceOnEdge(eid, bottomFaceId, newId);
      }
    }

    T.active = false;
    B.active = false;
    return newId;
  }

  removeVertexFromFaceChains(faceId: number, vId: number): void {
    if (faceId === -1) return;
    const ff = this.f(faceId);
    if (!ff?.active) return;
    for (const side of ["top", "bottom", "left", "right"] as Side[]) {
      const chain = ff[side];
      for (let i = chain.length - 2; i >= 1; i--) {
        if (chain[i] === vId) chain.splice(i, 1);
      }
    }
  }

  simplifyVertexIfCollinear(vId: number): boolean {
    const vv = this.v(vId);
    if (!vv.active) return false;
    let degree = 0;
    if (vv.up !== null) degree++;
    if (vv.down !== null) degree++;
    if (vv.left !== null) degree++;
    if (vv.right !== null) degree++;
    if (degree !== 2) return false;

    if (vv.left !== null && vv.right !== null && vv.up === null && vv.down === null) {
      const e1 = this.getEdgeBetween(vv.left, vId);
      const e2 = this.getEdgeBetween(vId, vv.right);
      if (e1 === null || e2 === null) return false;
      const E1 = this.e(e1), E2 = this.e(e2);
      if (!E1.active || !E2.active) return false;
      if (E1.ori !== "h" || E2.ori !== "h") return false;
      if (E1.topFace !== E2.topFace || E1.bottomFace !== E2.bottomFace) return false;

      const topF = E1.topFace, botF = E1.bottomFace;
      const leftV = vv.left, rightV = vv.right;
      this.deactivateEdge(e1);
      this.deactivateEdge(e2);
      this.addEdge(leftV, rightV, "h", { topFace: topF, bottomFace: botF });
      this.removeVertexFromFaceChains(topF, vId);
      this.removeVertexFromFaceChains(botF, vId);
      vv.active = false;
      this.coordToVid.delete(this._vKey(vv.x, vv.y));
      vv.left = vv.right = vv.up = vv.down = null;
      return true;
    }

    if (vv.up !== null && vv.down !== null && vv.left === null && vv.right === null) {
      const e1 = this.getEdgeBetween(vv.up, vId);
      const e2 = this.getEdgeBetween(vId, vv.down);
      if (e1 === null || e2 === null) return false;
      const E1 = this.e(e1), E2 = this.e(e2);
      if (!E1.active || !E2.active) return false;
      if (E1.ori !== "v" || E2.ori !== "v") return false;
      if (E1.leftFace !== E2.leftFace || E1.rightFace !== E2.rightFace) return false;

      const leftF = E1.leftFace, rightF = E1.rightFace;
      const upV = vv.up, downV = vv.down;
      this.deactivateEdge(e1);
      this.deactivateEdge(e2);
      this.addEdge(upV, downV, "v", { leftFace: leftF, rightFace: rightF });
      this.removeVertexFromFaceChains(leftF, vId);
      this.removeVertexFromFaceChains(rightF, vId);
      vv.active = false;
      this.coordToVid.delete(this._vKey(vv.x, vv.y));
      vv.left = vv.right = vv.up = vv.down = null;
      return true;
    }

    return false;
  }

  simplifyQueue(vIds: (number | null)[]): void {
    for (const id of vIds) {
      if (id === null || id === undefined) continue;
      const vv = this.v(id);
      if (!vv?.active) continue;
      this.simplifyVertexIfCollinear(id);
    }
  }

  isBoundaryEdge(edgeId: number): boolean {
    const ee = this.e(edgeId);
    if (!ee.active) return true;
    if (ee.ori === "v") return ee.leftFace === -1 || ee.rightFace === -1;
    return ee.topFace === -1 || ee.bottomFace === -1;
  }

  edgeLength(edgeId: number): number {
    const ee = this.e(edgeId);
    const a = this.v(ee.a), b = this.v(ee.b);
    return ee.ori === "v" ? Math.abs(b.y - a.y) : Math.abs(b.x - a.x);
  }

  initBoundary(): void {
    const f0: Face = {
      id: 0, active: true,
      leftX: 0, rightX: this.N, topY: 0, bottomY: this.N,
      top: [], bottom: [], left: [], right: [],
    };
    const vTL = this.getOrCreateVertex(0, 0);
    const vTR = this.getOrCreateVertex(this.N, 0);
    const vBL = this.getOrCreateVertex(0, this.N);
    const vBR = this.getOrCreateVertex(this.N, this.N);

    f0.top = [vTL, vTR];
    f0.bottom = [vBL, vBR];
    f0.left = [vTL, vBL];
    f0.right = [vTR, vBR];
    this.faces.push(f0);

    this.addEdge(vTL, vTR, "h", { topFace: -1, bottomFace: 0 });
    this.addEdge(vBL, vBR, "h", { topFace: 0, bottomFace: -1 });
    this.addEdge(vTL, vBL, "v", { leftFace: -1, rightFace: 0 });
    this.addEdge(vTR, vBR, "v", { leftFace: 0, rightFace: -1 });
  }

  applyPush(edgeId: number, end: "start" | "end", newVal: number): PushResult {
    const beforeEdges = this.edges.length;
    const E = this.e(edgeId);
    if (!E.active) throw new Error("Push on inactive edge");
    if (this.isBoundaryEdge(edgeId)) throw new Error("Cannot push boundary edge");
    if (!Number.isInteger(newVal)) throw new Error("newVal must be integer");

    if (E.ori === "v") {
      const a = this.v(E.a), b = this.v(E.b);
      const yTop = Math.min(a.y, b.y), yBot = Math.max(a.y, b.y);
      if (!(newVal > yTop && newVal < yBot)) throw new Error("newVal out of edge interior");

      const fLid = E.leftFace, fRid = E.rightFace;
      if (fLid === -1 || fRid === -1) throw new Error("V edge missing adjacent faces");
      const fL = this.f(fLid), fR = this.f(fRid);
      if (!fL.active || !fR.active) throw new Error("Adjacent face inactive");

      if (end === "start") {
        if (fL.topY !== fR.topY) throw new Error("Faces not aligned at top");
      } else {
        if (fL.bottomY !== fR.bottomY) throw new Error("Faces not aligned at bottom");
      }

      const xL = fL.leftX, xR = fR.rightX;
      if (this.hasVertexAt(xL, newVal)) throw new Error("Healed endpoint on existing vertex (left)");
      if (this.hasVertexAt(xR, newVal)) throw new Error("Healed endpoint on existing vertex (right)");

      const splitL = this.splitFace(fLid, "h", newVal);
      const splitR = this.splitFace(fRid, "h", newVal);

      const mergeLeft = end === "start" ? splitL.top! : splitL.bottom!;
      const mergeRight = end === "start" ? splitR.top! : splitR.bottom!;
      const mergedId = this.mergeFacesVertical(mergeLeft, mergeRight);

      const yOld = end === "start" ? yTop : yBot;
      const vOld = this.vertexIdAt(a.x, yOld);
      if (vOld !== null) this.simplifyQueue([vOld]);

      const createdEdgeIds: number[] = [];
      for (let i = beforeEdges; i < this.edges.length; i++) {
        if (this.edges[i].active) createdEdgeIds.push(i);
      }
      return { mergedFaceId: mergedId, createdEdgeIds };
    } else {
      const a = this.v(E.a), b = this.v(E.b);
      const xLeft = Math.min(a.x, b.x), xRight = Math.max(a.x, b.x);
      if (!(newVal > xLeft && newVal < xRight)) throw new Error("newVal out of edge interior");

      const fTid = E.topFace, fBid = E.bottomFace;
      if (fTid === -1 || fBid === -1) throw new Error("H edge missing adjacent faces");
      const fT = this.f(fTid), fB = this.f(fBid);
      if (!fT.active || !fB.active) throw new Error("Adjacent face inactive");

      if (end === "start") {
        if (fT.leftX !== fB.leftX) throw new Error("Faces not aligned at left");
      } else {
        if (fT.rightX !== fB.rightX) throw new Error("Faces not aligned at right");
      }

      const yT = fT.topY, yB = fB.bottomY;
      if (this.hasVertexAt(newVal, yT)) throw new Error("Healed endpoint on existing vertex (top)");
      if (this.hasVertexAt(newVal, yB)) throw new Error("Healed endpoint on existing vertex (bottom)");

      const splitT = this.splitFace(fTid, "v", newVal);
      const splitB = this.splitFace(fBid, "v", newVal);

      const mergeTop = end === "start" ? splitT.left! : splitT.right!;
      const mergeBot = end === "start" ? splitB.left! : splitB.right!;
      const mergedId = this.mergeFacesHorizontal(mergeTop, mergeBot);

      const xOld = end === "start" ? xLeft : xRight;
      const vOld = this.vertexIdAt(xOld, a.y);
      if (vOld !== null) this.simplifyQueue([vOld]);

      const createdEdgeIds: number[] = [];
      for (let i = beforeEdges; i < this.edges.length; i++) {
        if (this.edges[i].active) createdEdgeIds.push(i);
      }
      return { mergedFaceId: mergedId, createdEdgeIds };
    }
  }
}
