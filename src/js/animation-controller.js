import { animationController } from "./elements.js";
import { renderLive2D } from "./live2d-loader.js";
import { modelType, currentModel, skeletons, isUserSeeking, setIsUserSeeking, isPaused, setIsPaused, currentLive2DMotion, pausedSeekProgress, setPausedSeekProgress } from "./state.js";

const animationSeeker = document.getElementById("animationSeeker");
const animationTimeDisplay = document.getElementById("animationTimeDisplay");
const playPauseButton = document.getElementById("playPauseButton");
const playIcon = document.getElementById("playIcon");
const pauseIcon = document.getElementById("pauseIcon");

export function initAnimationController() {
  window.addEventListener("mousemove", (e) => {
    if (window.innerHeight - e.clientY < 80 || isUserSeeking) {
      animationController.classList.add("show");
    } else {
      animationController.classList.remove("show");
    }
  });
  animationSeeker.addEventListener("mousedown", () => {
    setIsUserSeeking(true);
    setIsPaused(true);
    updatePlayPauseUI();
    if (modelType === "live2d" && currentModel) {
      currentModel.autoUpdate = false;
    }
  });
  window.addEventListener("mouseup", () => {
    setIsUserSeeking(false);
  });
  playPauseButton.addEventListener("click", () => {
    togglePlayPause();
  });
  animationSeeker.addEventListener("input", (e) => {
    const progress = e.target.value / 100;
    setPausedSeekProgress(progress);
    seekAnimation(progress);
    const duration = getCurrentAnimationDuration();
    if (duration > 0) {
      const fps = getCurrentAnimationFPS();
      const currentTime = progress * duration;
      animationTimeDisplay.textContent = formatFrames(currentTime, duration, fps);
    }
  });
  requestAnimationFrame(updateUI);
}

function getCurrentAnimationDuration() {
  if (modelType === "spine") {
    const state = skeletons["0"]?.state;
    if (state && state.tracks[0]) {
      return state.tracks[0].animation.duration;
    }
  } else if (modelType === "live2d") {
    if (currentModel && currentModel.internalModel && currentModel.internalModel.motionManager) {
      const mqm = currentModel.internalModel.motionManager.queueManager;
      if (mqm && mqm._motions && mqm._motions.length > 0) {
        const entry = mqm._motions[0];
        const motion = entry._motion;
        if (motion) {
          return motion._loopDurationSeconds || (motion._motionData && motion._motionData.duration) || (motion.getDuration ? motion.getDuration() : 0);
        }
      }
    }
  }
  return 0;
}

function getCurrentAnimationFPS() {
  if (modelType === "spine") {
    return 30;
  } else if (modelType === "live2d") {
    if (currentModel && currentModel.internalModel && currentModel.internalModel.motionManager) {
      const mqm = currentModel.internalModel.motionManager.queueManager;
      if (mqm && mqm._motions && mqm._motions.length > 0) {
        const entry = mqm._motions[0];
        const motion = entry._motion;
        if (motion) {
          return motion._fps || (motion._motionData && motion._motionData.fps) || 30;
        }
      }
    }
  }
  return 30;
}

export function seekAnimation(progress) {
  if (modelType === "spine") {
    const state = skeletons["0"]?.state;
    const skeleton = skeletons["0"]?.skeleton;
    if (state && skeleton && state.tracks[0]) {
      const entry = state.tracks[0];
      const duration = entry.animation.duration;
      entry.trackTime = duration * progress;
      state.apply(skeleton);
      skeleton.updateWorldTransform();
    }
  } else if (modelType === "live2d") {
    if (currentModel && currentModel.internalModel && currentModel.internalModel.motionManager) {
      const mm = currentModel.internalModel.motionManager;
      const mqm = mm.queueManager;
      const entry = mqm?._motions?.[0];
      if (entry && entry._motion) {
        const motion = entry._motion;
        const duration = motion._loopDurationSeconds || (motion._motionData && motion._motionData.duration) || (motion.getDuration ? motion.getDuration() : -1);
        if (duration > 0) {
          const targetTime = progress * duration;
          const internalModel = currentModel.internalModel;
          const savedStateTime = entry._stateTimeSeconds;
          entry._startTimeSeconds = savedStateTime - targetTime;
          mm.update(internalModel.coreModel, savedStateTime);
          entry._startTimeSeconds = entry._stateTimeSeconds - targetTime;
          internalModel.coreModel.update();
          renderLive2D();
        }
      }
    }
  }
}

function updateUI() {
  if (!isUserSeeking) {
    let currentTime = 0;
    const duration = getCurrentAnimationDuration();
    if (modelType === "spine") {
      const state = skeletons["0"]?.state;
      if (state && state.tracks[0]) {
        currentTime = state.tracks[0].trackTime % (duration || 1);
        if (duration > 0) {
          animationSeeker.value = (currentTime / duration) * 100;
        }
      }
    } else if (modelType === "live2d") {
      if (currentModel && currentModel.internalModel && currentModel.internalModel.motionManager) {
        const mqm = currentModel.internalModel.motionManager.queueManager;
        if (mqm && mqm._motions && mqm._motions.length > 0) {
          const entry = mqm._motions[0];
          currentTime = (entry._stateTimeSeconds - entry._startTimeSeconds);
          if (duration > 0) {
            currentTime = ((currentTime % duration) + duration) % duration;
            animationSeeker.value = (currentTime / duration) * 100;
            if (!isPaused) {
              setPausedSeekProgress(currentTime / duration);
            }
          }
        }
      }
    }
    if (duration > 0) {
      const fps = getCurrentAnimationFPS();
      animationTimeDisplay.textContent = formatFrames(currentTime, duration, fps);
    } else {
      animationTimeDisplay.textContent = "0 / 0";
    }
  }
  requestAnimationFrame(updateUI);
}

function formatFrames(seconds, duration, fps) {
  const currentFrame = Math.floor(seconds * fps);
  const totalFrames = Math.floor(duration * fps);
  return `${currentFrame} / ${totalFrames}`;
}

function togglePlayPause() {
  const newPausedState = !isPaused;
  setIsPaused(newPausedState);
  if (modelType === "live2d" && currentModel) {
    if (!newPausedState) {
      const hasSelectedMotion = currentLive2DMotion.group !== null && currentLive2DMotion.index !== null;
      if (hasSelectedMotion) {
        currentModel.motion(currentLive2DMotion.group, currentLive2DMotion.index, 3).then(() => {
          const mm = currentModel.internalModel?.motionManager;
          const mqm = mm?.queueManager;
          const entry = mqm?._motions?.[0];
          if (entry && entry._motion) {
            const motion = entry._motion;
            const duration = motion._loopDurationSeconds || (motion._motionData && motion._motionData.duration) || (motion.getDuration ? motion.getDuration() : 0);
            if (duration > 0) {
              const targetTime = pausedSeekProgress * duration;
              entry._startTimeSeconds = entry._stateTimeSeconds - targetTime;
            }
          }
          currentModel.autoUpdate = true;
        });
      } else {
        currentModel.autoUpdate = true;
      }
    } else {
      currentModel.autoUpdate = false;
    }
  }
  updatePlayPauseUI();
}

export function resetProgress() {
  setPausedSeekProgress(0);
  animationSeeker.value = 0;
  animationTimeDisplay.textContent = "0 / 0";
}

function updatePlayPauseUI() {
  if (isPaused) {
    playIcon.style.display = "block";
    pauseIcon.style.display = "none";
  } else {
    playIcon.style.display = "none";
    pauseIcon.style.display = "block";
  }
}
