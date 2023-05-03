/** Speed of lines in pixels per second. */
const SPEED = 150;

interface Touch {
  start: number;
  end?: number;
}

export default class Renderer {
  private timestamp: number = 0;
  private touches: Touch[] = [];
  private currentTouch: Touch | undefined;

  constructor(
    public ctx: CanvasRenderingContext2D,
    public width: number,
    public height: number
  ) {}

  public step(timestamp: number) {
    const deltaTime = timestamp - this.timestamp;
    this.timestamp = timestamp;

    this.ctx.clearRect(0, 0, this.width, this.height);

    const center = {
      x: this.width / 2,
      y: this.height / 2,
    };

    for (const touch of this.touches) {
      const elapsedTimeSinceStart = (timestamp - touch.start) / 1000;
      const elapsedTimeSinceEnd = (timestamp - (touch.end || timestamp)) / 1000;

      const startX = center.x - elapsedTimeSinceStart * SPEED;
      const endX = center.x - elapsedTimeSinceEnd * SPEED;
      if (endX < 0) {
        // TODO: Might as well mark for removal?
        continue;
      }

      this.ctx.beginPath();
      this.ctx.lineCap = "round";
      this.ctx.moveTo(startX, center.y);
      this.ctx.lineTo(endX, center.y);
      this.ctx.lineWidth = 20;
      this.ctx.strokeStyle = "#ffffff";
      this.ctx.stroke();
    }
  }

  public start() {
    const handle = (timestamp: number) => {
      this.step(timestamp);
      requestAnimationFrame(handle);
    };
    requestAnimationFrame(handle);
  }

  public onTouchStart() {
    this.currentTouch = { start: this.timestamp };
    this.touches.push(this.currentTouch);
  }

  public onTouchEnd() {
    if (this.currentTouch) {
      // Make sure the touch is at least 100ms so that audio nor rendered lines
      // are too short
      const duration = this.timestamp - this.currentTouch.start;
      this.currentTouch.end = this.currentTouch.start + Math.max(duration, 100);
      this.currentTouch = undefined;
    }
  }
}
