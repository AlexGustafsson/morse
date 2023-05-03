import { useCallback, useEffect, useRef, useState } from "react";
import { AudioManager } from "./morse/audio";
import { ALPHABET, encodeToMorse } from "./morse/codec";
import Renderer from "./Renderer";

export default function (): JSX.Element {
  const [queue, setQueue] = useState<string[]>([]);
  const audioRef = useRef<AudioManager>(new AudioManager());
  const touchAreaRef = useRef<HTMLElement>(null);

  const onPointerDown = useCallback(
    (event: MouseEvent | TouchEvent) => {
      audioRef.current.start();
    },
    [audioRef]
  );

  const onPointerUp = useCallback(
    (event: MouseEvent | TouchEvent) => {
      audioRef.current.stop();
    },
    [audioRef]
  );

  useEffect(() => {
    if (!touchAreaRef.current || !audioRef.current) {
      return;
    }

    touchAreaRef.current.addEventListener("mousedown", onPointerDown);
    touchAreaRef.current.addEventListener("touchstart", onPointerDown);

    touchAreaRef.current.addEventListener("mouseup", onPointerUp);
    touchAreaRef.current.addEventListener("touchend", onPointerUp);
    touchAreaRef.current.addEventListener("touchcancel", onPointerUp);

    return () => {
      touchAreaRef.current?.removeEventListener("mousedown", onPointerDown);
      touchAreaRef.current?.removeEventListener("touchstart", onPointerDown);

      touchAreaRef.current?.removeEventListener("mouseup", onPointerUp);
      touchAreaRef.current?.removeEventListener("touchend", onPointerUp);
      touchAreaRef.current?.removeEventListener("touchcancel", onPointerUp);
    };
  }, [touchAreaRef, audioRef]);

  useEffect(() => {
    document.addEventListener("keyup", (event) => {
      try {
        if (!ALPHABET.includes(event.key.toUpperCase())) {
          return;
        }

        const morse = encodeToMorse(event.key);
        console.log("morse", morse);
        audioRef.current.queue(morse).then(() => {
          setTimeout(() => {
            setQueue((queue) => queue.slice(1));
          }, 100);
        });

        setQueue((queue) => [...queue, event.key]);
      } catch {
        // Do nothing
      }
    });
  }, []);

  return (
    <>
      <header className="fixed w-full p-2 flex justify-center bg-white drop-shadow-sm">
        <h1 className="text-3xl font-bold">Morse</h1>
      </header>
      <main ref={touchAreaRef} className="flex-1 mt-20">
        <Renderer audio={audioRef.current} className="w-full h-full" />
      </main>
      <footer className="fixed w-full bottom-0 flex justify-center">
        <p className="text-xl">{queue.join("")}</p>
      </footer>
    </>
  );
}
