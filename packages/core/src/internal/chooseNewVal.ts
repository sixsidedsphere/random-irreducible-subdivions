import type { Graph } from "./graph";
import type { HopStrategy, Endpoint, Rng } from "../public/types";

function buildForbiddenListVertical(g: Graph, leftFaceId: number, rightFaceId: number, yMin: number, yMax: number): number[] {
  const forb = new Set<number>();
  for (const vid of g.f(leftFaceId).left) {
    const y = g.v(vid).y;
    if (y >= yMin && y <= yMax) forb.add(y);
  }
  for (const vid of g.f(rightFaceId).right) {
    const y = g.v(vid).y;
    if (y >= yMin && y <= yMax) forb.add(y);
  }
  return Array.from(forb).sort((a, b) => a - b);
}

function buildForbiddenListHorizontal(g: Graph, topFaceId: number, bottomFaceId: number, xMin: number, xMax: number): number[] {
  const forb = new Set<number>();
  for (const vid of g.f(topFaceId).top) {
    const x = g.v(vid).x;
    if (x >= xMin && x <= xMax) forb.add(x);
  }
  for (const vid of g.f(bottomFaceId).bottom) {
    const x = g.v(vid).x;
    if (x >= xMin && x <= xMax) forb.add(x);
  }
  return Array.from(forb).sort((a, b) => a - b);
}

function buildAllowedIntervals(minV: number, maxV: number, forbiddenSorted: number[]): [number, number][] {
  const intervals: [number, number][] = [];
  let cur = minV;
  for (const f of forbiddenSorted) {
    if (f < cur) continue;
    if (f > maxV) break;
    if (f > cur) intervals.push([cur, f - 1]);
    cur = f + 1;
  }
  if (cur <= maxV) intervals.push([cur, maxV]);
  return intervals;
}

function intervalsCount(intervals: [number, number][]): number {
  let total = 0;
  for (const [a, b] of intervals) total += b - a + 1;
  return total;
}

function selectKthFromIntervals(intervals: [number, number][], k: number): number | null {
  for (const [a, b] of intervals) {
    const len = b - a + 1;
    if (k < len) return a + k;
    k -= len;
  }
  return null;
}

function pickFirstValidFromIntervals(intervals: [number, number][], isBad: (v: number) => boolean): number | null {
  for (const [a, b] of intervals) {
    for (let v = a; v <= b; v++) {
      if (!isBad(v)) return v;
    }
  }
  return null;
}

function pickLastValidFromIntervals(intervals: [number, number][], isBad: (v: number) => boolean): number | null {
  for (let i = intervals.length - 1; i >= 0; i--) {
    const [a, b] = intervals[i];
    for (let v = b; v >= a; v--) {
      if (!isBad(v)) return v;
    }
  }
  return null;
}

export function chooseNewValForCandidate(
  g: Graph, edgeId: number, end: Endpoint, strategy: HopStrategy, rng: Rng,
): number | null {
  const e = g.e(edgeId);
  if (!e.active) return null;

  if (e.ori === "v") {
    const a = g.v(e.a), b = g.v(e.b);
    const yTop = Math.min(a.y, b.y), yBot = Math.max(a.y, b.y);
    const yMin = yTop + 1, yMax = yBot - 1;
    if (yMin > yMax) return null;

    const fLid = e.leftFace, fRid = e.rightFace;
    if (fLid === -1 || fRid === -1) return null;
    const fL = g.f(fLid), fR = g.f(fRid);
    if (!fL.active || !fR.active) return null;
    if (end === "start") { if (fL.topY !== fR.topY) return null; }
    else { if (fL.bottomY !== fR.bottomY) return null; }

    const xL = fL.leftX, xR = fR.rightX;
    const forbidden = buildForbiddenListVertical(g, fLid, fRid, yMin, yMax);
    const intervals = buildAllowedIntervals(yMin, yMax, forbidden);
    const total = intervalsCount(intervals);
    if (total <= 0) return null;

    const isBad = (y: number) => g.hasVertexAt(xL, y) || g.hasVertexAt(xR, y);

    if (strategy === "smallest") {
      return end === "start" ? pickFirstValidFromIntervals(intervals, isBad) : pickLastValidFromIntervals(intervals, isBad);
    }
    if (strategy === "biggest") {
      return end === "start" ? pickLastValidFromIntervals(intervals, isBad) : pickFirstValidFromIntervals(intervals, isBad);
    }
    if (strategy === "median") {
      const mid = Math.floor((total - 1) / 2);
      const idxAsc = end === "start" ? mid : total - 1 - mid;
      let y = selectKthFromIntervals(intervals, idxAsc);
      if (y === null) return null;
      if (isBad(y)) y = pickFirstValidFromIntervals(intervals, isBad);
      return y;
    }

    for (let tries = 0; tries < 8; tries++) {
      const r = Math.floor(rng.nextFloat() * total);
      const y = selectKthFromIntervals(intervals, r);
      if (y !== null && !isBad(y)) return y;
    }
    return pickFirstValidFromIntervals(intervals, isBad);
  }

  // Horizontal edge
  const a = g.v(e.a), b = g.v(e.b);
  const xLeft = Math.min(a.x, b.x), xRight = Math.max(a.x, b.x);
  const xMin = xLeft + 1, xMax = xRight - 1;
  if (xMin > xMax) return null;

  const fTid = e.topFace, fBid = e.bottomFace;
  if (fTid === -1 || fBid === -1) return null;
  const fT = g.f(fTid), fB = g.f(fBid);
  if (!fT.active || !fB.active) return null;
  if (end === "start") { if (fT.leftX !== fB.leftX) return null; }
  else { if (fT.rightX !== fB.rightX) return null; }

  const yT = fT.topY, yB = fB.bottomY;
  const forbidden = buildForbiddenListHorizontal(g, fTid, fBid, xMin, xMax);
  const intervals = buildAllowedIntervals(xMin, xMax, forbidden);
  const total = intervalsCount(intervals);
  if (total <= 0) return null;

  const isBad = (x: number) => g.hasVertexAt(x, yT) || g.hasVertexAt(x, yB);

  if (strategy === "smallest") {
    return end === "start" ? pickFirstValidFromIntervals(intervals, isBad) : pickLastValidFromIntervals(intervals, isBad);
  }
  if (strategy === "biggest") {
    return end === "start" ? pickLastValidFromIntervals(intervals, isBad) : pickFirstValidFromIntervals(intervals, isBad);
  }
  if (strategy === "median") {
    const mid = Math.floor((total - 1) / 2);
    const idxAsc = end === "start" ? mid : total - 1 - mid;
    let x = selectKthFromIntervals(intervals, idxAsc);
    if (x === null) return null;
    if (isBad(x)) x = pickFirstValidFromIntervals(intervals, isBad);
    return x;
  }

  for (let tries = 0; tries < 8; tries++) {
    const r = Math.floor(rng.nextFloat() * total);
    const x = selectKthFromIntervals(intervals, r);
    if (x !== null && !isBad(x)) return x;
  }
  return pickFirstValidFromIntervals(intervals, isBad);
}

export function canApplyPush(g: Graph, edgeId: number, end: Endpoint, newVal: number): boolean {
  const E = g.e(edgeId);
  if (!E?.active) return false;
  if (g.isBoundaryEdge(edgeId)) return false;
  if (!Number.isInteger(newVal)) return false;

  if (E.ori === "v") {
    const a = g.v(E.a), b = g.v(E.b);
    const yTop = Math.min(a.y, b.y), yBot = Math.max(a.y, b.y);
    if (!(newVal > yTop && newVal < yBot)) return false;
    const fLid = E.leftFace, fRid = E.rightFace;
    if (fLid === -1 || fRid === -1) return false;
    const fL = g.f(fLid), fR = g.f(fRid);
    if (!fL.active || !fR.active) return false;
    if (end === "start") { if (fL.topY !== fR.topY) return false; }
    else { if (fL.bottomY !== fR.bottomY) return false; }
    return !g.hasVertexAt(fL.leftX, newVal) && !g.hasVertexAt(fR.rightX, newVal);
  }

  const a = g.v(E.a), b = g.v(E.b);
  const xLeft = Math.min(a.x, b.x), xRight = Math.max(a.x, b.x);
  if (!(newVal > xLeft && newVal < xRight)) return false;
  const fTid = E.topFace, fBid = E.bottomFace;
  if (fTid === -1 || fBid === -1) return false;
  const fT = g.f(fTid), fB = g.f(fBid);
  if (!fT.active || !fB.active) return false;
  if (end === "start") { if (fT.leftX !== fB.leftX) return false; }
  else { if (fT.rightX !== fB.rightX) return false; }
  return !g.hasVertexAt(newVal, fT.topY) && !g.hasVertexAt(newVal, fB.bottomY);
}
