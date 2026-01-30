import {
  modelType,
  moveX,
  moveY,
  setMoveX,
  setMoveY,
  setRotate,
  scale,
  scaleMax,
  scaleMin,
  setScale,
  rotate,
  rotateStep,
} from "./state.js";
import {
  aspectRatioToggle,
  dialog,
  live2dCanvas,
  sidebar,
  spineCanvas,
  windowWidthInput,
  windowHeightInput,
} from "./elements.js";
import { focusBody } from "./events.js";
import { exportAnimation, exportImage, batchExportLive2D } from "./export.js";import { isInit, isProcessing } from "./main.js";
import { currentModel } from "./state.js";
import { isInit, isProcessing } from "./main.js";
import {
  nextAnimation,
  nextDir,
  nextScene,
  previousAnimation,
  previousDir,
  previousScene,
  toggleDialog
} from "./ui-controls.js";

let startX = 0;
let startY = 0;
let mouseDown = false;
let isMove = false;

const rootStyles = getComputedStyle(document.documentElement);
const sidebarWidth = Number(
  rootStyles.getPropertyValue("--sidebar-width").replace("px", "")
);
const CONTROLLER_HEIGHT = 80;


export function handleResize() {
  const { innerWidth: w, innerHeight: h } = window;
  live2dCanvas.width = w;
  live2dCanvas.height = h;
  live2dCanvas.style.width = `${w}px`;
  live2dCanvas.style.height = `${h}px`;
  spineCanvas.width = w;
  spineCanvas.height = h;
  spineCanvas.style.width = `${w}px`;
  spineCanvas.style.height = `${h}px`;
  windowWidthInput.value = w;
  windowHeightInput.value = h;
  aspectRatioToggle.value = h / w;
  if (!isInit) return;
  if (modelType === "live2d") {
    currentModel.position.set(w * 0.5 + moveX, h * 0.5 + moveY);
  }
}

export function handleKeyboardInput(e) {
  const isInputFocused = document.activeElement.matches("input");
  if (isInputFocused) return;
  if (e.key !== 'e' && !isInit) return;
  switch (e.key) {
    case "q":
      previousDir();
      break;
    case "w":
      nextDir();
      break;
    case "a":
      previousScene();
      break;
    case "s":
      nextScene();
      break;
    case "z":
      previousAnimation();
      break;
    case "x":
      nextAnimation();
      break;
    case "e":
      toggleDialog();
      break;
    case "d":
      exportImage();
      break;
    case "c":
      exportAnimation();
      break;
    case "b": 
      batchExportLive2D();
      break;
  }
  focusBody();
}

export function handleMouseOut() {
  handleMouseUp();
}

export function handleMouseDown(e) {
  if (dialog.open) return;
  if (!isInit) return;
  if (isProcessing) return;
  if (e.button === 2) return;
  startX = e.clientX;
  startY = e.clientY;
  mouseDown = true;
  isMove =
    e.clientX < live2dCanvas.width - sidebarWidth && e.clientX > sidebarWidth && (window.innerHeight - e.clientY > CONTROLLER_HEIGHT);
}


function updateSidebarStyle(e) {
  if (e.clientX <= sidebarWidth) {
    sidebar.style.visibility = "visible";
    if (modelType === "spine") {
      const spineFrameCounter = document.getElementById("spineFrameCounter");
      if (spineFrameCounter) spineFrameCounter.style.visibility = "visible";
    }
  } else {
    sidebar.style.visibility = "hidden";
    const spineFrameCounter = document.getElementById("spineFrameCounter");
    if (spineFrameCounter) spineFrameCounter.style.visibility = "hidden";
  }
}

function updateCursorStyle(e) {
  document.body.style.cursor = "default";
  if (e.clientX >= live2dCanvas.width - sidebarWidth)
    document.body.style.cursor = `url("../cursors/rotate_right.svg"), auto`;
}

export function handleMouseMove(e) {
  updateSidebarStyle(e);
  updateCursorStyle(e);
  if (!mouseDown) return;
  if (isMove) {
    setMoveX(moveX + (e.clientX - startX));
    setMoveY(moveY + (e.clientY - startY));
    if (modelType === "live2d") {
      const { innerWidth: w, innerHeight: h } = window;
      currentModel.position.set(
        w * 0.5 + moveX,
        h * 0.5 + moveY
      );
    }
  } else if (e.clientX >= live2dCanvas.width - sidebarWidth && (window.innerHeight - e.clientY > CONTROLLER_HEIGHT)) {
    const delta = (e.clientY - startY) * rotateStep * (e.clientX >= live2dCanvas.width - sidebarWidth ? 1 : -1);
    setRotate(rotate + delta);
    if (modelType === "live2d") currentModel.rotation = rotate;
  }

  startX = e.clientX;
  startY = e.clientY;
}

export function handleMouseUp() {
  mouseDown = false;
  isMove = false;
}

export function handleWheel(e) {
  if (!isInit) return;
  if (e.clientX < sidebarWidth || (window.innerHeight - e.clientY <= CONTROLLER_HEIGHT)) return;
  const baseScaleStep = 0.1;
  const scaleFactor = 0.1;
  const scaleStep = baseScaleStep + Math.abs(scale - 1) * scaleFactor;
  const newScale = Math.min(
    scaleMax,
    Math.max(scaleMin, scale - Math.sign(e.deltaY) * scaleStep)
  );
  setScale(newScale);
  if (modelType === "live2d") {
    const { innerWidth: w, innerHeight: h } = window;
    let _scale = Math.min(
      w / currentModel.internalModel.originalWidth,
      h / currentModel.internalModel.originalHeight
    );
    _scale *= scale;
    currentModel.scale.set(_scale);
  }
}


