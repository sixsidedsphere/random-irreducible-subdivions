export interface UiState {
  size: number;
  seed: string;
  hopStrategy: "random" | "smallest" | "median" | "biggest";
}

export function getDefaultUiState(): UiState {
  return { size: 32, seed: "demo", hopStrategy: "random" };
}

export function readUiState(): UiState {
  const sizeInput = document.querySelector<HTMLInputElement>("#size");
  const seedInput = document.querySelector<HTMLInputElement>("#seed");
  const strategyInput = document.querySelector<HTMLSelectElement>("#strategy");

  return {
    size: sizeInput ? Number(sizeInput.value) : 32,
    seed: seedInput ? seedInput.value : "demo",
    hopStrategy: (strategyInput?.value as UiState["hopStrategy"]) ?? "random",
  };
}

export function initControls(onChange: () => void): void {
  const sizeInput = document.querySelector<HTMLInputElement>("#size");
  const sizeVal = document.querySelector<HTMLSpanElement>("#sizeVal");
  const seedInput = document.querySelector<HTMLInputElement>("#seed");
  const strategyInput = document.querySelector<HTMLSelectElement>("#strategy");
  const generateBtn = document.querySelector<HTMLButtonElement>("#generate");

  if (sizeInput && sizeVal) {
    sizeInput.addEventListener("input", () => {
      sizeVal.textContent = sizeInput.value;
    });
  }

  generateBtn?.addEventListener("click", onChange);
  seedInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") onChange();
  });
  strategyInput?.addEventListener("change", onChange);
}
