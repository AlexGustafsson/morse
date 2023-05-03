import { HTMLProps, useEffect, useRef } from "react";
import impulseResponseBuffer from "./assets/response.wav?buffer";

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
  private convolver: ConvolverNode;
  private startedOnce = false;

  constructor() {
    this.ctx = new AudioContext();

    this.oscillator = new OscillatorNode(this.ctx);
    this.oscillator.type = "sine";
    this.oscillator.frequency.value = 800;

    this.gain = new GainNode(this.ctx);
    this.gain.connect(this.ctx.destination);

    // Load telephone-like impulse response buffer to get a more realistic sound
    this.convolver = new ConvolverNode(this.ctx);
    this.convolver.connect(this.gain);
    this.ctx
      .decodeAudioData(impulseResponseBuffer)
      .then((buffer) => {
        this.convolver.buffer = buffer;
      })
      .catch((error) => {
        console.error("Failed to load impulse response buffer", error);
      });
  }

  public start() {
    if (!this.startedOnce) {
      this.startedOnce = true;
      this.oscillator.start();
    }

    this.oscillator.connect(this.convolver);
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

  public mouseDown(x: number, y: number) {
    this.currentTouch = { start: this.timestamp };
    this.touches.push(this.currentTouch);
  }

  public mouseUp(x: number, y: number) {
    if (this.currentTouch) {
      // Make sure the touch is at least 100ms so that audio nor rendered lines
      // are too short
      const duration = this.timestamp - this.currentTouch.start;
      this.currentTouch.end = this.currentTouch.start + Math.max(duration, 100);
      this.currentTouch = undefined;
    }
  }
}

function getPointerEventPosition(event: MouseEvent | TouchEvent) {
  return event instanceof MouseEvent
    ? {
        x: event.clientX - (event.target as HTMLElement).offsetLeft,
        y: event.clientY - (event.target as HTMLElement).offsetTop,
      }
    : {
        x: event.touches[0].clientX - (event.target as HTMLElement).offsetLeft,
        y: event.touches[0].clientY - (event.target as HTMLElement).offsetTop,
      };
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

    const onMouseDown = (event: MouseEvent | TouchEvent) => {
      const { x, y } = getPointerEventPosition(event);

      state.mouseDown(x, y);
      audio.start();
    };
    canvasRef.current.addEventListener("mousedown", onMouseDown);
    canvasRef.current.addEventListener("touchstart", onMouseDown);

    const onMouseUp = (event: MouseEvent | TouchEvent) => {
      const { x, y } = getPointerEventPosition(event);

      state.mouseUp(x, y);
      audio.stop();
    };
    canvasRef.current.addEventListener("mouseup", onMouseUp);
    canvasRef.current.addEventListener("touchend", onMouseUp);
    canvasRef.current.addEventListener("touchcancel", onMouseUp);

    state.start();
  }, [canvasRef]);

  return <canvas ref={canvasRef} {...props} />;
}
