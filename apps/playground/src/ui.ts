export interface UiState {
  size: number;
  seed: string;
}

export function getDefaultUiState(): UiState {
  return { size: 32, seed: "demo" };
}
