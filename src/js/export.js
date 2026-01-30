import {
  animationSelector,
  sceneSelector,
} from "./elements.js";
import { handleResize } from "./interactions.js";
import { isProcessing, setProcessing } from "./main.js";
import {
  resetModelState,
  setModelState
} from "./model-actions.js";
import {
  resizeLive2D,
  setLive2DResizeTo,
  captureFrame as captureLive2DFrame
} from "./live2d-loader.js";
import {
  captureFrame as captureSpineFrame
} from "./spine-loader.js";
import {
  animationStates,
  currentModel,
  scale,
  skeletons,
  moveX,
  moveY,
  rotate,
  modelType,
  alphaMode,
  setIsPaused,
} from "./state.js";
import {
  handleLive2DAnimationChange,
} from "./ui-controls.js";

function getSupportedMimeType() {
  const types = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm;codecs=h264",
  ];
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return "video/webm";
}

const RECORDING_BITRATE = 12000000;
const RECORDING_FRAME_RATE = 60;
let animationDuration = 0;
let recordingStartTime;
let activeCanvas;
let _prevActiveCanvasState;
let _prevAutoUpdate;
let backgroundImageToRender = null;
const progressBarContainer = document.getElementById("progressBarContainer");
const progressBar = document.getElementById("progressBar");

function parseBackgroundImageUrl(backgroundImageStyle) {
  if (!backgroundImageStyle || !backgroundImageStyle.startsWith("url")) {
    return null;
  }
  const match = backgroundImageStyle.match(/^url\(["']?(.+?)["']?\)$/);
  return match ? match[1] : null;
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image from ${url}`));
    img.src = url;
  });
}

function drawBackground(ctx, width, height, bgImage, bgColor) {
  ctx.clearRect(0, 0, width, height);
  if (bgImage) ctx.drawImage(bgImage, 0, 0, width, height);
  else if (bgColor) {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
  }
}

function downloadCanvas(canvas, animationName, suffix = "") {
  const link = document.createElement('a');
  const selectedSceneText = sceneSelector.options[sceneSelector.selectedIndex].textContent;
  const safeAnimationName = animationName ? animationName.split(".")[0] : "snapshot";
  link.download = `${selectedSceneText}_${safeAnimationName}${suffix}.png`;
  link.href = canvas.toDataURL();
  link.click();
}

function getOriginalModelSize() {
  let width, height;
  if (modelType === 'live2d') {
    width = currentModel.internalModel.originalWidth;
    height = currentModel.internalModel.originalHeight;
  } else if (modelType === "spine") {
    width = skeletons['0'].skeleton.data.width;
    height = skeletons['0'].skeleton.data.height;
  }
  return { width: Math.round(width), height: Math.round(height) };
}

async function changeToOriginalSize(compositingCanvas) {
  const prevActiveCanvasState = {
    scale: scale,
    moveX: moveX,
    moveY: moveY,
    rotate: rotate,
    width: activeCanvas.width,
    height: activeCanvas.height,
    styleWidth: activeCanvas.style.width,
    styleHeight: activeCanvas.style.height,
    display: activeCanvas.style.display,
  };
  if (modelType === 'live2d') {
    prevActiveCanvasState.live2dScale = currentModel.scale.x;
    prevActiveCanvasState.live2dPosition = { x: currentModel.position.x, y: currentModel.position.y };
  }
  const { width, height } = getOriginalModelSize();
  if (modelType === 'live2d') {
    setLive2DResizeTo(null);
    resizeLive2D(width, height);
  }
  const computedStyle = window.getComputedStyle(activeCanvas);
  const currentCssWidth = computedStyle.width;
  const currentCssHeight = computedStyle.height;
  activeCanvas.style.width = currentCssWidth;
  activeCanvas.style.height = currentCssHeight;
  activeCanvas.width = width;
  activeCanvas.height = height;
  if (compositingCanvas) {
    compositingCanvas.width = width;
    compositingCanvas.height = height;
  }
  resetModelState(width, height);
  return { prevActiveCanvasState };
}

async function restorePreviousSize(prevActiveCanvasState) {
  activeCanvas.width = prevActiveCanvasState.width;
  activeCanvas.height = prevActiveCanvasState.height;
  activeCanvas.style.width = prevActiveCanvasState.styleWidth;
  activeCanvas.style.height = prevActiveCanvasState.styleHeight;
  if (modelType === "live2d") setLive2DResizeTo(window);
  setModelState(prevActiveCanvasState.scale, prevActiveCanvasState.moveX, prevActiveCanvasState.moveY, prevActiveCanvasState.rotate);
  if (modelType === "live2d") {
    currentModel.scale.set(prevActiveCanvasState.live2dScale);
    currentModel.position.set(prevActiveCanvasState.live2dPosition.x, prevActiveCanvasState.live2dPosition.y);
    currentModel.rotation = prevActiveCanvasState.rotate;
  }
  handleResize();
}

async function exportImageOriginalSize(animationName) {
  let capturedCanvas;
  const { width: originalWidth, height: originalHeight } = getOriginalModelSize();
  if (modelType === 'live2d') {
    capturedCanvas = captureLive2DFrame(originalWidth, originalHeight);
  } else if (modelType === 'spine') {
    const originalState = { scale, moveX, moveY, rotate };
    setModelState(1, 0, 0, 0);
    capturedCanvas = captureSpineFrame(originalWidth, originalHeight);
    setModelState(originalState.scale, originalState.moveX, originalState.moveY, originalState.rotate);
  }
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = originalWidth;
  tempCanvas.height = originalHeight;
  const ctx = tempCanvas.getContext('2d');
  const backgroundColor = document.body.style.backgroundColor;
  const backgroundImage = document.body.style.backgroundImage;
  const imageUrl = parseBackgroundImageUrl(backgroundImage);
  if (imageUrl) {
    const img = await loadImage(imageUrl);
    drawBackground(ctx, originalWidth, originalHeight, img, null);
  } else {
    drawBackground(ctx, originalWidth, originalHeight, null, backgroundColor);
  }
  ctx.drawImage(capturedCanvas, 0, 0, originalWidth, originalHeight);
  downloadCanvas(tempCanvas, animationName, "_original");
}

async function exportImageWindowSize(animationName) {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = activeCanvas.width;
  tempCanvas.height = activeCanvas.height;
  const backgroundColor = document.body.style.backgroundColor;
  const ctx = tempCanvas.getContext('2d', {
    alpha: !backgroundColor,
    premultipliedAlpha: (alphaMode === "unpack" || alphaMode === "pma"),
  });
  const backgroundImage = document.body.style.backgroundImage;
  const imageUrl = parseBackgroundImageUrl(backgroundImage);
  if (imageUrl) {
    const img = await loadImage(imageUrl);
    drawBackground(ctx, activeCanvas.width, activeCanvas.height, img, null);
    ctx.drawImage(activeCanvas, 0, 0, activeCanvas.width, activeCanvas.height);
  } else {
    if (backgroundColor) {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, activeCanvas.width, activeCanvas.height);
    }
    ctx.drawImage(activeCanvas, 0, 0, activeCanvas.width, activeCanvas.height);
  }
  downloadCanvas(tempCanvas, animationName);
}

export function exportImage() {
  let animationName;
  if (modelType === "spine") animationName = animationSelector.value;
  else if (modelType === "live2d")
    animationName = animationSelector.options[animationSelector.selectedIndex].textContent;
  const live2dCanvas = document.getElementById("live2dCanvas");
  const spineCanvas = document.getElementById("spineCanvas");
  const originalSizeCheckbox = document.getElementById('originalSizeCheckbox');
  activeCanvas = modelType === 'live2d' ? live2dCanvas : spineCanvas;
  if (originalSizeCheckbox.checked) exportImageOriginalSize(animationName);
  else exportImageWindowSize(animationName);
}

export async function exportAnimation() {
  if (isProcessing) return;
  let animationName;
  if (modelType === "spine") animationName = animationSelector.value;
  else if (modelType === "live2d")
    animationName = animationSelector.options[animationSelector.selectedIndex].textContent;
  await startRecording(animationName);
}

async function startRecording(animationName) {
  setProcessing(true);
  progressBar.style.width = "0%";
  progressBarContainer.style.display = "block";
  const chunks = [];
  const live2dCanvas = document.getElementById("live2dCanvas");
  const spineCanvas = document.getElementById("spineCanvas");
  const originalSizeCheckbox = document.getElementById('originalSizeCheckbox');
  activeCanvas = modelType === "live2d" ? live2dCanvas : spineCanvas;
  const originalVisibility = activeCanvas.style.visibility;
  activeCanvas.style.visibility = "hidden";
  let compositingCanvas = null;
  let streamSource = activeCanvas;
  const cleanup = (error) => {
    if (error) console.error("Recording failed:", error);
    if (originalSizeCheckbox.checked && _prevActiveCanvasState) {
      restorePreviousSize(_prevActiveCanvasState);
    }
    activeCanvas.style.visibility = originalVisibility;
    setProcessing(false);
    progressBarContainer.style.display = "none";
    backgroundImageToRender = null;
    _prevActiveCanvasState = null;
    if (modelType === "live2d" && currentModel) {
      if (!currentModel.autoUpdate) currentModel.autoUpdate = true;
      _prevAutoUpdate = undefined;
    }
  };
  backgroundImageToRender = null;
  const backgroundColor = document.body.style.backgroundColor;
  const backgroundImage = document.body.style.backgroundImage;
  const imageUrl = parseBackgroundImageUrl(backgroundImage);
  if (imageUrl) {
    backgroundImageToRender = await loadImage(imageUrl);
    compositingCanvas = document.createElement('canvas');
    streamSource = compositingCanvas;
  } else if (backgroundColor) {
    compositingCanvas = document.createElement('canvas');
    streamSource = compositingCanvas;
  }
  if (originalSizeCheckbox.checked) {
    if (!compositingCanvas) compositingCanvas = document.createElement('canvas');
    const result = await changeToOriginalSize(compositingCanvas);
    _prevActiveCanvasState = result.prevActiveCanvasState;
  }
  if (compositingCanvas) {
    compositingCanvas.width = activeCanvas.width;
    compositingCanvas.height = activeCanvas.height;
  }
  if (modelType === "live2d") {
    _prevAutoUpdate = currentModel.autoUpdate;
    currentModel.autoUpdate = false;
    const [group, index] = animationSelector.value.split(",");
    const motion = currentModel.internalModel.motionManager.motionGroups[group]?.[index];
    if (motion) {
      if ('_loopDurationSeconds' in motion) animationDuration = motion._loopDurationSeconds;
      else if ('getDurationMSec' in motion) animationDuration = motion.getDurationMSec() / 1000;
    }
    else animationDuration = 0.1;
  } else if (modelType === "spine") {
    const track = animationStates[0] && animationStates[0].tracks[0];
    animationDuration = track.animation.duration;
    if (animationDuration <= 0) animationDuration = 0.1;
  }
  if (typeof MediaRecorder === 'undefined') {
    console.error('Video recording is not supported on this platform.');
    cleanup();
    return;
  }

  await new Promise(resolve => setTimeout(resolve, 100));

  const stream = streamSource.captureStream(RECORDING_FRAME_RATE);
  const mimeType = getSupportedMimeType();
  const rec = new MediaRecorder(stream, {
    mimeType: mimeType,
    videoBitsPerSecond: RECORDING_BITRATE,
  });

  rec.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  rec.onstop = () => {
    const blob = new Blob(chunks, { type: "video/webm" });
    if (blob.size > 0) {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const selectedSceneText = sceneSelector.options[sceneSelector.selectedIndex].textContent;
      const safeAnimationName = animationName ? animationName.split(".")[0] : "animation";
      link.download = `${selectedSceneText}_${safeAnimationName}.webm`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    }
    cleanup();
  };

  rec.onerror = (e) => {
    cleanup(e.error || new Error("MediaRecorder error"));
  };

  if (modelType === "spine") {
    for (const animationState of animationStates) {
      animationState.tracks[0].trackTime = 0;
    }
    setIsPaused(false);
    rec.start();
    recordingStartTime = performance.now();
    requestAnimationFrame(() => checkCondition(rec, compositingCanvas));
  } else if (modelType === "live2d") {
    _prevAutoUpdate = currentModel.autoUpdate;
    const [motion, index] = animationSelector.value.split(",");
    handleLive2DAnimationChange(motion, index).then(() => {
      const entry = currentModel.internalModel.motionManager?.queueManager?._motions?.[0];
      if (entry) {
        entry._startTimeSeconds = entry._stateTimeSeconds;
        if ('_loopDurationSeconds' in entry) {
          animationDuration = entry._loopDurationSeconds;
        } else if ('_motion' in entry && entry._motion) {
          const m = entry._motion;
          if ('_loopDurationSeconds' in m) {
            animationDuration = m._loopDurationSeconds;
          } else if ('getDurationMSec' in m) {
            animationDuration = m.getDurationMSec() / 1000;
          }
        }
      }
      if (!animationDuration || animationDuration <= 0.01) {
        const [group, idx] = animationSelector.value.split(",");
        const motion = currentModel.internalModel.motionManager.motionGroups[group]?.[idx];
        if (motion) {
          if ('_loopDurationSeconds' in motion) animationDuration = motion._loopDurationSeconds;
          else if ('getDurationMSec' in motion) animationDuration = motion.getDurationMSec() / 1000;
        }
        if (!animationDuration || animationDuration <= 0.01) animationDuration = 3;
      }
      currentModel.autoUpdate = true;
      let frameCount = 0;
      const checkFrame = () => {
        frameCount++;
        if (frameCount >= 5) {
          rec.start();
          recordingStartTime = performance.now();
          checkCondition(rec, compositingCanvas);
        } else {
          requestAnimationFrame(checkFrame);
        }
      };
      requestAnimationFrame(checkFrame);
    });
  }
}

function checkCondition(rec, compositingCanvas) {
  if (compositingCanvas) {
    const backgroundColor = document.body.style.backgroundColor;
    const ctx = compositingCanvas.getContext('2d', {
      alpha: !backgroundColor,
      premultipliedAlpha: (alphaMode === "unpack" || alphaMode === "pma"),
    });
    drawBackground(ctx, compositingCanvas.width, compositingCanvas.height, backgroundImageToRender, backgroundColor);
    ctx.drawImage(activeCanvas, 0, 0, compositingCanvas.width, compositingCanvas.height);
  }
  let progress = 0;
  if (modelType === "spine") {
    const track = animationStates[0].tracks[0];
    if (track.trackTime >= track.animationEnd) rec.stop();
    else {
      progress = (track.trackTime / track.animationEnd) * 100;
      requestAnimationFrame(() => checkCondition(rec, compositingCanvas));
    }
  } else if (modelType === "live2d") {
    const elapsedTime = (performance.now() - recordingStartTime) / 1000;
    if (elapsedTime >= animationDuration) rec.stop();
    else {
      progress = (elapsedTime / animationDuration) * 100;
      requestAnimationFrame(() => checkCondition(rec, compositingCanvas));
    }
  }
  progressBar.style.width = `${Math.min(progress, 100)}%`;
}
