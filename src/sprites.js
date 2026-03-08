// ============================================================================
// Sprite loading
// ============================================================================

const images = {};

export function getSprite(name) {
  return images[name] || null;
}

export function loadSprites() {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { images['bug'] = img; resolve(); };
    img.onerror = () => { console.warn('Failed to load assets/bug.png'); resolve(); };
    img.src = 'assets/bug.png';
  });
}
