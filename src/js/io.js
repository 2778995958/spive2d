import { dirSelector, sceneSelector } from "./elements.js";
import { processPath, isInit } from "./main.js";

const { convertFileSrc } = window.__TAURI__.core;
const { open: tauriOpen } = window.__TAURI__.dialog;
const { openPath } = window.__TAURI__.opener;
const { downloadDir, join, dirname } = window.__TAURI__.path;

export async function handleOpenDirectory() {
  const file = await tauriOpen({
    multiple: false,
    directory: true,
  });
  if (file) processPath([file]);
}

export async function handleOpenArchiveFile() {
  const file = await tauriOpen({
    multiple: false,
    filters: [
      {
        name: "Archive",
        extensions: ["zip", "7z"],
      },
    ],
  });
  if (file) processPath([file]);
}

export async function handleOpenCurrentDirectory() {
  if (!isInit) return;
  const isWindows = navigator.userAgent.includes('Windows');
  const currentDir = dirSelector[dirSelector.selectedIndex].value;
  const sceneId = sceneSelector[sceneSelector.selectedIndex].value;
  const path = await join(currentDir, sceneId);
  const dir = await dirname(path);
  if (isWindows) await openPath(dir.replace(/\//g, "\\"));
  else await openPath(dir);
}

export async function handleOpenExportDirectory() {
  const isWindows = navigator.userAgent.includes('Windows');
  const dir = await downloadDir();
  if (isWindows) await openPath(dir.replace(/\//g, "\\"));
  else await openPath(dir);
}

export async function handleOpenImage() {
  const file = await tauriOpen({
    multiple: false,
    filters: [
      { name: "Images", extensions: ["jpg", "jpeg", "png", "gif", "webp"] },
    ],
  });
  if (!file) return;
  document.body.style.backgroundColor = "";
  document.body.style.backgroundImage = `url("${convertFileSrc(file)}")`;
  document.body.style.backgroundSize = "cover";
  document.body.style.backgroundPosition = "center";
  localStorage.setItem("spive2d_bg_image_path", file);
}

export async function handleRemoveImage() {
  document.body.style.backgroundColor = "";
  document.body.style.backgroundImage = `
    linear-gradient(45deg, #fff 25%, transparent 0),
    linear-gradient(45deg, transparent 75%, #fff 0),
    linear-gradient(45deg, #fff 25%, transparent 0),
    linear-gradient(45deg, transparent 75%, #fff 0)`;
  document.body.style.backgroundSize = "32px 32px";
  document.body.style.backgroundPosition = "0 0, 16px 16px, 16px 16px, 32px 32px";
  localStorage.removeItem("spive2d_bg_image_path");
  localStorage.removeItem("spive2d_bg_color");
}
