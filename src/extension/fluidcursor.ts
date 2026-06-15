import { isMobile } from '../modules/env';
import { saveConfig, loadConfig } from '../main/data';
import type { Config } from '../main/data';
let animationFrameId: number | null = null;
let resizeHandler: (() => void) | null = null;
let mouseMoveHandler: ((e: MouseEvent) => void) | null = null;
let mouseDownHandler: ((e: MouseEvent) => void) | null = null;
let mouseUpHandler: ((e: MouseEvent) => void) | null = null;
let mouseLeaveHandler: (() => void) | null = null;
let hideCursorTimeout: number | null = null;
let points: { x: number; y: number }[] = [];
let mouse = { x: -100, y: -100 };
let lastTime = 0;
let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let isFirstMouseMove = true;
let isCursorVisible = false;
let isMouseDown = false;
let currentHueOffset = 0;
let targetHueOffset = 0;
let cachedDisplayColor = '#f44336';
let cachedBaseColor = '';
function getCursorColor(): string {
  const computedStyle = getComputedStyle(document.documentElement);
  const color = computedStyle.getPropertyValue('--b3-theme-primary').trim();
  return color || '#f44336';
}
function updateDisplayColor(): void {
  const baseColor = getCursorColor();
  if (baseColor !== cachedBaseColor) {
    cachedBaseColor = baseColor;
  }
  const baseHue = isMouseDown ? 180 : 0;
  cachedDisplayColor = `oklch(from ${baseColor} l c calc(h + ${baseHue} + ${currentHueOffset}))`;
}
function randomCursorColor(): void {
  const modeRand = Math.random();
  const baseColor = getCursorColor();
  if (baseColor !== cachedBaseColor) {
    cachedBaseColor = baseColor;
  }
  let randomHue: number;
  if (modeRand < 0.05) {
    const rand = Math.random();
    if (rand < 0.8) {
      randomHue = Math.floor(Math.random() * 31) - 15;
    } else if (rand < 0.9) {
      const sign = Math.random() < 0.5 ? -1 : 1;
      randomHue = sign * (Math.floor(Math.random() * 31) + 30);
    } else {
      const sign = Math.random() < 0.5 ? -1 : 1;
      randomHue = sign * (Math.floor(Math.random() * 91) + 90);
    }
    const baseHue = isMouseDown ? 180 : 0;
    cachedDisplayColor = `oklch(from ${baseColor} l c calc(h + ${baseHue} + ${randomHue}))`;
    currentHueOffset = randomHue;
    targetHueOffset = randomHue;
  } else {
    const rand = Math.random();
    if (rand < 0.6) {
      randomHue = Math.floor(Math.random() * 31) - 15;
    } else if (rand < 0.8) {
      const sign = Math.random() < 0.5 ? -1 : 1;
      randomHue = sign * (Math.floor(Math.random() * 31) + 30);
    } else {
      const sign = Math.random() < 0.5 ? -1 : 1;
      randomHue = sign * (Math.floor(Math.random() * 91) + 90);
    }
    targetHueOffset = randomHue;
  }
}
function startFluidCursor(): void {
  const existingCanvas = document.getElementById('neo-fluid-cursor-canvas');
  if (existingCanvas) {
    existingCanvas.remove();
  }
  canvas = document.createElement('canvas');
  canvas.id = 'neo-fluid-cursor-canvas';
  Object.assign(canvas.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    pointerEvents: 'none',
    zIndex: '999999',
    opacity: '0',
  });
  document.body.appendChild(canvas);
  ctx = canvas.getContext('2d');
  isMouseDown = false;
  cachedBaseColor = getCursorColor();
  randomCursorColor();
  mouse = { x: -100, y: -100 };
  points = [];
  isFirstMouseMove = true;
  isCursorVisible = false;
  function resize(): void {
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
  }
  resizeHandler = resize;
  resize();
  mouseMoveHandler = (e: MouseEvent) => {
    if (isFirstMouseMove) {
      isFirstMouseMove = false;
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      for (let i = 0; i < 8; i++) {
        points.push({ x: mouse.x, y: mouse.y });
      }
    } else {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }
    randomCursorColor();
    if (!isCursorVisible && canvas) {
      isCursorVisible = true;
      canvas.style.transition = 'none';
      canvas.style.opacity = '1';
    }
    if (hideCursorTimeout !== null) {
      clearTimeout(hideCursorTimeout);
    }
    hideCursorTimeout = window.setTimeout(() => {
      isCursorVisible = false;
      if (canvas) {
        canvas.style.transition = 'opacity 300ms ease-out';
        canvas.style.opacity = '0';
      }
    }, 200);
  };
  window.addEventListener('resize', resizeHandler);
  window.addEventListener('mousemove', mouseMoveHandler, { passive: true });
  mouseDownHandler = () => {
    isMouseDown = true;
  };
  mouseUpHandler = () => {
    isMouseDown = false;
    targetHueOffset = 0;
  };
  window.addEventListener('mousedown', mouseDownHandler, { passive: true });
  window.addEventListener('mouseup', mouseUpHandler, { passive: true });
  mouseLeaveHandler = () => {
    points = [];
    isFirstMouseMove = true;
  };
  document.addEventListener('mouseleave', mouseLeaveHandler);
  function animate(currentTime: number): void {
    if (!canvas || !ctx) return;
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    const timeFactor = Math.min(deltaTime * 60, 3);
    const diff = targetHueOffset - currentHueOffset;
    if (Math.abs(diff) > 0.5) {
      currentHueOffset += diff * 0.08 * timeFactor;
    } else {
      currentHueOffset = targetHueOffset;
    }
    updateDisplayColor();
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    if (isFirstMouseMove) {
      animationFrameId = window.requestAnimationFrame(animate);
      return;
    }
    const actualHeadEase = 1 - Math.pow(1 - 0.9, timeFactor);
    const actualTailEase = 1 - Math.pow(1 - 0.4, timeFactor);
    points[0].x += (mouse.x - points[0].x) * actualHeadEase;
    points[0].y += (mouse.y - points[0].y) * actualHeadEase;
    for (let i = 1; i < points.length; i++) {
      points[i].x += (points[i - 1].x - points[i].x) * actualTailEase;
      points[i].y += (points[i - 1].y - points[i].y) * actualTailEase;
    }
    ctx.strokeStyle = cachedDisplayColor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (let i = 0; i < points.length - 1; i++) {
      const width = Math.max(0, 6 - (i * 1.2));
      ctx.beginPath();
      ctx.lineWidth = width;
      ctx.moveTo(points[i].x, points[i].y);
      ctx.lineTo(points[i + 1].x, points[i + 1].y);
      ctx.stroke();
    }
    animationFrameId = window.requestAnimationFrame(animate);
  }
  lastTime = performance.now();
  animationFrameId = window.requestAnimationFrame(animate);
}
export function destroyFluidCursor(): void {
  const existingCanvas = document.getElementById('neo-fluid-cursor-canvas');
  if (existingCanvas) {
    existingCanvas.remove();
  }
  if (animationFrameId !== null) {
    window.cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  if (hideCursorTimeout !== null) {
    clearTimeout(hideCursorTimeout);
    hideCursorTimeout = null;
  }
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler);
    resizeHandler = null;
  }
  if (mouseMoveHandler) {
    window.removeEventListener('mousemove', mouseMoveHandler);
    mouseMoveHandler = null;
  }
  if (mouseDownHandler) {
    window.removeEventListener('mousedown', mouseDownHandler);
    mouseDownHandler = null;
  }
  if (mouseUpHandler) {
    window.removeEventListener('mouseup', mouseUpHandler);
    mouseUpHandler = null;
  }
  if (mouseLeaveHandler) {
    document.removeEventListener('mouseleave', mouseLeaveHandler);
    mouseLeaveHandler = null;
  }
  points = [];
  mouse = { x: 0, y: 0 };
  lastTime = 0;
  canvas = null;
  ctx = null;
  const htmlEl = document.documentElement;
  if (htmlEl) {
    htmlEl.classList.remove('neo-extension-fluid-cursor');
  }
}
export function initFluidCursor(): void {
  if (isMobile()) return;
  loadConfig().then((config) => {
    if (config['fluid-cursor'] === true) {
      document.documentElement.classList.add('neo-extension-fluid-cursor');
      startFluidCursor();
    }
  });
}
export function onFluidCursorClick(): void {
  if (isMobile()) return;
  const htmlEl = document.documentElement;
  const isActive = htmlEl.classList.contains('neo-extension-fluid-cursor');
  if (isActive) {
    destroyFluidCursor();
    saveConfig({ 'fluid-cursor': false } as Partial<Config>);
  } else {
    htmlEl.classList.add('neo-extension-fluid-cursor');
    saveConfig({ 'fluid-cursor': true } as Partial<Config>);
    startFluidCursor();
  }
}
