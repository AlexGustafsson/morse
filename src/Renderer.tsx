import { HTMLProps, useCallback, useEffect, useRef, useState } from "react";
import { AudioManager } from "./morse/audio";
import Renderer from "./morse/renderer";

export type Props = HTMLProps<HTMLCanvasElement> & { audio: AudioManager };

export default function ({ audio, ...rest }: Props): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer>();

  const onAudioStart = useCallback(() => {
    rendererRef.current?.onTouchStart();
  }, [audio, rendererRef]);

  const onAudioStop = useCallback(() => {
    rendererRef.current?.onTouchEnd();
  }, [audio, rendererRef]);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) {
      return;
    }

    const renderer = new Renderer(ctx, 100, 100);
    renderer.start();

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      canvasRef.current!.width = entry.contentRect.width;
      canvasRef.current!.height = entry.contentRect.height;
      renderer.width = entry.contentRect.width;
      renderer.height = entry.contentRect.height;
    });
    observer.observe(canvasRef.current);

    audio.addEventListener("start", onAudioStart);
    audio.addEventListener("stop", onAudioStop);

    rendererRef.current = renderer;
    return () => {
      audio.removeEventListener("start", onAudioStart);
      audio.removeEventListener("stop", onAudioStop);
      observer.disconnect();
    };
  }, [canvasRef, audio]);

  return <canvas ref={canvasRef} {...rest} />;
}
