export interface Candidate {
  edgeId: number;
  endpoint: "start" | "end";
  potential: number;
}

export function collectCandidates(): Candidate[] {
  return [];
}
