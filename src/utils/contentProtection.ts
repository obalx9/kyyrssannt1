export function disableContextMenu(): () => void {
  const handleContextMenu = (e: Event) => {
    e.preventDefault();
  };

  const handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length > 1) {
      e.preventDefault();
    }
  };

  document.addEventListener('contextmenu', handleContextMenu);
  document.addEventListener('touchstart', handleTouchStart, { passive: false });

  return () => {
    document.removeEventListener('contextmenu', handleContextMenu);
    document.removeEventListener('touchstart', handleTouchStart);
  };
}

export function disableDragAndDrop(): () => void {
  const handleDragStart = (e: Event) => {
    e.preventDefault();
  };

  document.addEventListener('dragstart', handleDragStart);

  return () => {
    document.removeEventListener('dragstart', handleDragStart);
  };
}

export function disableKeyboardShortcuts(): () => void {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (
      (e.ctrlKey && (e.key === 's' || e.key === 'S')) ||
      (e.ctrlKey && e.shiftKey && (e.key === 'i' || e.key === 'I')) ||
      e.key === 'PrintScreen' ||
      e.key === 'F12'
    ) {
      e.preventDefault();
      return false;
    }
  };

  document.addEventListener('keydown', handleKeyDown);

  return () => {
    document.removeEventListener('keydown', handleKeyDown);
  };
}

export function detectDevTools(): boolean {
  const threshold = 160;
  return (
    window.outerWidth - window.innerWidth > threshold ||
    window.outerHeight - window.innerHeight > threshold
  );
}

export function startDevToolsDetection(callback: () => void) {
  const interval = setInterval(() => {
    if (detectDevTools()) {
      callback();
    }
  }, 1000);

  return () => clearInterval(interval);
}

export function detectScreenRecording(callback: () => void): () => void {
  if ('mediaDevices' in navigator && 'getDisplayMedia' in navigator.mediaDevices) {
    const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia.bind(navigator.mediaDevices);

    navigator.mediaDevices.getDisplayMedia = function(...args) {
      callback();
      return originalGetDisplayMedia(...args);
    };

    return () => {
      navigator.mediaDevices.getDisplayMedia = originalGetDisplayMedia;
    };
  }

  return () => {};
}

export function applyBasicProtection(): () => void {
  const cleanupContextMenu = disableContextMenu();
  const cleanupDragAndDrop = disableDragAndDrop();
  const cleanupKeyboardShortcuts = disableKeyboardShortcuts();

  document.body.style.userSelect = 'none';
  document.body.style.webkitUserSelect = 'none';

  return () => {
    cleanupContextMenu();
    cleanupDragAndDrop();
    cleanupKeyboardShortcuts();
    document.body.style.userSelect = '';
    document.body.style.webkitUserSelect = '';
  };
}

export interface WatermarkConfig {
  text: string;
  opacity?: number;
  fontSize?: number;
  color?: string;
}

export function createDynamicWatermark(config: WatermarkConfig): HTMLDivElement {
  const { text, opacity = 0.15, fontSize = 18, color = '#ffffff' } = config;

  const watermark = document.createElement('div');
  watermark.style.cssText = `
    position: fixed;
    pointer-events: none;
    z-index: 9999;
    font-size: ${fontSize}px;
    color: ${color};
    opacity: ${opacity};
    font-weight: bold;
    white-space: nowrap;
    user-select: none;
    -webkit-user-select: none;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
  `;
  watermark.textContent = text;

  return watermark;
}

export function startDynamicWatermark(config: WatermarkConfig): () => void {
  const watermarks: HTMLDivElement[] = [];
  const positions = [
    { top: '10%', left: '10%' },
    { top: '10%', right: '10%' },
    { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
    { bottom: '10%', left: '10%' },
    { bottom: '10%', right: '10%' },
  ];

  let currentIndex = 0;

  function createWatermarkAtPosition() {
    watermarks.forEach(w => w.remove());
    watermarks.length = 0;

    const watermark = createDynamicWatermark(config);
    const position = positions[currentIndex];
    Object.assign(watermark.style, position);

    document.body.appendChild(watermark);
    watermarks.push(watermark);

    currentIndex = (currentIndex + 1) % positions.length;
  }

  createWatermarkAtPosition();
  const interval = setInterval(createWatermarkAtPosition, 5000);

  return () => {
    clearInterval(interval);
    watermarks.forEach(w => w.remove());
  };
}

export function createVideoWatermark(
  videoElement: HTMLVideoElement,
  config: WatermarkConfig
): () => void {
  const container = videoElement.parentElement;
  if (!container) return () => {};

  container.style.position = 'relative';

  const watermark = createDynamicWatermark(config);
  watermark.style.position = 'absolute';
  watermark.style.top = '50%';
  watermark.style.left = '50%';
  watermark.style.transform = 'translate(-50%, -50%)';

  container.appendChild(watermark);

  const positions = [
    { top: '10%', left: '10%', transform: 'none' },
    { top: '10%', right: '10%', left: 'auto', transform: 'none' },
    { top: '50%', left: '50%', right: 'auto', transform: 'translate(-50%, -50%)' },
    { bottom: '10%', top: 'auto', left: '10%', transform: 'none' },
    { bottom: '10%', top: 'auto', right: '10%', left: 'auto', transform: 'none' },
  ];

  let currentIndex = 0;

  const interval = setInterval(() => {
    currentIndex = (currentIndex + 1) % positions.length;
    Object.assign(watermark.style, positions[currentIndex]);
  }, 5000);

  return () => {
    clearInterval(interval);
    watermark.remove();
  };
}
