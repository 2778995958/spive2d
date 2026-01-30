import { animationSelector } from "./elements.js";
import { setCurrentModel, currentModel } from "./state.js";
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
  // === 加入這段：完全凍結手術 ===
  const internal = model.internalModel;

  // 1. 殺掉閒置動作 (Idle Motion)：讓它不要自動播動作
  if (internal.motionManager.groups.idle) {
      internal.motionManager.groups.idle = null;
  }

  // 2. 殺掉自動眨眼 (Eye Blink)：有些模型會自己眨眼
  internal.eyeBlink = undefined;

  // 3. 殺掉呼吸 (Breath)：這是最常見的「不動還在動」的原因
  // 呼吸是透過程式控制參數 (ParamBreath) 的正弦波，必須手動關閉
  internal.breath = undefined;

  // 4. 殺掉物理 (Physics)：防止頭髮、衣服隨重力飄動
  internal.physics = undefined;
  internal._physicsEnabled = false;
  // ============================
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

export function resizeLive2D(width, height) {
  app.renderer.resize(width, height);
}

export function setLive2DResizeTo(target) {
  app.resizeTo = target;
}

export function renderLive2D() {
  app.render();
}

export function captureFrame(width, height) {
  width = Math.round(width);
  height = Math.round(height);
  const originalScale = currentModel.scale.clone();
  const originalPosition = currentModel.position.clone();
  const scale = Math.min(
    width / currentModel.internalModel.originalWidth,
    height / currentModel.internalModel.originalHeight
  );
  currentModel.scale.set(scale);
  currentModel.position.set(width * 0.5, height * 0.5);
  const renderTexture = PIXI.RenderTexture.create({ width, height });
  app.renderer.render(currentModel, { renderTexture });
  const canvas = app.renderer.extract.canvas(renderTexture);
  currentModel.scale.copyFrom(originalScale);
  currentModel.position.copyFrom(originalPosition);
  renderTexture.destroy(true);
  return canvas;
}
