import { createGenerator } from "push-heal-rectangulation";
import { drawSnapshot } from "./canvasView";
import { readUiState, initControls } from "./ui";

function generate(): void {
  const state = readUiState();
  const canvas = document.querySelector<HTMLCanvasElement>("#view");
  if (!canvas) return;

  const out = createGenerator({
    size: state.size,
    seed: state.seed,
    hopStrategy: state.hopStrategy,
    includeSegments: true,
  }).run();

  drawSnapshot(canvas, out);
}

initControls(generate);
generate();
