import {
  pmaSelect,
  dirSelector,
  sceneSelector,
  animationSelector,
  expressionSelector,
  settingSelector,
  filterBox,
  settingDiv,
  languageSelector,
  openDirectoryButton,
  openArchiveButton,
  openCurrentDirectoryButton,
  openExportDirectoryButton,
  openImageButton,
  removeImageButton,
  bgColorPicker,
  windowWidthInput,
  windowHeightInput,
  setOriginalSizeButton,
  resetStateButton,
} from "./elements.js";
import {
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  handleWheel,
  handleKeyboardInput,
  handleResize,
} from "./interactions.js";
import {
  handleOpenDirectory,
  handleOpenArchiveFile,
  handleOpenCurrentDirectory,
  handleOpenExportDirectory,
  handleOpenImage,
  handleRemoveImage,
} from "./io.js";
import { resetModelState } from "./model-actions.js";
import { handleAttachmentCheckboxChange, handleSkinCheckboxChange } from "./spine-ui.js";
import { setting } from "./state.js";
import { handleFilterInput } from "./ui.js";
import {
  handleLanguageSelectorChange,
  handleSettingSelectorChange,
  handleWindowWidthChange,
  handleWindowHeightChange,
  handleSetOriginalSize,
  handleColorPickerChange,
  handleDirChange,
  handleSceneChange,
  handleAnimationChange,
  handleExpressionChange,
  handleSettingMouseDown,
  handleSettingMouseOver,
  handleSettingClick,
  handleSettingMouseUp,
  handleAlphaModeChange,
  handleParameterSliderChange,
  handlePartCheckboxChange,
  handleDrawableCheckboxChange,
} from "./ui-controls.js";

export function focusBody() {
  if (document.activeElement !== document.body) {
    document.activeElement.blur();
    document.body.focus();
  }
}

function handleSettingChange(e) {
  switch (setting) {
    case "parameters":
      handleParameterSliderChange(e);
      break;
    case "parts":
      handlePartCheckboxChange(e);
      break;
    case "drawables":
      handleDrawableCheckboxChange(e);
      break;
    case "attachments":
      handleAttachmentCheckboxChange(e);
      break;
    case "skins":
      handleSkinCheckboxChange();
      break;
  }
  focusBody();
}

export function setupEventListeners() {
  window.addEventListener("contextmenu", (e) => e.preventDefault());
  window.addEventListener("resize", handleResize);
  document.addEventListener("keydown", handleKeyboardInput);
  document.addEventListener("mouseout", handleMouseUp);
  document.addEventListener("mousedown", handleMouseDown);
  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
  document.addEventListener("wheel", handleWheel);
  pmaSelect.addEventListener("change", handleAlphaModeChange);
  dirSelector.addEventListener("change", handleDirChange);
  sceneSelector.addEventListener("change", handleSceneChange);
  animationSelector.addEventListener("change", handleAnimationChange);
  expressionSelector.addEventListener("change", handleExpressionChange);
  settingSelector.addEventListener("change", handleSettingSelectorChange);
  languageSelector.addEventListener("change", handleLanguageSelectorChange);
  filterBox.addEventListener("input", handleFilterInput);
  settingDiv.addEventListener("input", handleSettingChange);
  settingDiv.addEventListener("mousedown", handleSettingMouseDown);
  settingDiv.addEventListener("mouseover", handleSettingMouseOver);
  settingDiv.addEventListener("click", handleSettingClick);
  window.addEventListener("mouseup", handleSettingMouseUp);
  openDirectoryButton.addEventListener("click", handleOpenDirectory);
  openArchiveButton.addEventListener("click", handleOpenArchiveFile);
  openCurrentDirectoryButton.addEventListener("click", handleOpenCurrentDirectory);
  openExportDirectoryButton.addEventListener("click", handleOpenExportDirectory);
  openImageButton.addEventListener("click", handleOpenImage);
  removeImageButton.addEventListener("click", handleRemoveImage);
  bgColorPicker.addEventListener("input", handleColorPickerChange);
  windowWidthInput.addEventListener("change", handleWindowWidthChange);
  windowHeightInput.addEventListener("change", handleWindowHeightChange);
  setOriginalSizeButton.addEventListener("click", handleSetOriginalSize);
  resetStateButton.addEventListener("click", resetModelState);
}
