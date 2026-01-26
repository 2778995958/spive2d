import { currentModel } from "./state.js";
import { isInit } from "./main.js";
import {
  modelType,
  setScale,
  setMoveX,
  setMoveY,
  setRotate,
} from "./state.js";

export function resetModelState() {
  setScale(1);
  setMoveX(0);
  setMoveY(0);
  setRotate(0);
  if (!isInit) return;
  if (modelType === "live2d") {
    const { innerWidth: w, innerHeight: h } = window;
    let _scale = Math.min(
      w / currentModel.internalModel.originalWidth,
      h / currentModel.internalModel.originalHeight
    );
    _scale *= 1;
    currentModel.scale.set(_scale);
    currentModel.position.set(w * 0.5, h * 0.5);
    currentModel.rotation = 0;
  }
}

export function setModelState(_scale, _moveX, _moveY, _rotate) {
  setScale(_scale);
  setMoveX(_moveX);
  setMoveY(_moveY);
  setRotate(_rotate);
}
