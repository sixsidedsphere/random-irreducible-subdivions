import { createGenerator } from "push-heal-rectangulation";
import { drawSnapshot } from "./canvasView";
import { getDefaultUiState } from "./ui";

const state = getDefaultUiState();
const out = createGenerator({ size: state.size, seed: state.seed }).run();
const canvas = document.querySelector<HTMLCanvasElement>("#view");
if (canvas) drawSnapshot(canvas, out);
