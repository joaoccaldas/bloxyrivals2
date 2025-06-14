// characters.js

import { characters } from './characterData.js';

/**
 * Preload character images
 */
const sprites = characters.map(char => { //
  const img = new Image();
  img.src = char.sprite; //
  img.onerror = () => console.error(`Failed to load sprite: ${char.sprite}`); //
  return img;
});

export class CharacterSelectUI {
  constructor(canvas, onSelect, onCancel) {
    this.canvas   = canvas;
    this.ctx      = canvas.getContext('2d');
    this.onSelect = onSelect;
    this.onCancel = onCancel;

    this.boxSize = 120;
    this.spacing = 40;
    this.topY    = canvas.height * 0.2;

    this._clickHandler = this.handleClick.bind(this);
    this._keyHandler   = this.handleKey.bind(this);
    canvas.addEventListener('click', this._clickHandler);
    window.addEventListener('keydown', this._keyHandler);

    this.animate = this.animate.bind(this);
    this._frame = requestAnimationFrame(this.animate); // Initialize _frame
  }

  animate() {
    this.draw();
    this._frame = requestAnimationFrame(this.animate);
  }

  draw() {
    const ctx = this.ctx;
    const C = this.canvas;
    const W = C.width;
    const H = C.height;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#000000aa'; // Semi-transparent black background
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#fff';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Select Your Character', W / 2, this.topY - 40); // Adjusted Y for spacing

    const count  = characters.length; //
    const totalW = count * this.boxSize + (count - 1) * this.spacing;
    const startX = (W - totalW) / 2;

    characters.forEach((char, i) => { //
      const x = startX + i * (this.boxSize + this.spacing);
      const y = this.topY;
      const img = sprites[i];

      // Draw box
      ctx.fillStyle = '#fff';
      ctx.fillRect(x, y, this.boxSize, this.boxSize);

      ctx.strokeStyle = '#888';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, this.boxSize, this.boxSize);

      if (img.complete && img.naturalWidth) {
        const pad = 10;
        ctx.drawImage(
          img,
          x + pad, y + pad,
          this.boxSize - pad * 2,
          this.boxSize - pad * 2
        );
      } else if (!img.complete) {
        ctx.fillStyle = '#555';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '14px sans-serif';
        ctx.fillText('Loading...', x + this.boxSize / 2, y + this.boxSize / 2);
      } else { // Error loading (e.g., naturalWidth is 0 after error)
        ctx.fillStyle = 'red';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '14px sans-serif';
        ctx.fillText('Error', x + this.boxSize / 2, y + this.boxSize / 2);
      }

      // Store data for click handling, including the character's actual ID
      this[`box${i}`] = { x, y, w: this.boxSize, h: this.boxSize, characterId: char.id }; //
    });
  }

  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    for (let i = 0; i < characters.length; i++) { //
      const b = this[`box${i}`];
      if (b && mx >= b.x && mx <= b.x + b.w &&
          my >= b.y && my <= b.y + b.h) {
        this.cleanup();
        this.onSelect(b.characterId); // Use the stored characterId
        return;
      }
    }
    // Removed: Clicking outside boxes no longer automatically cancels.
    // Cancellation is primarily via Escape key.
  }

  handleKey(e) {
    if (e.key === 'Escape') {
      this.cleanup();
      this.onCancel();
    }
  }

  cleanup() {
    if (this._frame) {
      cancelAnimationFrame(this._frame);
      this._frame = null;
    }
    this.canvas.removeEventListener('click', this._clickHandler);
    window.removeEventListener('keydown', this._keyHandler);
  }
}