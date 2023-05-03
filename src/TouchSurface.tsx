import { HTMLProps, useEffect, useRef } from "react";

interface Touch {
  start: number;
  end?: number;
}

/** Speed of lines in pixels per second. */
const SPEED = 150;

class MorseAudioManager {
  private ctx: AudioContext;
  private oscillator: OscillatorNode;
  private gain: GainNode;
  private startedOnce = false;

  constructor() {
    this.ctx = new AudioContext();

    this.oscillator = new OscillatorNode(this.ctx);
    this.oscillator.type = "sine";
    this.oscillator.frequency.value = 440;

    this.gain = new GainNode(this.ctx);

    this.gain.connect(this.ctx.destination);
  }

  public start() {
    if (!this.startedOnce) {
      this.startedOnce = true;
      this.oscillator.start();
    }

    this.oscillator.connect(this.gain);
  }

  public stop() {
    this.oscillator.disconnect();
  }
}

class State {
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

      this.ctx.beginPath();
      this.ctx.lineCap = "round";
      this.ctx.moveTo(center.x - elapsedTimeSinceStart * SPEED, center.y);
      this.ctx.lineTo(center.x - elapsedTimeSinceEnd * SPEED, center.y);
      this.ctx.lineWidth = 10;
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

  public mouseDown(x: number, y: number) {
    this.currentTouch = { start: this.timestamp };
    this.touches.push(this.currentTouch);
  }

  public mouseUp(x: number, y: number) {
    if (this.currentTouch) {
      this.currentTouch.end = this.timestamp;
      this.currentTouch = undefined;
    }
  }
}

export default function (props: HTMLProps<HTMLCanvasElement>): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) {
      return;
    }

    const state = new State(ctx, 100, 100);
    const audio = new MorseAudioManager();

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      canvasRef.current!.width = entry.contentRect.width;
      canvasRef.current!.height = entry.contentRect.height;
      state.width = entry.contentRect.width;
      state.height = entry.contentRect.height;
    });
    observer.observe(canvasRef.current);

    canvasRef.current.addEventListener("mousedown", (event) => {
      const x = event.clientX - canvasRef.current!.offsetLeft;
      const y = event.clientY - canvasRef.current!.offsetTop;
      state.mouseDown(x, y);
      audio.start();
    });

    canvasRef.current.addEventListener("mouseup", (event) => {
      const x = event.clientX - canvasRef.current!.offsetLeft;
      const y = event.clientY - canvasRef.current!.offsetTop;
      state.mouseUp(x, y);
      audio.stop();
    });

    state.start();
  }, [canvasRef]);

  return <canvas ref={canvasRef} {...props} />;
}
