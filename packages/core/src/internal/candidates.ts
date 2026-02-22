import type { Graph } from "./graph";
import type { Endpoint } from "../public/types";

export interface Candidate {
  edgeId: number;
  endpoint: Endpoint;
  potential: number;
}

function isInternalVerticalEdge(g: Graph, edgeId: number): boolean {
  const e = g.e(edgeId);
  return !!e && e.active && e.ori === "v" && e.leftFace !== -1 && e.rightFace !== -1;
}

function isInternalHorizontalEdge(g: Graph, edgeId: number): boolean {
  const e = g.e(edgeId);
  return !!e && e.active && e.ori === "h" && e.topFace !== -1 && e.bottomFace !== -1;
}

function isInternalVerticalEndpointAtVertex(g: Graph, vid: number): boolean {
  const v = g.v(vid);
  let cnt = 0;
  if (v.up !== null) {
    const eid = g.getEdgeBetween(vid, v.up);
    if (eid !== null && isInternalVerticalEdge(g, eid)) cnt++;
  }
  if (v.down !== null) {
    const eid = g.getEdgeBetween(vid, v.down);
    if (eid !== null && isInternalVerticalEdge(g, eid)) cnt++;
  }
  return cnt === 1;
}

function isInternalHorizontalEndpointAtVertex(g: Graph, vid: number): boolean {
  const v = g.v(vid);
  let cnt = 0;
  if (v.left !== null) {
    const eid = g.getEdgeBetween(vid, v.left);
    if (eid !== null && isInternalHorizontalEdge(g, eid)) cnt++;
  }
  if (v.right !== null) {
    const eid = g.getEdgeBetween(vid, v.right);
    if (eid !== null && isInternalHorizontalEdge(g, eid)) cnt++;
  }
  return cnt === 1;
}

function hasOtherInternalVerticalEndpointOnHorizontalChain(g: Graph, vid: number): boolean {
  let cur = g.v(vid).left;
  while (cur !== null) {
    if (isInternalVerticalEndpointAtVertex(g, cur)) return true;
    cur = g.v(cur).left;
  }
  cur = g.v(vid).right;
  while (cur !== null) {
    if (isInternalVerticalEndpointAtVertex(g, cur)) return true;
    cur = g.v(cur).right;
  }
  return false;
}

function hasOtherInternalHorizontalEndpointOnVerticalChain(g: Graph, vid: number): boolean {
  let cur = g.v(vid).up;
  while (cur !== null) {
    if (isInternalHorizontalEndpointAtVertex(g, cur)) return true;
    cur = g.v(cur).up;
  }
  cur = g.v(vid).down;
  while (cur !== null) {
    if (isInternalHorizontalEndpointAtVertex(g, cur)) return true;
    cur = g.v(cur).down;
  }
  return false;
}

export function candidatePotential(g: Graph, edgeId: number): number {
  return Math.max(0, g.edgeLength(edgeId) - 1);
}

function endpointVertexId(g: Graph, edgeId: number, end: Endpoint): number {
  const e = g.e(edgeId);
  return end === "start" ? e.a : e.b;
}

export function isEndpointPushable(g: Graph, edgeId: number, end: Endpoint): boolean {
  const e = g.e(edgeId);
  if (!e.active) return false;
  if (g.isBoundaryEdge(edgeId)) return false;

  const vid = endpointVertexId(g, edgeId, end);
  const v = g.v(vid);

  // Boundary endpoint: always pushable
  if (v.x === 0 || v.x === g.N || v.y === 0 || v.y === g.N) return true;

  if (candidatePotential(g, edgeId) <= 0) return false;

  if (e.ori === "v") {
    return hasOtherInternalVerticalEndpointOnHorizontalChain(g, vid);
  } else {
    return hasOtherInternalHorizontalEndpointOnVerticalChain(g, vid);
  }
}

export function collectCandidates(g: Graph): Candidate[] {
  const result: Candidate[] = [];
  for (let i = 0; i < g.edges.length; i++) {
    const e = g.edges[i];
    if (!e.active) continue;
    if (g.isBoundaryEdge(i)) continue;
    const pot = candidatePotential(g, i);
    if (pot <= 0) continue;
    if (isEndpointPushable(g, i, "start")) result.push({ edgeId: i, endpoint: "start", potential: pot });
    if (isEndpointPushable(g, i, "end")) result.push({ edgeId: i, endpoint: "end", potential: pot });
  }
  return result;
}
