import { animationSelector } from "./elements.js";
import { setCurrentModel } from "./state.js";
import { createAnimationSelector, createExpressionSelector, resetUI } from "./ui.js";
import { handleLive2DAnimationChange } from "./ui-controls.js";

const { convertFileSrc } = window.__TAURI__.core;

const live2dCanvas = document.getElementById("live2dCanvas");
let app = new PIXI.Application({
  view: live2dCanvas,
  resizeTo: window,
  preserveDrawingBuffer: true,
  transparent: true,
});
const {
  live2d: { Live2DModel },
} = PIXI;

export async function loadLive2DModel(dirName, fileNames) {
  live2dCanvas.style.display = "block";
  let ext = fileNames[1].includes(".moc3") ? ".model3.json" : ".json";
  const model = await Live2DModel.from(convertFileSrc(`${dirName}${fileNames[0]}${ext}`), {
    autoInteract: false,
  });
  setCurrentModel(model);
  const { innerWidth: w, innerHeight: h } = window;
  const _scale = Math.min(
    w / model.internalModel.originalWidth,
    h / model.internalModel.originalHeight
  );
  model.scale.set(_scale);
  model.anchor.set(0.5, 0.5);
  model.position.set(w * 0.5, h * 0.5);
  app.stage.addChild(model);
  const motions = model.internalModel.motionManager.definitions;
  if (motions) createAnimationSelector(motions);
  const expressions = model.internalModel.motionManager.expressionManager?.definitions;
  if (expressions) createExpressionSelector(expressions);
  const [motion, index] = animationSelector.value.split(",");
  handleLive2DAnimationChange(motion, index);
  resetUI();
}

export function disposeLive2D() {
  live2dCanvas.style.display = "none";
  app.stage.removeChildren();
}
