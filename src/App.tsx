import { useEffect, useState } from "react";
import TouchSurface from "./TouchSurface";

export default function (): JSX.Element {
  const [queue, setQueue] = useState<string[]>([]);

  useEffect(() => {
    document.addEventListener("keyup", (event) => {
      const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz ";
      if (!alphabet.includes(event.key)) {
        return;
      }

      setQueue((queue) => [...queue, event.key]);
    });
  }, []);

  return (
    <>
      <header className="fixed w-full p-2 flex justify-center bg-white drop-shadow-sm">
        <h1 className="text-3xl font-bold">Morse</h1>
      </header>
      <main className="flex-1 mt-20">
        <TouchSurface className="w-full h-full" />
      </main>
      <footer className="fixed w-full bottom-0 flex justify-center">
        <p className="text-xl">{queue.join("")}</p>
      </footer>
    </>
  );
}
