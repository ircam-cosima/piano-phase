import { Renderer } from 'soundworks/client';

class SampleRenderer extends Renderer {
  constructor() {
    super();

    this._trigger = false;
  }

  onResize(width, height) {
    const size = Math.min(width, height);
    this.size = size / 2;
    this.paddingLeft = Math.random() * (width - this.size);
    this.paddingTop = Math.random() * (height - this.size);
  }

  trigger() {
    this._trigger = true;
  }

  update(dt) {}

  /**
   * Draw into canvas.
   * Method is called by animation frame loop in current frame rate.
   * @param {CanvasRenderingContext2D} ctx - canvas 2D rendering context
   */
  render(ctx) {
    if (this._trigger) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(this.paddingLeft, this.paddingTop, this.size, this.size);

      this._trigger = false;
    }
  }
}

export default SampleRenderer;
