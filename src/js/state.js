export const scaleMax = 8;
export const scaleMin = 0.5;
export const rotateStep = 0.001;
export let scale = 1;
export let moveX = 0;
export let moveY = 0;
export let rotate = 0;
export let dirIndex = 0;
export let sceneIndex = 0;
export let isFirstRender = true;
export let alphaMode = "unpack";
export let setting = "parameters";
export let attachmentsCache = {};
export let opacities;
export let modelType = "live2d";
export let currentModel;
export let skeletons = {};
export let animationStates = [];
export let isUserSeeking = false;
export let isPaused = false;
export let currentLive2DMotion = { group: null, index: null };
export let pausedSeekProgress = 0;

export function updateScale(updater) { scale = updater(scale); }
export function updateMoveX(updater) { moveX = updater(moveX); }
export function updateMoveY(updater) { moveY = updater(moveY); }
export function updateRotate(updater) { rotate = updater(rotate); }
export function setScale(val) { scale = val; }
export function setMoveX(val) { moveX = val; }
export function setMoveY(val) { moveY = val; }
export function setRotate(val) { rotate = val; }
export function setDirIndex(val) { dirIndex = val; }
export function setSceneIndex(val) { sceneIndex = val; }
export function setFirstRenderFlag(flag) { isFirstRender = flag; }
export function setAlphaMode(val) { alphaMode = val; }
export function setSetting(val) { setting = val; }
export function setAttachmentsCache(val) { attachmentsCache = val; }
export function resetAttachmentsCache() { attachmentsCache = {}; }
export function setOpacities(val) { opacities = val; }
export function setModelType(val) { modelType = val; }
export function setCurrentModel(val) { currentModel = val; }
export function setSkeletons(val) { skeletons = val; }
export function setAnimationStates(val) { animationStates = val; }
export function setIsUserSeeking(val) { isUserSeeking = val; }
export function setIsPaused(val) { isPaused = val; }
export function setPausedSeekProgress(val) { pausedSeekProgress = val; }


